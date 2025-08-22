const { dbSingleton } = require('../dbSingleton');
const { validateCartItem, validatePrice, validateOptions } = require('../middleware/cartMiddleware');
const { createOptionsForDisplay } = require('./ingredientProcessor');

/**
 * Cart Migration Utilities
 * Handles session cart to user database cart migration on login
 */

/**
 * Migrate session cart to user database cart on login
 */
async function migrateSessionCartToUser(userId, sessionCartItems = []) {
  let connection;
  
  try {
    connection = await dbSingleton.getConnection();
    await connection.beginTransaction();
    
    // Find existing user cart
    const [userCart] = await connection.execute(`
      SELECT order_id FROM orders 
      WHERE user_id = ? AND is_cart = TRUE
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [userId]);
    
    let finalCartId = null;
    
    if (sessionCartItems.length > 0) {
      if (userCart.length > 0) {
        // User has existing cart - merge session items into it
        finalCartId = await mergeItemsIntoCart(connection, sessionCartItems, userCart[0].order_id);
      } else {
        // No user cart - create new cart with session items
        finalCartId = await createCartFromItems(connection, sessionCartItems, userId);
      }
    } else if (userCart.length > 0) {
      // No session items, but user has existing cart
      finalCartId = userCart[0].order_id;
    }
    
    await connection.commit();
    
    // Get final cart items
    const cartItems = finalCartId ? await getCartItems(connection, finalCartId) : [];
    
    return {
      success: true,
      cartItems,
      cartId: finalCartId,
      migrationPerformed: sessionCartItems.length > 0
    };
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Cart migration error:', error);
    throw new Error(`Cart migration failed: ${error.message}`);
  }
}

/**
 * Merge session items into existing user cart
 */
async function mergeItemsIntoCart(connection, sessionItems, cartId) {


  // Get all items and their current prices in one query
  const itemIds = sessionItems.map(item => item.item_id).filter(id => id != null);
  
  if (itemIds.length === 0) {
    console.log('No valid item IDs found in session items');
    return cartId;
  }

  // Use proper parameter binding for IN clause
  const placeholders = itemIds.map(() => '?').join(',');
  const [itemDetails] = await connection.execute(`
    SELECT item_id, price 
    FROM dish 
    WHERE item_id IN (${placeholders})
  `, itemIds);

  // Create a map for quick price lookup
  const priceMap = new Map(itemDetails.map(item => [item.item_id, item.price]));

  // Get existing items with their ingredients
  const [existingItems] = await connection.execute(`
    SELECT oi.order_item_id, oi.item_id, oi.quantity,
           GROUP_CONCAT(oii.ingredient_id ORDER BY oii.ingredient_id) as ingredient_ids
    FROM order_item oi
    LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
    WHERE oi.order_id = ?
    GROUP BY oi.order_item_id
  `, [cartId]);

  // Create a map for quick lookup of existing items
  const existingMap = new Map();
  existingItems.forEach(item => {
    const key = `${item.item_id}-${item.ingredient_ids || ''}`;
    existingMap.set(key, item);
  });

  // Prepare bulk inserts
  const newItems = [];
  const updateItems = [];

  for (const item of sessionItems) {
    if (!validateCartItem(item)) continue;

    const currentPrice = priceMap.get(item.item_id);
    if (!currentPrice || !validatePrice(currentPrice)) continue;

    if (item.options && !validateOptions(item.options)) continue;

    // Create key for existing item lookup
    const selectedIngredientIds = item.options ? 
      Object.entries(item.options)
        .filter(([_, opt]) => opt.selected)
        .map(([id]) => id)
        .sort()
        .join(',') : '';
    
    const key = `${item.item_id}-${selectedIngredientIds}`;
    const existingItem = existingMap.get(key);

    if (existingItem) {
      // Update quantity
      updateItems.push([item.quantity, existingItem.order_item_id]);
    } else {
      // Add new item
      newItems.push([cartId, item.item_id, item.quantity, currentPrice]);
    }
  }

  // Execute bulk operations
  if (updateItems.length > 0) {
    for (const [quantity, orderItemId] of updateItems) {
      await connection.execute(`
        UPDATE order_item 
        SET quantity = quantity + ?, updated_at = NOW()
        WHERE order_item_id = ?
      `, [quantity, orderItemId]);
    }
  }

  if (newItems.length > 0) {
    // Use individual inserts instead of bulk insert to avoid syntax issues
    const insertedIds = [];
    
    for (const item of newItems) {
      const [result] = await connection.execute(`
        INSERT INTO order_item (order_id, item_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, item);
      insertedIds.push(result.insertId);
    }

    // Add ingredients for new items
    for (let i = 0; i < sessionItems.length; i++) {
      const item = sessionItems[i];
      const orderItemId = insertedIds[i];
      
      if (item.options) {
        // Get ingredient prices from database
        const ingredientIds = Object.keys(item.options).filter(id => item.options[id].selected);
        if (ingredientIds.length > 0) {
          const placeholders = ingredientIds.map(() => '?').join(',');
          const [ingredients] = await connection.execute(`
            SELECT ingredient_id, price
            FROM ingredient
            WHERE ingredient_id IN (${placeholders})
          `, ingredientIds);
          
          const ingredientMap = new Map(ingredients.map(ing => [ing.ingredient_id.toString(), ing.price]));
          
          for (const [optionId, option] of Object.entries(item.options)) {
            if (option.selected) {
              const ingredientPrice = ingredientMap.get(optionId) || 0;
              await connection.execute(`
                INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price)
                VALUES (?, ?, ?)
              `, [orderItemId, optionId, ingredientPrice]);
            }
          }
        }
      }
    }
  }

  // Update cart total
  await updateCartTotal(connection, cartId);
  return cartId;
}

