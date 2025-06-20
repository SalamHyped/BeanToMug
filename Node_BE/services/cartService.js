const { dbSingleton } = require('../dbSingleton');
const { migrateSessionCartToUser, getCartItems, updateCartTotal } = require('../utils/cartMigration');

/**
 * Cart Service
 * Handles cart operations for both guests and users
 */

/**
 * Get available ingredients for a menu item
 * Fetches all ingredients that can be added to a specific menu item
 * Groups ingredients by category (syrups, toppings, etc.) for easy selection
 * @param {number} itemId - The ID of the menu item
 * @returns {Array} Array of ingredient groups with their details
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
        it.name as option_label,
        it.is_physical
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
          isPhysical: ing.is_physical,
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
   * Retrieves the current cart contents based on user authentication status
   * For logged-in users: fetches from database
   * For guests: returns session cart data
   * @param {number|null} userId - User ID if logged in, null for guests
   * @param {Object} sessionCart - Session cart data for guests
   * @returns {Object} Cart object with items and order type
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
   * Adds a menu item to the cart with specified quantity and customizations
   * Handles both logged-in users (database) and guests (session)
   * @param {number|null} userId - User ID if logged in, null for guests
   * @param {Object} sessionCart - Current session cart for guests
   * @param {Object} item - Menu item to add
   * @param {number} quantity - Quantity to add
   * @param {Object} options - Customization options (ingredients, etc.)
   * @returns {Object} Updated cart data
   */
  async addToCart(userId, sessionCart, item, quantity, options) {
    if (userId) {
      // User is logged in - add to database cart
     
      return await this.addToUserCart(userId, item, quantity, options);
    } else {
      // Guest user - add to session cart
      return await this.addToSessionCart(sessionCart, item, quantity, options);
    }
  }
  
  /**
   * Update item quantity in cart
   * Changes the quantity of an existing item in the cart
   * Handles both logged-in users (database) and guests (session)
   * @param {number|null} userId - User ID if logged in, null for guests
   * @param {Object} sessionCart - Current session cart for guests
   * @param {number} itemId - ID of the item to update
   * @param {number} quantity - New quantity
   * @param {Object} options - Customization options to match
   * @returns {Object} Success status and updated cart
   */
  async updateQuantity(userId, sessionCart, itemId, quantity, options) {
    if (userId) {
      // User is logged in - update in database
      try {
        const updatedCart = await this.updateUserCartQuantity(userId, itemId, quantity, options);
        return {
          success: true,
          cart: updatedCart
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    } else {
      // Guest user - update in session
      return this.updateSessionCartQuantity(sessionCart, itemId, quantity, options);
    }
  }
  
  /**
   * Remove item from cart
   * Removes a specific item from the cart based on item ID and options
   * Handles both logged-in users (database) and guests (session)
   * @param {number|null} userId - User ID if logged in, null for guests
   * @param {Object} sessionCart - Current session cart for guests
   * @param {number} itemId - ID of the item to remove
   * @param {Object} options - Customization options to match for removal
   * @returns {Object} Success status and updated cart
   */
  async removeFromCart(userId, sessionCart, itemId, options) {
    if (userId) {
      // User is logged in - remove from database
      try {
        const updatedCart = await this.removeFromUserCart(userId, itemId, options);
        return {
          success: true,
          cart: {
            items: updatedCart,
            orderType: 'Dine In'
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    } else {
      // Guest user - remove from session
      return this.removeFromSessionCart(sessionCart, itemId, options);
    }
  }
  
  /**
   * Clear entire cart
   * Removes all items from the cart
   * For logged-in users: clears database cart
   * For guests: session cart should be cleared by setting req.session.cart = []
   * @param {number|null} userId - User ID if logged in, null for guests
   * @returns {Array} Empty array representing cleared cart
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
   * Transfers guest cart items to user's database cart when they log in
   * Prevents loss of cart items during authentication
   * @param {number} userId - User ID of the logged-in user
   * @param {Object} sessionCart - Session cart data to migrate
   * @returns {Object} Result of migration operation
   */
  async migrateSessionToUser(userId, sessionCart) {
   
    return await migrateSessionCartToUser(userId, sessionCart);
  }
  
  // User Cart Methods (Database)
  
  /**
   * Get or create user cart in database
   * Finds existing cart for user or creates a new one if none exists
   * Ensures every logged-in user has a cart record in the database
   * @param {number} userId - User ID
   * @returns {Object|null} Cart order object or null if creation fails
   */
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
  
  /**
   * Add item to user's database cart
   * Adds a menu item with customizations to the user's cart in the database
   * Handles ingredient additions and price calculations
   * Updates existing items if same item with same options already exists
   * @param {number} userId - User ID
   * @param {Object} item - Menu item to add
   * @param {number} quantity - Quantity to add
   * @param {Object} options - Customization options (ingredients, etc.)
   * @returns {Object} Updated cart with items and order type
   */
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

      if (options && Object.keys(options).length > 0) {
        const ingredientIds = Object.keys(options).filter(id => options[id].selected);
        if (ingredientIds.length > 0) {
          const placeholders = ingredientIds.map(() => '?').join(',');
          const [ingredients] = await connection.execute(`
            SELECT ingredient_id, ingredient_name, price
            FROM ingredient
            WHERE ingredient_id IN (${placeholders})
          `, ingredientIds);
          
          const ingredientMap = new Map(ingredients.map(ing => [ing.ingredient_id.toString(), ing]));
          
          // Process selected options using session cart structure
          for (const [optionId, option] of Object.entries(options)) {
            if (option.selected) {
              const ingredient = ingredientMap.get(optionId);
              if (ingredient) {
                totalPrice += ingredient.price;
                selectedIngredients.push({
                  ingredient_id: ingredient.ingredient_id,
                  price: ingredient.price
                });
              }
            }
          }
        }
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
            INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price)
            VALUES (?, ?, ?)
          `, [result.insertId, ingredient.ingredient_id, ingredient.price]);
        }
      }
      
      // Update cart total
      await updateCartTotal(connection, cartOrder.order_id);
      await connection.commit();
      
      // Get updated cart items and return in correct format
      const cartItems = await getCartItems(connection, cartOrder.order_id);
      console.log('Final cart items:', cartItems);
      
      return {
        items: cartItems,
        orderType: cartOrder.order_type
      };
      
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }
  
  /**
   * Update quantity of item in user's database cart
   * Changes the quantity of an existing item in the user's cart
   * Recalculates prices based on current item and ingredient costs
   * @param {number} userId - User ID
   * @param {number} itemId - ID of the item to update
   * @param {number} quantity - New quantity
   * @param {Object} options - Customization options to match
   * @returns {Array} Updated cart items array
   */
  async updateUserCartQuantity(userId, itemId, quantity, options) {
    let connection;
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      const cartOrder = await this.getOrCreateUserCart(userId);

      // Get current item price and ingredient prices
      const [itemDetails] = await connection.query(
        'SELECT price FROM dish WHERE item_id = ?',
        [itemId]
      );

      if (itemDetails.length === 0) {
        throw new Error('Item not found');
      }

      // Calculate total price including ingredient prices
      let totalPrice = itemDetails[0].price;
      const selectedIngredients = [];

      if (options && Object.keys(options).length > 0) {
        const ingredientIds = Object.keys(options).filter(id => options[id].selected);
        if (ingredientIds.length > 0) {
          const placeholders = ingredientIds.map(() => '?').join(',');
          const [ingredients] = await connection.execute(`
            SELECT ingredient_id, ingredient_name, price
            FROM ingredient
            WHERE ingredient_id IN (${placeholders})
          `, ingredientIds);
          
          const ingredientMap = new Map(ingredients.map(ing => [ing.ingredient_id.toString(), ing]));
          
          // Process selected options using session cart structure
          for (const [optionId, option] of Object.entries(options)) {
            if (option.selected) {
              const ingredient = ingredientMap.get(optionId);
              if (ingredient) {
                totalPrice += ingredient.price;
                selectedIngredients.push({
                  ingredient_id: ingredient.ingredient_id,
                  price: ingredient.price
                });
              }
            }
          }
        }
      }
      
      // Find matching order item
      const [orderItems] = await connection.execute(`
        SELECT oi.order_item_id 
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
        HAVING COUNT(DISTINCT oii.ingredient_id) = ?
      `, [cartOrder.order_id, itemId, options ? Object.keys(options).filter(id => options[id].selected).length : 0]);

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
            INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price)
            VALUES (?, ?, ?)
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
  
  /**
   * Remove item from user's database cart
   * Removes a specific item with matching options from the user's cart
   * Handles ingredient cleanup and cart total recalculation
   * @param {number} userId - User ID
   * @param {number} itemId - ID of the item to remove
   * @param {Object} options - Customization options to match for removal
   * @returns {Array} Updated cart items array
   */
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
      `, [cartOrder.order_id, itemId, options ? Object.keys(options).filter(id => options[id].selected).length : 0]);

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
  
  /**
   * Clear user's database cart
   * Removes all items from the user's cart and resets total price to zero
   * @param {number} userId - User ID
   */
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
  
  /**
   * Add item to session cart (for guest users)
   * Adds a menu item with customizations to the session cart
   * Calculates total price including ingredient costs
   * Updates existing items if same item with same options already exists
   * @param {Object} sessionCart - Current session cart object
   * @param {Object} item - Menu item to add
   * @param {number} quantity - Quantity to add
   * @param {Object} options - Customization options (ingredients, etc.)
   * @returns {Object} Updated session cart
   */
  async addToSessionCart(sessionCart, item, quantity, options) {
    try {
      // Initialize cart if it doesn't exist
      if (!sessionCart) {
        sessionCart = {
          items: [],
          orderType: 'Dine In'
        };
      }

      // Ensure items array exists
      if (!sessionCart.items) {
        sessionCart.items = [];
      }

      // Calculate total price based on selected ingredients
      let totalPrice = parseFloat(item.price) || 0;
      if (options) {
        for (const [ingredientId, option] of Object.entries(options)) {
          if (option.selected) {
            // Convert ingredientId to number if it's a string
            const numericIngredientId = parseInt(ingredientId);
            if (!isNaN(numericIngredientId)) {
              const ingredient = await this.getIngredientDetails(numericIngredientId);
              if (ingredient) {
                totalPrice += parseFloat(ingredient.price) || 0;
              }
            }
          }
        }
      }

      // Create cart item with validated data
      const cartItem = {
        item_id: item.item_id,
        item_name: item.item_name,
        price: totalPrice,
        quantity: quantity,
        options: options || {}
      };
      // Check if item with same options already exists in cart
      const existingItemIndex = sessionCart.items.findIndex(
        existingItem => existingItem.item_id === cartItem.item_id && 
                       this.areOptionsEqual(existingItem.options, cartItem.options)
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        sessionCart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item if it doesn't exist
        sessionCart.items.push(cartItem);
        
      }

      return sessionCart;
    } catch (error) {
      console.error('Error in addToSessionCart service:', error);
      throw error;
    }
  }
  
  /**
   * Update quantity of item in session cart (for guest users)
   * Changes the quantity of an existing item in the session cart
   * Removes item if quantity is 0 or less
   * @param {Object} sessionCart - Current session cart object
   * @param {number} itemId - ID of the item to update
   * @param {number} quantity - New quantity
   * @param {Object} options - Customization options to match
   * @returns {Object} Success status and updated cart
   */
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
  
  /**
   * Remove item from session cart (for guest users)
   * Removes a specific item with matching options from the session cart
   * @param {Object} sessionCart - Current session cart object
   * @param {number} itemId - ID of the item to remove
   * @param {Object} options - Customization options to match for removal
   * @returns {Object} Success status and updated cart
   */
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
   * Update order type (Dine In or Take Away)
   * Updates the order type for both logged-in users (database) and guests (session)
   * @param {number|null} userId - User ID if logged in, null for guests
   * @param {string} orderType - New order type ('Dine In' or 'Take Away')
   * @param {Object} sessionCart - Session cart for guests
   * @returns {Object} Success status and updated order type
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

  /**
   * Get available ingredients for a menu item
   * Wrapper function that calls the standalone getAvailableIngredients function
   * @param {number} itemId - The ID of the menu item
   * @returns {Array} Array of ingredient groups with their details
   */
  async getAvailableIngredients(itemId) {
    return getAvailableIngredients(itemId);
  }

  /**
   * Get ingredient details from database
   * Fetches ingredient information including name and price
   * @param {number} ingredientId - The ID of the ingredient
   * @returns {Object|null} Ingredient details or null if not found
   */
  async getIngredientDetails(ingredientId) {
    let connection;
    try {
      connection = await dbSingleton.getConnection();
      const [ingredients] = await connection.execute(
        'SELECT ingredient_id, ingredient_name, price FROM ingredient WHERE ingredient_id = ? AND status = 1',
        [ingredientId]
      );
      return ingredients.length > 0 ? ingredients[0] : null;
    } catch (error) {
      console.error('Error getting ingredient details:', error);
      return null;
    }
  }

  /**
   * Compare two option objects for equality
   * Helper function to determine if two customization options are the same
   * Used to identify duplicate items in cart with same customizations
   * @param {Object} options1 - First options object
   * @param {Object} options2 - Second options object
   * @returns {boolean} True if options are equal, false otherwise
   */
  areOptionsEqual(options1, options2) {
    if (!options1 || !options2) return false;
    
    // Simple comparison using JSON.stringify as fallback
    try {
      return JSON.stringify(options1) === JSON.stringify(options2);
    } catch (error) {
      console.error('Error comparing options:', error);
      return false;
    }
  }
}

// Create and export a single instance
const cartService = new CartService();
module.exports = cartService; 