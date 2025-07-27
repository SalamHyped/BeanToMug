const { dbSingleton } = require('../dbSingleton');
const { migrateSessionCartToUser, getCartItems, updateCartTotal } = require('../utils/cartMigration');
const { processIngredientSelections, getIngredientsForStorage, createOptionsForDisplay } = require('../utils/ingredientProcessor');

/**
 * Cart Service
 * Comprehensive cart management system that handles both authenticated users and guest users
 * 
 * This service provides a unified interface for cart operations while handling the complexity
 * of different storage mechanisms:
 * - Authenticated users: Cart stored in database with full persistence
 * - Guest users: Cart stored in session with temporary persistence
 * 
 * Key Features:
 * - Dual storage system (database vs session)
 * - Ingredient customization support
 * - Price calculation including customizations
 * - Cart migration on user login
 * - Transaction safety for database operations
 * - Duplicate item detection and merging
 */

/**
 * Get available ingredients for a menu item
 * Fetches all ingredients that can be added to a specific menu item
 * Groups ingredients by category (syrups, toppings, etc.) for easy selection
 * 
 * This function queries the database to get all available ingredients for a menu item,
 * including their prices, stock levels, and categorization. It groups ingredients
 * by their category to make them easier to display in the frontend.
 * 
 * Database Tables Used:
 * - ingredients_in_item: Links items to their available ingredients
 * - ingredient: Basic ingredient information (name, price, stock)
 * - ingredient_category: Categorizes ingredients (e.g., "Milk", "Syrups")
 * - ingredient_type: Defines how ingredients are presented as options
 * - item_option_type: Defines how ingredients are presented as options for this specific item
 * 
 * @param {number} itemId - The ID of the menu item
 * @returns {Array} Array of ingredient groups with their details
 */