/**
 * Create new user cart from session items
 */
async function createCartFromItems(connection, sessionItems, userId) {
  // Get all items and their current prices in one query
  const itemIds = sessionItems.map(item => item.item_id);
  const placeholders = itemIds.map(() => '?').join(',');
  const [itemDetails] = await connection.execute(`
    SELECT item_id, price 
    FROM dish 
    WHERE item_id IN (${placeholders})
  `, itemIds);

  // Create a map for quick price lookup
  const priceMap = new Map(itemDetails.map(item => [item.item_id, item.price]));

  // Create new cart
  const [cartResult] = await connection.execute(`
    INSERT INTO orders (user_id, is_cart, total_price, created_at) 
    VALUES (?, TRUE, 0.00, NOW())
  `, [userId]);
  
  const newCartId = cartResult.insertId;

  // Prepare bulk inserts
  const newItems = [];

  for (const item of sessionItems) {
    if (!validateCartItem(item)) continue;

    const currentPrice = priceMap.get(item.item_id);
    if (!currentPrice || !validatePrice(currentPrice)) continue;

    if (item.options && !validateOptions(item.options)) continue;

    // Add item to cart
    newItems.push([newCartId, item.item_id, item.quantity, currentPrice]);
  }

  if (newItems.length > 0) {
    // Use individual inserts instead of bulk insert to avoid syntax issues
    const insertedIds = [];
    
    for (const item of newItems) {
      const [result] = await connection.execute(`
        INSERT INTO order_item (order_id, item_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, item);
      insertedIds.push(result.insertId);
    }

    // Add ingredients for new items
    for (let i = 0; i < sessionItems.length; i++) {
      const item = sessionItems[i];
      const orderItemId = insertedIds[i];
      
      if (item.options) {
        // Get ingredient prices from database
        const ingredientIds = Object.keys(item.options).filter(id => item.options[id].selected);
        if (ingredientIds.length > 0) {
          const placeholders = ingredientIds.map(() => '?').join(',');
          const [ingredients] = await connection.execute(`
            SELECT ingredient_id, price
            FROM ingredient
            WHERE ingredient_id IN (${placeholders})
          `, ingredientIds);
          
          const ingredientMap = new Map(ingredients.map(ing => [ing.ingredient_id.toString(), ing.price]));
          
          for (const [optionId, option] of Object.entries(item.options)) {
            if (option.selected) {
              const ingredientPrice = ingredientMap.get(optionId) || 0;
              await connection.execute(`
                INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price)
                VALUES (?, ?, ?)
              `, [orderItemId, optionId, ingredientPrice]);
            }
          }
        }
      }
    }
  }
  
  // Update cart total
  await updateCartTotal(connection, newCartId);
  return newCartId;
}

/**
 * Update cart total amount
 */
async function updateCartTotal(connection, cartId) {
  const [totalResult] = await connection.execute(`
    SELECT COALESCE(SUM(price * quantity), 0) as total
    FROM order_item WHERE order_id = ?
  `, [cartId]);
  
  await connection.execute(`
    UPDATE orders SET total_price = ?, updated_at = ? 
    WHERE order_id = ?
  `, [totalResult[0].total, new Date().toISOString(), cartId]);
  
  return totalResult[0].total;
}

/**
 * Get cart items with product details
 */
async function getCartItems(connection, cartId) {
  const [items] = await connection.execute(`
    SELECT 
      oi.order_item_id,
      oi.item_id,
      oi.quantity,
      oi.price,
      oi.price_with_vat,
      oi.vat_amount,
      oi.created_at,
      d.item_name,
      d.price as current_price
    FROM order_item oi
    JOIN dish d ON oi.item_id = d.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at DESC
  `, [cartId]);
  
  const result = [];
  
  for (const item of items) {
    // Get ingredients for this order item
    const [ingredients] = await connection.execute(`
      SELECT 
        oii.ingredient_id,
        oii.price,
        i.ingredient_name,
        it.name as type_name
      FROM order_item_ingredient oii
      JOIN ingredient i ON oii.ingredient_id = i.ingredient_id
      JOIN ingredient_type it ON i.type_id = it.id
      WHERE oii.order_item_id = ?
    `, [item.order_item_id]);
    
    // Convert to session cart structure
    const options = {};
    ingredients.forEach(ing => {
      options[ing.ingredient_id] = {
        selected: true,
        label: ing.type_name,
        value: ing.ingredient_name,
        price: ing.price
      };
    });
    
    result.push({
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      priceWithVAT: item.price_with_vat || item.price, // Fallback for items without VAT data
      vatAmount: item.vat_amount || 0, // Default to 0 if no VAT data
      quantity: item.quantity,
      options: options,
      total_price: item.price * item.quantity
    });
  }
  
  return result;
}

/**
 * Get user's cart from database
 */
async function getUserCart(userId) {
  const connection = await dbSingleton.getConnection();
  
  const [userCart] = await connection.execute(`
    SELECT * FROM orders 
    WHERE user_id = ? AND is_cart = TRUE
    ORDER BY updated_at DESC 
    LIMIT 1
  `, [userId]);
  
  return userCart.length > 0 ? userCart[0] : null;
}

module.exports = {
  migrateSessionCartToUser,
  getUserCart,
  getCartItems,
  updateCartTotal
}; 

