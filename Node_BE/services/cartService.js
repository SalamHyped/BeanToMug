const { dbSingleton } = require('../dbSingleton');
const { migrateSessionCartToUser, getCartItems, updateCartTotal } = require('../utils/cartMigration');

/**
 * Cart Service
 * Handles cart operations for both guests and users
 */

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
        order_id: result.order_id, 
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
      // Get current item price from database
      const [itemDetails] = await connection.execute(
        'SELECT price FROM dish WHERE item_id = ?',
        [item.item_id]
      );
      
      if (itemDetails.length === 0) {
        throw new Error('Item not found');
      }
      
      const currentPrice = itemDetails[0].price;
      const optionsJson = JSON.stringify(options || {});
      
      // Check if item with same options already exists in cart
      const [existingItems] = await connection.execute(`
        SELECT * FROM order_items 
        WHERE order_id = ? AND item_id = ? AND item_options = ?
      `, [cartOrder.order_id, item.item_id, optionsJson]);


      if (existingItems.length > 0) {
        // Update existing item quantity
        await connection.execute(`
          UPDATE order_items 
          SET quantity = quantity + ?, updated_at = NOW()
          WHERE id = ?
        `, [quantity, existingItems[0].id]);
      } else {
        // Add new item to cart
        await connection.execute(`
          INSERT INTO order_items (order_id, item_id, quantity, price, item_options, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [cartOrder.order_id, item.item_id, quantity, currentPrice, optionsJson]);
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
      const optionsJson = JSON.stringify(options || {});
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        await connection.execute(`
          DELETE FROM order_items 
          WHERE order_id = ? AND item_id = ? AND item_options = ?
        `, [cartOrder.order_id, itemId, optionsJson]);
      } else {
        // Update quantity
        await connection.execute(`
          UPDATE order_items 
          SET quantity = ?, updated_at = NOW()
          WHERE order_id = ? AND item_id = ? AND item_options = ?
        `, [quantity, cartOrder.order_id, itemId, optionsJson]);
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
      const optionsJson = JSON.stringify(options || {});
      
      await connection.execute(`
        DELETE FROM order_items 
        WHERE order_id = ? AND item_id = ? AND item_options = ?
      `, [cartOrder.order_id, itemId, optionsJson]);
      
      // Update cart total with the correct order_id
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
        DELETE FROM order_items WHERE order_id = ?
      `, [cartOrder.id]);
      
      await connection.execute(`
        UPDATE orders SET total_amount = 0.00 WHERE id = ?
      `, [cartOrder.id]);
      
      await connection.commit();
      
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }
  
  // Session Cart Methods (Guest)
  
  addToSessionCart(sessionCart, item, quantity, options) {
    const cart = {
      items: [...(sessionCart.items || [])],
      orderType: sessionCart.orderType || 'Dine In'
    };
    
    const index = cart.items.findIndex(
      (i) => i.item_id === item.item_id && JSON.stringify(i.options) === JSON.stringify(options)
    );
    
    if (index >= 0) {
      cart.items[index].quantity += quantity;
    } else {
      cart.items.push({ ...item, quantity, options });
    }
    
    return cart;
  }
  
  updateSessionCartQuantity(sessionCart, itemId, quantity, options) {
    const cart = {
      items: [...(sessionCart.items || [])],
      orderType: sessionCart.orderType || 'Dine In'
    };

    const index = cart.items.findIndex(
      (i) => i.item_id === itemId && JSON.stringify(i.options) === JSON.stringify(options)
    );
    
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
  async updateOrderType(userId, orderType) {
    if (!['Dine In', 'Take Away'].includes(orderType)) {
      throw new Error('Invalid order type');
    }

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
  }
}

module.exports = new CartService(); 