async function getAvailableIngredients(itemId) {
  let connection;
  
  try {
    connection = await dbSingleton.getConnection();
    
    // Complex query to get all ingredients for the item with their prices and categorization
    // This query joins multiple tables to get complete ingredient information:
    // - ingredients_in_item: Links items to their required ingredients
    // - ingredient: Basic ingredient information (name, price, stock, etc.)
    // - ingredient_category: Categorizes ingredients (e.g., "Milk", "Syrups")
    // - ingredient_type: Defines ingredient types (e.g., "Milk Type", "Size")
    // - item_option_type: Defines how ingredients are presented as options for this specific item
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
        it.is_physical,
        iot.is_required,
        iot.is_multiple
      FROM ingredients_in_item iii
      JOIN ingredient i ON iii.ingredient_id = i.ingredient_id
      JOIN ingredient_category ic ON i.type_id = ic.type_id
      JOIN ingredient_type it ON i.type_id = it.id
      JOIN item_option_type iot ON iot.type_id = it.id AND iot.item_id = ?
      WHERE iii.item_id = ? AND i.status = 1
      ORDER BY it.option_group, it.name
    `, [itemId, itemId]);

    // Process and group ingredients by their category for frontend consumption
    // This creates a structured format that's easier for the frontend to render
    const groupedIngredients = ingredients.reduce((acc, ing) => {
      const key = ing.category_name;
      if (!acc[key]) {
        acc[key] = {
          group: ing.option_group,        // Display text for the option group
          label: ing.option_label,        // Option type name
          required: ing.is_required,      // Whether this option is mandatory (from item_option_type)
          category: ing.category_name,    // Category name (e.g., "Milk", "Syrups")
          isPhysical: ing.is_physical,    // Whether this ingredient has physical stock
          isMultiple: ing.is_multiple,    // Whether multiple selections are allowed
          ingredients: []                 // Array to hold individual ingredients
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
   * 
   * This method provides a unified interface for getting cart data regardless
   * of whether the user is logged in or a guest. It handles the complexity
   * of different storage mechanisms transparently.
   * 
   * For logged-in users:
   * - Fetches cart from database using getOrCreateUserCart()
   * - Retrieves cart items with full details including customizations
   * - Returns structured data with items and order type
   * 
   * For guests:
   * - Returns session cart data directly
   * - Ensures proper structure with default values
   * 
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
   * 
   * This method provides a unified interface for adding items to cart,
   * automatically routing to the appropriate storage mechanism based on
   * user authentication status.
   * 
   * The method handles:
   * - Price calculation including ingredient customizations
   * - Duplicate item detection and quantity merging
   * - Transaction safety for database operations
   * - Session cart management for guests
   * 
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
   * 
   * This method provides a unified interface for updating item quantities,
   * handling both database and session storage transparently.
   * 
   * Features:
   * - Automatic item removal if quantity is 0 or less
   * - Price recalculation for updated quantities
   * - Transaction safety for database operations
   * - Session cart management for guests
   * 
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
   * 
   * This method provides a unified interface for removing items from cart,
   * handling both database and session storage transparently.
   * 
   * The method ensures:
   * - Proper cleanup of associated data (ingredients, etc.)
   * - Transaction safety for database operations
   * - Accurate cart total recalculation
   * - Session cart management for guests
   * 
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
   * 
   * This method provides a unified interface for clearing carts,
   * handling both database and session storage transparently.
   * 
   * For logged-in users:
   * - Removes all items from database cart
   * - Resets cart total to zero
   * - Uses transaction safety
   * 
   * For guests:
   * - Session cart should be cleared by setting req.session.cart = []
   * - This method returns empty array for consistency
   * 
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
   * 
   * This method is crucial for maintaining cart continuity during the
   * authentication process. It prevents users from losing their cart
   * items when they log in.
   * 
   * The migration process:
   * - Transfers all session cart items to database
   * - Handles ingredient customizations
   * - Merges duplicate items appropriately
   * - Updates cart totals
   * - Clears session cart after successful migration
   * 
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
   * 
   * This method ensures every logged-in user has a cart record in the database.
   * It first attempts to find an existing cart, and if none exists, creates
   * a new one with default values.
   * 
   * Database Operations:
   * - Searches for existing cart with is_cart = TRUE
   * - Creates new cart order if none exists
   * - Sets default order type to 'Dine In'
   * - Initializes total price to 0.00
   * 
   * @param {number} userId - User ID
   * @returns {Object|null} Cart order object or null if creation fails
   */
  async getOrCreateUserCart(userId) {
    const connection = await dbSingleton.getConnection();
    
    try {
      // Try to find existing user cart
      // Only one cart per user should exist at a time
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
      // This creates a new order record marked as a cart (is_cart = TRUE)
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
   * 
   * This method handles the complex process of adding items to a database cart,
   * including price calculations, ingredient management, and duplicate detection.
   * 
   * Key Features:
   * - Transaction safety for all database operations
   * - Price calculation including required and optional ingredients
   * - Duplicate item detection and quantity merging
   * - Ingredient customization storage (both required and optional)
   * - Cart total recalculation
   * 
   * Database Tables Used:
   * - orders: Main cart order record
   * - order_item: Individual items in cart
   * - order_item_ingredient: Customization ingredients
   * - dish: Item base information
   * - ingredient: Ingredient pricing and details
   * 
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

      // Get available ingredients using the existing function
      const availableIngredients = await getAvailableIngredients(item.item_id);
      
      // Process ingredient selections with validation, price calculation, and auto-addition
      const processedResult = processIngredientSelections(options, availableIngredients, item.price);
      

      
      // Check if item with same options already exists in cart
      // Get all existing items with the same item_id
      const [existingItems] = await connection.execute(`
        SELECT oi.order_item_id, GROUP_CONCAT(oii.ingredient_id ORDER BY oii.ingredient_id) as ingredient_ids
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
      `, [cartOrder.order_id, item.item_id]);

      // Get the ingredient IDs for the new item
      const newIngredientIds = processedResult.ingredients.all.map(ing => ing.ingredient_id).sort().join(',');
      
      // Find exact match
      const exactMatch = existingItems.find(existingItem => {
        const existingIngredientIds = existingItem.ingredient_ids || '';
        return existingIngredientIds === newIngredientIds;
      });

      if (exactMatch) {
        // Update existing item quantity
        await connection.execute(`
          UPDATE order_item 
          SET quantity = quantity + ?, updated_at = NOW()
          WHERE order_item_id = ?
        `, [quantity, exactMatch.order_item_id]);
      } else {
        // Add new item to cart
        const [result] = await connection.execute(`
          INSERT INTO order_item (order_id, item_id, quantity, price, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, [cartOrder.order_id, item.item_id, quantity, processedResult.pricing.totalPrice]);

        // Add all ingredients (user selected + auto-added required)
        const ingredientsForStorage = getIngredientsForStorage(processedResult);
        for (const ingredient of ingredientsForStorage) {
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
   * 
   * This method handles quantity updates for database cart items, including
   * price recalculation and automatic removal if quantity is 0 or less.
   * 
   * Key Features:
   * - Transaction safety for all operations
   * - Price recalculation based on current ingredient costs
   * - Automatic item removal for zero quantities
   * - Ingredient customization updates
   * - Cart total recalculation
   * 
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
      
      // Find matching order item with exact ingredient match
      const [orderItems] = await connection.execute(`
        SELECT oi.order_item_id, GROUP_CONCAT(oii.ingredient_id ORDER BY oii.ingredient_id) as ingredient_ids
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
      `, [cartOrder.order_id, itemId]);

      // Get the ingredient IDs for the options
      const optionIngredientIds = options ? 
        Object.keys(options).filter(id => options[id].selected).map(id => parseInt(id)).sort((a, b) => a - b).join(',') : '';
      
      // Find exact match
      const exactMatch = orderItems.find(orderItem => {
        const existingIngredientIds = orderItem.ingredient_ids || '';
        return existingIngredientIds === optionIngredientIds;
      });

      if (!exactMatch) {
        throw new Error('Item not found in cart');
      }

      const orderItemId = exactMatch.order_item_id;
      
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
   * 
   * This method handles item removal from database cart, including proper
   * cleanup of associated data and cart total recalculation.
   * 
   * Key Features:
   * - Transaction safety for all operations
   * - Proper cleanup of ingredient customizations
   * - Cart total recalculation
   * - Error handling for missing items
   * 
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

      // Find matching order item with exact ingredient match
      const [orderItems] = await connection.execute(`
        SELECT oi.order_item_id, GROUP_CONCAT(oii.ingredient_id ORDER BY oii.ingredient_id) as ingredient_ids
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        WHERE oi.order_id = ? AND oi.item_id = ?
        GROUP BY oi.order_item_id
      `, [cartOrder.order_id, itemId]);

      // Get the ingredient IDs for the options
      const optionIngredientIds = options ? 
        Object.keys(options).filter(id => options[id].selected).map(id => parseInt(id)).sort((a, b) => a - b).join(',') : '';
      
      // Find exact match
      const exactMatch = orderItems.find(orderItem => {
        const existingIngredientIds = orderItem.ingredient_ids || '';
        return existingIngredientIds === optionIngredientIds;
      });

      if (!exactMatch) {
        throw new Error('Item not found in cart');
      }

      const orderItemId = exactMatch.order_item_id;
      
      // Remove ingredients first (foreign key constraint)
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
   * 
   * This method provides a clean slate for the user's cart by removing
   * all items and resetting the cart total to zero.
   * 
   * Database Operations:
   * - Removes all order_item records for the cart
   * - Resets cart total price to 0.00
   * - Uses transaction safety
   * 
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
   * 
   * This method handles cart operations for guest users who don't have
   * database persistence. It manages cart data in the session object.
   * 
   * Key Features:
   * - Price calculation including required and optional ingredients
   * - Duplicate item detection and quantity merging
   * - Session cart initialization if needed
   * - Ingredient customization storage (both required and optional)
   * 
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

      // Get available ingredients using the existing function
      const availableIngredients = await getAvailableIngredients(item.item_id);
      
      // Process ingredient selections with validation, price calculation, and auto-addition
      const processedResult = processIngredientSelections(options, availableIngredients, item.price);
      
      // Create options for display (only user-selected ingredients)
      const displayOptions = createOptionsForDisplay(processedResult);

      // Create cart item with validated data
      const cartItem = {
        item_id: item.item_id,
        item_name: item.item_name,
        price: processedResult.pricing.totalPrice,
        quantity: quantity,
        options: displayOptions,
        // Store all ingredient information for security and data integrity
        ingredients: processedResult.ingredients.all.map(ing => ({
          id: ing.ingredient_id,
          name: ing.name,
          price: ing.price,
          is_required: ing.autoAdded,
          category: ing.label
        }))
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
   * 
   * This method handles quantity updates for guest users' session carts.
   * It automatically removes items if the quantity is 0 or less.
   * 
   * Key Features:
   * - Quantity validation and automatic removal
   * - Option matching for item identification
   * - Session cart management
   * - Error handling for missing items
   * 
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
   * 
   * This method handles item removal for guest users' session carts.
   * It uses option matching to identify the specific item to remove.
   * 
   * Key Features:
   * - Option matching for precise item identification
   * - Session cart management
   * - Error handling for missing items
   * - Success/failure status reporting
   * 
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
   * 
   * This method provides a unified interface for updating order types,
   * handling both database and session storage transparently.
   * 
   * Order Types:
   * - 'Dine In': Customer will eat at the restaurant
   * - 'Take Away': Customer will take food to go
   * 
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
   * Get ingredient details from database
   * Fetches ingredient information including name and price
   * 
   * This method is used by session cart operations to get ingredient
   * pricing information for accurate price calculations.
   * 
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
   * 
   * This method is used to identify duplicate items in cart with the same
   * customizations. It uses JSON.stringify for comparison as a fallback
   * method for complex object comparison.
   * 
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