const { dbSingleton } = require('../dbSingleton');
const { migrateSessionCartToUser, getCartItems, updateCartTotal } = require('../utils/cartMigration');

/**
 * Cart Service
 * Handles cart operations for both guests and users
 */

/**
 * Get available ingredients for a menu item
 */
async function getAvailableIngredients(itemId) {
  let connection;
  
  try {
    connection = await dbSingleton.getConnection();
    
    // Get all ingredients for the item with their prices
    const [ingredients] = await connection.execute(`
      SELECT 
        i.ingredient_id, 
        i.ingredient_name, 
        i.price, 
        i.quantity_in_stock, 
        i.status,
        ic.name as category_name,
        iii.quantity_required,
        it.option_group,
        it.name as option_label
      FROM ingredients_in_item iii
      JOIN ingredient i ON iii.ingredient_id = i.ingredient_id
      JOIN ingredient_category ic ON i.type_id = ic.type_id
      JOIN ingredient_type it ON i.type_id = it.id
      WHERE iii.item_id = ? AND i.status = 1
      ORDER BY it.option_group, it.name
    `, [itemId]);

    // Group ingredients by option group
    const groupedIngredients = ingredients.reduce((acc, ing) => {
      const key = ing.category_name;
      if (!acc[key]) {
        acc[key] = {
          group: ing.option_group,
          label: ing.option_label,
          required: ing.quantity_required > 0,
          category: ing.category_name,
          ingredients: []
        };
      }
      acc[key].ingredients.push({
        id: ing.ingredient_id,
        name: ing.ingredient_name,
        price: ing.price,
        stock: ing.quantity_in_stock,
        status: ing.status,
        quantityRequired: ing.quantity_required
      });
      
      return acc;
    }, {});

    console.log('Grouped ingredients:', groupedIngredients);

    return Object.values(groupedIngredients);

  } catch (error) {
    console.error('Error getting available ingredients:', error);
    throw new Error('Failed to get available ingredients');
  }
}

class CartService {
  
  /**
   * Get cart for user or guest
   */
  async getCart(userId, sessionCart = []) {
    if (userId) {
      // User is logged in - get cart from database
      const cartOrder = await this.getOrCreateUserCart(userId);

      if (cartOrder) {
        const connection = await dbSingleton.getConnection();
        const cartItems = await getCartItems(connection, cartOrder.order_id);
        return {
          items: cartItems,
          orderType: cartOrder.order_type
        };
      } else {
        return {
          items: [],
          orderType: 'Dine In'
        };
      }
    } else {
      // Guest user - return session cart
      return {
        items: sessionCart.items,
        orderType: sessionCart.orderType || 'Dine In' 
      };
    }
  }
  
  /**
   * Add item to cart
   */
  async addToCart(userId, sessionCart, item, quantity, options) {
   
    if (!item || !item.item_id || quantity <= 0) {
      throw new Error('Invalid item or quantity');
    }
    
    if (userId) {
  
      // User is logged in - save to database
      return await this.addToUserCart(userId, item, quantity, options);
    } else {
      // Guest user - save to session
      return this.addToSessionCart(sessionCart, item, quantity, options);
    }
  }
  
  /**
   * Update item quantity in cart
   */
  async updateQuantity(userId, sessionCart, itemId, quantity, options) {
    if (userId) {
      // User is logged in - update in database
      return await this.updateUserCartQuantity(userId, itemId, quantity, options);
    } else {
      // Guest user - update in session
      return this.updateSessionCartQuantity(sessionCart, itemId, quantity, options);
    }
  }
  
  /**
   * Remove item from cart
   */
  async removeFromCart(userId, sessionCart, itemId, options) {
    if (userId) {
      // User is logged in - remove from database
      return await this.removeFromUserCart(userId, itemId, options);
    } else {
      // Guest user - remove from session
      return this.removeFromSessionCart(sessionCart, itemId, options);
    }
  }
  
  /**
   * Clear entire cart
   */
  async clearCart(userId) {
    if (userId) {
      // User is logged in - clear from database
      await this.clearUserCart(userId);
    }
    // Session cart will be cleared by setting req.session.cart = []
     return [];       
  }
  
