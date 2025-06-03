const { dbSingleton } = require('../dbSingleton');

/**
 * Cart Migration Utilities
 * Handles session cart to user database cart migration on login
 */

/**
 * Migrate session cart to user database cart on login
 * @param {number} userId - The user ID logging in
 * @param {Array} sessionCartItems - Cart items from req.session.cart
 * @returns {Object} Migration result with cart items
 */
async function migrateSessionCartToUser(userId, sessionCartItems = []) {
  let connection;
  
  try {
    connection = await dbSingleton.getConnection();
    await connection.beginTransaction();
    
    console.log(`Migrating session cart to user ${userId}: ${sessionCartItems.length} items`);
    
    // Find existing user cart
    const [userCart] = await connection.execute(`
      SELECT * FROM orders 
      WHERE user_id = ? AND is_cart = TRUE
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [userId]);
    
    let finalCartId = null;
    
    if (sessionCartItems.length > 0) {
      if (userCart.length > 0) {
        // User has existing cart - merge session items into it
        console.log('Merging session items into existing user cart');
        finalCartId = await mergeItemsIntoCart(connection, sessionCartItems, userCart[0]);
      } else {
        // No user cart - create new cart with session items
        console.log('Creating new user cart from session items');
        finalCartId = await createCartFromItems(connection, sessionCartItems, userId);
      }
    } else if (userCart.length > 0) {
      // No session items, but user has existing cart
      console.log('No session items - using existing user cart');
      finalCartId = userCart[0].id;
    }
    
    await connection.commit();
    
    // Get final cart items
    const cartItems = finalCartId ? await getCartItems(connection, finalCartId) : [];
    
    console.log(`Cart migration completed: ${cartItems.length} items in final cart`);
    
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
async function mergeItemsIntoCart(connection, sessionItems, userCart) {
  for (const item of sessionItems) {
    // Validate item exists and get current price
    const [itemDetails] = await connection.execute(
      'SELECT item_id, price FROM dish WHERE item_id = ?',
      [item.id]
    );
    
    if (itemDetails.length === 0) {
      console.log(`Item ${item.id} no longer exists - skipping`);
      continue;
    }
    
    const currentPrice = itemDetails[0].price;
    const optionsJson = JSON.stringify(item.options || {});
    
    // Check if item with same options already exists
    const [existingItems] = await connection.execute(`
      SELECT * FROM order_items 
      WHERE order_id = ? AND item_id = ? AND item_options = ?
    `, [userCart.id, item.id, optionsJson]);
    
    if (existingItems.length > 0) {
      // Update quantity
      await connection.execute(`
        UPDATE order_items 
        SET quantity = quantity + ?, updated_at = NOW()
        WHERE id = ?
      `, [item.quantity, existingItems[0].id]);
    } else {
      // Add new item
      await connection.execute(`
        INSERT INTO order_items (order_id, item_id, quantity, price, item_options, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [userCart.id, item.id, item.quantity, currentPrice, optionsJson]);
    }
  }
  
  // Update cart total
  await updateCartTotal(connection, userCart.id);
  return userCart.id;
}

/**
 * Create new user cart from session items
 */
async function createCartFromItems(connection, sessionItems, userId) {
  // Create new cart
  const [cartResult] = await connection.execute(`
    INSERT INTO orders (user_id, is_cart, total_amount, created_at) 
    VALUES (?, TRUE, 0.00, NOW())
  `, [userId]);
  
  const newCartId = cartResult.insertId;
  
  // Add items to cart
  for (const item of sessionItems) {
    // Validate item and get current price
    const [itemDetails] = await connection.execute(
      'SELECT item_id, price FROM dish WHERE item_id = ?',
      [item.id]
    );
    
    if (itemDetails.length === 0) {
      console.log(`Item ${item.id} no longer exists - skipping`);
      continue;
    }
    
    const currentPrice = itemDetails[0].price;
    const optionsJson = JSON.stringify(item.options || {});
    
    await connection.execute(`
      INSERT INTO order_items (order_id, item_id, quantity, price, item_options, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [newCartId, item.id, item.quantity, currentPrice, optionsJson]);
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
    FROM order_items WHERE order_id = ?
  `, [cartId]);
  
  const newTotal = totalResult[0].total;
  
  await connection.execute(`
    UPDATE orders SET total_price = ?, updated_at = NOW() 
    WHERE order_id = ?
  `, [newTotal, cartId]);
  
  return newTotal;
}

/**
 * Get cart items with product details
 */
async function getCartItems(connection, cartId) {
  const [items] = await connection.execute(`
    SELECT 
      oi.*, 
      d.item_name, 
      d.price as current_price
    FROM order_items oi
    JOIN dish d ON oi.item_id = d.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at DESC
  `, [cartId]);
  
  return items.map(item => ({
    id: item.item_id,
    item_name: item.item_name,
    item_price: item.price, // Price when added to cart
    quantity: item.quantity,
    options: item.item_options ? JSON.parse(item.item_options) : {}
  }));
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