  /**
   * Migrate session cart to user cart on login
   */
  async migrateSessionToUser(userId, sessionCart) {
    console.log(sessionCart);
   
    return await migrateSessionCartToUser(userId, sessionCart);
  }
  
  // User Cart Methods (Database)
  
  async getOrCreateUserCart(userId) {
    const connection = await dbSingleton.getConnection();
    
    try {
      // Try to find existing user cart
      const [existingCart] = await connection.execute(`
        SELECT * FROM orders 
        WHERE user_id = ? AND is_cart = TRUE
        ORDER BY updated_at DESC 
        LIMIT 1
      `, [userId]);
      if (existingCart.length > 0) {
        return existingCart[0];
      }
      
      // Create new cart order for user
      const [result] = await connection.execute(`
        INSERT INTO orders (user_id, is_cart, total_price, order_type, created_at) 
        VALUES (?, TRUE, 0.00, 'Dine In', NOW())
      `, [userId]);
      
      return { 
        order_id: result.insertId, 
        user_id: userId,
        total_price: 0.00, 
        is_cart: true,
        order_type: 'Dine In'
      };
      
    } catch (error) {
      console.error('Error getting/creating cart order:', error);
      throw error;
    }
  }
  
  async addToUserCart(userId, item, quantity, options) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();
      
      const cartOrder = await this.getOrCreateUserCart(userId);

      // Get current item price and validate item exists
      const [itemDetails] = await connection.execute(
        'SELECT price FROM dish WHERE item_id = ?',
        [item.item_id]
      );
      
      if (itemDetails.length === 0) {
        throw new Error('Item not found');
      }

      // Calculate total price including ingredient prices
      let totalPrice = itemDetails[0].price;
      const selectedIngredients = [];

      if (options && item.options) {
        // Get ingredient prices from the database
        const [ingredients] = await connection.execute(`
          SELECT i.ingredient_id, i.ingredient_name, i.price
          FROM ingredient i
          JOIN ingredients_in_item ii ON i.ingredient_id = ii.ingredient_id
          WHERE ii.item_id = ?
        `, [item.item_id]);

        // Add prices for selected ingredients
        Object.entries(options).forEach(([group, groupOptions]) => {
          if (groupOptions) {
            const optionGroup = item.options[group];
            if (optionGroup) {
              optionGroup.types.forEach(type => {
                if (type.type === 'select') {
                  const selectedValue = groupOptions[type.label];
                  if (selectedValue) {
                    const ingredient = ingredients.find(ing => ing.ingredient_name === selectedValue);
                    if (ingredient) {
                      totalPrice += ingredient.price;
                      selectedIngredients.push({
                        ingredient_id: ingredient.ingredient_id,
                        price: ingredient.price
                      });
                    }
                  }
                } else if (type.type === 'checkbox') {
                  type.values.forEach(value => {
                    if (groupOptions[value]) {
                      const ingredient = ingredients.find(ing => ing.ingredient_name === value);
                      if (ingredient) {
                        totalPrice += ingredient.price;
                        selectedIngredients.push({
                          ingredient_id: ingredient.ingredient_id,
                          price: ingredient.price
                        });
                      }
                    }
                  });
                }
              });
            }
          }
        });
      }
      
      // Check if item with same options already exists in cart
      const [existingItems] = await connection.execute(`
        SELECT oi.order_item_id 
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
        HAVING COUNT(DISTINCT oii.ingredient_id) = ?
      `, [cartOrder.order_id, item.item_id, selectedIngredients.length]);

      if (existingItems.length > 0) {
        // Update existing item quantity
        await connection.execute(`
          UPDATE order_item 
          SET quantity = quantity + ?, updated_at = NOW()
          WHERE order_item_id = ?
        `, [quantity, existingItems[0].order_item_id]);
      } else {
        // Add new item to cart
        const [result] = await connection.execute(`
          INSERT INTO order_item (order_id, item_id, quantity, price, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, [cartOrder.order_id, item.item_id, quantity, totalPrice]);

        // Add selected ingredients
        for (const ingredient of selectedIngredients) {
          await connection.execute(`
            INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price, created_at)
            VALUES (?, ?, ?, NOW())
          `, [result.insertId, ingredient.ingredient_id, ingredient.price]);
        }
      }
      
      // Update cart total
      await updateCartTotal(connection, cartOrder.order_id);
      await connection.commit();
      
      // Get updated cart items
      return await getCartItems(connection, cartOrder.order_id);
      
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }
  
  async updateUserCartQuantity(userId, itemId, quantity, options) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();
      
      const cartOrder = await this.getOrCreateUserCart(userId);

      // Get current item price and ingredient prices
      const [itemDetails] = await connection.execute(
        'SELECT price FROM dish WHERE item_id = ?',
        [itemId]
      );

      if (itemDetails.length === 0) {
        throw new Error('Item not found');
      }

      // Calculate total price including ingredient prices
      let totalPrice = itemDetails[0].price;
      const selectedIngredients = [];

      if (options) {
        const [ingredients] = await connection.execute(`
          SELECT i.ingredient_id, i.ingredient_name, i.price
          FROM ingredient i
          JOIN ingredients_in_item ii ON i.ingredient_id = ii.ingredient_id
          WHERE ii.item_id = ?
        `, [itemId]);

        Object.entries(options).forEach(([key, value]) => {
          if (value) {
            const ingredient = ingredients.find(ing => ing.ingredient_name === value);
            if (ingredient) {
              totalPrice += ingredient.price;
              selectedIngredients.push({
                ingredient_id: ingredient.ingredient_id,
                price: ingredient.price
              });
            }
          }
        });
      }
      
      // Find matching order item
      const [orderItems] = await connection.execute(`
        SELECT oi.order_item_id 
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
        HAVING COUNT(DISTINCT oii.ingredient_id) = ?
      `, [cartOrder.order_id, itemId, selectedIngredients.length]);

      if (orderItems.length === 0) {
        throw new Error('Item not found in cart');
      }

      const orderItemId = orderItems[0].order_item_id;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        await connection.execute(`
          DELETE FROM order_item_ingredient WHERE order_item_id = ?
        `, [orderItemId]);
        
        await connection.execute(`
          DELETE FROM order_item WHERE order_item_id = ?
        `, [orderItemId]);
      } else {
        // Update quantity and price
        await connection.execute(`
          UPDATE order_item 
          SET quantity = ?, price = ?, updated_at = NOW()
          WHERE order_item_id = ?
        `, [quantity, totalPrice, orderItemId]);

        // Update ingredients
        await connection.execute(`
          DELETE FROM order_item_ingredient WHERE order_item_id = ?
        `, [orderItemId]);

        for (const ingredient of selectedIngredients) {
          await connection.execute(`
            INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price, created_at)
            VALUES (?, ?, ?, NOW())
          `, [orderItemId, ingredient.ingredient_id, ingredient.price]);
        }
      }
     
      await updateCartTotal(connection, cartOrder.order_id);
      await connection.commit();
      
      // Get updated cart items
      const updatedItems = await getCartItems(connection, cartOrder.order_id);
      return {
        items: updatedItems,
        orderType: cartOrder.order_type
      };
      
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }
  
  async removeFromUserCart(userId, itemId, options) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();
      
      const cartOrder = await this.getOrCreateUserCart(userId);

      // Find matching order item
      const [orderItems] = await connection.execute(`
        SELECT oi.order_item_id 
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
        HAVING COUNT(DISTINCT oii.ingredient_id) = ?
      `, [cartOrder.order_id, itemId, options ? Object.keys(options).length : 0]);

      if (orderItems.length === 0) {
        throw new Error('Item not found in cart');
      }

      const orderItemId = orderItems[0].order_item_id;
      
      // Remove ingredients first
      await connection.execute(`
        DELETE FROM order_item_ingredient WHERE order_item_id = ?
      `, [orderItemId]);
      
      // Remove order item
      await connection.execute(`
        DELETE FROM order_item WHERE order_item_id = ?
      `, [orderItemId]);
      
      await updateCartTotal(connection, cartOrder.order_id);
      await connection.commit();
      
      return await getCartItems(connection, cartOrder.order_id);
      
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }
  
  async clearUserCart(userId) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();
      
      const cartOrder = await this.getOrCreateUserCart(userId);
      
      await connection.execute(`
        DELETE FROM order_item WHERE order_id = ?
      `, [cartOrder.order_id]);
      
      await connection.execute(`
        UPDATE orders SET total_price = 0.00 WHERE order_id = ?
      `, [cartOrder.order_id]);
      
      await connection.commit();
      
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }
  
  // Session Cart Methods (Guest)
  
  addToSessionCart(sessionCart, item, quantity, options) {
  

    // Initialize cart if it doesn't exist
    const cart = {
      items: Array.isArray(sessionCart?.items) ? [...sessionCart.items] : [],
      orderType: sessionCart?.orderType || 'Dine In'
    };
    console.log("Initialized cart:", cart);

    // Calculate total price including ingredient prices
    let totalPrice = item.price;
    const selectedIngredients = [];

    if (options && item.options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value) {
          const option = item.options[key];
          if (option) {
            if (option.type === "select") {
              const ingredient = option.ingredients.find(ing => ing.name === value);
              if (ingredient) {
                totalPrice += ingredient.price;
                selectedIngredients.push({
                  ingredient_id: ingredient.id,
                  name: ingredient.name,
                  price: ingredient.price
                });
              }
            } else if (option.type === "checkbox") {
              const ingredient = option.ingredients.find(ing => ing.name === key);
              if (ingredient) {
                totalPrice += ingredient.price;
                selectedIngredients.push({
                  ingredient_id: ingredient.id,
                  name: ingredient.name,
                  price: ingredient.price
                });
              }
            }
          }
        }
      });
    }

    const itemWithPrice = {
      ...item,
      item_price: totalPrice,
      selectedIngredients
    };
    console.log("Item with price:", itemWithPrice);

    // Find existing item with same options
    const existingItemIndex = cart.items.findIndex(
      (i) => i.item_id === item.item_id && JSON.stringify(i.options) === JSON.stringify(options)
    );
    console.log("Existing item index:", existingItemIndex);

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
      console.log("Updated existing item:", cart.items[existingItemIndex]);
    } else {
      // Add new item to cart
      cart.items.push({ ...itemWithPrice, quantity, options });
      console.log("Added new item:", cart.items[cart.items.length - 1]);
    }

    console.log("Final cart:", cart);
    return cart;
  }
  
  updateSessionCartQuantity(sessionCart, itemId, quantity, options) {
    console.log("Updating session cart quantity:", { itemId, quantity, options });
    const cart = {
      items: [...(sessionCart.items || [])],
      orderType: sessionCart.orderType || 'Dine In'
    };

    const index = cart.items.findIndex(
      (i) => i.item_id === itemId && JSON.stringify(i.options) === JSON.stringify(options)
    );
    console.log("Index:", index);
    
    if (index >= 0) {
      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = quantity;
      }
      return { success: true, cart };
    } else {
      return { success: false, error: 'Item not found in cart' };
    }
  }
  
  removeFromSessionCart(sessionCart, itemId, options) {
    const cart = {
      items: [...(sessionCart.items || [])],
      orderType: sessionCart.orderType || 'Dine In'
    };
    
    const index = cart.items.findIndex(
      (i) => i.item_id === itemId && JSON.stringify(i.options) === JSON.stringify(options)
    );
    console.log("Index:", index);
    if (index >= 0) {
      cart.items.splice(index, 1);
      return { success: true, cart };
    } else {
      return { success: false, error: 'Item not found in cart' };
    }
  }

  /**
   * Update order type
   */
  async updateOrderType(userId, orderType, sessionCart) {
    if (!['Dine In', 'Take Away'].includes(orderType)) {
      throw new Error('Invalid order type');
    }

    if (userId) {
      // Logged in user - update in database
      const connection = await dbSingleton.getConnection();
      try {
        const cartOrder = await this.getOrCreateUserCart(userId);
        
        await connection.execute(`
          UPDATE orders 
          SET order_type = ?, updated_at = NOW()
          WHERE order_id = ?
        `, [orderType, cartOrder.order_id]);

        return {
          success: true,
          orderType
        };
      } catch (error) {
        console.error('Error updating order type:', error);
        throw error;
      }
    } else {
      // Guest user - update in session
      if (!sessionCart) {
        throw new Error('Session cart not found');
      }
      
      sessionCart.orderType = orderType;
      return {
        success: true,
        orderType
      };
    }
  }

  async getAvailableIngredients(itemId) {
    return getAvailableIngredients(itemId);
  }
}

module.exports = new CartService(); 