const { paypalClient } = require("../paypalClient");
const { dbSingleton } = require("../dbSingleton");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const { calculateItemPriceWithOptions } = require('../utils/priceCalculator');

/**
 * PayPal Service
 * Comprehensive PayPal integration service that handles payment processing for both guests and users
 * 
 * This service manages the complete payment flow from cart to completed order:
 * - PayPal order creation and payment capture
 * - Cart to order conversion for both user types
 * - Price validation and discrepancy handling
 * - Order status management and cleanup
 * - Transaction safety for all database operations
 * 
 * Key Features:
 * - Dual user support (authenticated users and guests)
 * - Real-time price validation and updates
 * - PayPal API integration with error handling
 * - Order lifecycle management
 * - Cart restoration on payment failure
 * - Comprehensive logging and debugging
 */

class PayPalService {

  /**
   * Create PayPal order from cart (main entry point)
   * 
   * This is the primary method for converting a cart to a PayPal order.
   * It handles both authenticated users and guests, routing to the
   * appropriate processing method based on user authentication status.
   * 
   * The process involves:
   * - Cart validation and price verification
   * - PayPal order creation
   * - Database order creation/update
   * - Cart to order conversion
   * 
   * @param {number|null} userId - User ID if logged in, null for guests
   * @param {Object} sessionCart - Session cart data for guests
   * @returns {Object} PayPal order details and database order information
   * @throws {Error} If cart is empty, prices changed, or PayPal creation fails
   */
  async createOrderFromCart(userId, sessionCart = []) {
    let connection;

    try {
      console.log('createOrderFromCart called with:', {
        userId,
        sessionCartType: typeof sessionCart,
        sessionCartItems: sessionCart?.items?.length || 0,
        sessionCartKeys: sessionCart ? Object.keys(sessionCart) : []
      });

      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      let orderData;

      if (userId) {
        // User is logged in - process database cart
        console.log('Creating order from user cart for user:', userId);
        orderData = await this.createOrderFromUserCart(connection, userId);
      } else {
        // Guest user - process session cart
        console.log('Creating order from session cart');
        orderData = await this.createOrderFromSessionCart(
          connection,
          sessionCart
        );
      }

      await connection.commit();
      console.log('PayPal order created successfully:', orderData);
      return orderData;
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error in createOrderFromCart:', error);
      throw error;
    }
  }

  /**
   * Create PayPal order from authenticated user's database cart
   * 
   * This method handles the conversion of a logged-in user's database cart
   * to a PayPal order. It validates cart contents, checks for price changes,
   * creates a PayPal order, and converts the cart to a pending order.
   * 
   * Process:
   * 1. Find user's database cart
   * 2. Validate cart items and check for price changes
   * 3. Create PayPal order
   * 4. Convert cart to pending order
   * 
   * @param {Object} connection - Database connection
   * @param {number} userId - User ID
   * @returns {Object} PayPal order details and database order information
   * @throws {Error} If no cart found, cart is empty, or processing fails
   */
  async createOrderFromUserCart(connection, userId) {
    // Find user's cart in database
    const cart = await this.findUserCart(connection, userId);
    if (!cart) {
      throw new Error("No cart found");
    }

    // Validate cart items and check for price changes
    const { items, totalAmount } = await this.validateCartItems(
      connection,
      cart.order_id
    );
    if (items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Create PayPal order
    const paypalOrder = await this.createPayPalOrder(
      totalAmount,
      cart.order_id,
      "user"
    );

    // Convert cart to pending order
    await this.convertCartToOrder(
      connection,
      cart.order_id,
      paypalOrder.id,
      totalAmount
    );

    return {
      order_id: paypalOrder.id,
      total_amount: totalAmount,
      db_order_id: cart.id,
      order_type: "user",
    };
  }

  /**
   * Create PayPal order from guest user's session cart
   * 
   * This method handles the conversion of a guest user's session cart
   * to a PayPal order. It creates a temporary order in the database,
   * validates session cart items, creates a PayPal order, and links them.
   * 
   * Process:
   * 1. Validate session cart structure and contents
   * 2. Create temporary order in database
   * 3. Add cart items to database with customizations
   * 4. Create PayPal order
   * 5. Link PayPal order to database order
   * 
   * @param {Object} connection - Database connection
   * @param {Object} sessionCart - Session cart data
   * @returns {Object} PayPal order details and database order information
   * @throws {Error} If cart is empty, invalid structure, or processing fails
   */
  async createOrderFromSessionCart(connection, sessionCart) {
    if (!sessionCart || sessionCart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Validate session cart items and calculate total
    const { validatedItems, totalAmount } = await this.validateSessionCartItems(
      connection,
      sessionCart
    );

    // Create temporary order for guest
    const [orderResult] = await connection.execute(
      `
      INSERT INTO orders (user_id, is_cart, total_price, status, created_at)
      VALUES (NULL, FALSE, ?, 'pending', NOW())
    `,
      [totalAmount]
    );

    const tempOrderId = orderResult.insertId;

    // Add each cart item to the temporary order
    for (const item of validatedItems) {
      const [itemResult] = await connection.execute(
        `
        INSERT INTO order_item (order_id, item_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `,
        [
          tempOrderId,
          item.item_id,
          item.quantity,
          item.item_price
        ]
      );
   
      // Add customization ingredients if any
      if (item.options) {
        const optionIds = Object.keys(item.options).filter(optionId => 
          item.options[optionId] && item.options[optionId].selected
        );
        if (optionIds.length > 0) {
          const [ingredients] = await connection.query(`
            SELECT ingredient_id, price
            FROM ingredient
            WHERE ingredient_id IN (?)
          `, [optionIds]);

          for (const ingredient of ingredients) {
            await connection.execute(`
              INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price)
              VALUES (?, ?, ?)
            `, [itemResult.insertId, ingredient.ingredient_id, ingredient.price]);
          }
        }
      }
    }

    // Create PayPal order
    const paypalOrder = await this.createPayPalOrder(
      totalAmount,
      tempOrderId,
      "guest"
    );
 
    // Link PayPal order to database order
    await connection.execute(
      `
      UPDATE orders SET paypal_order_id = ? WHERE order_id = ?
    `,
      [paypalOrder.id, tempOrderId]
    );

    return {
      order_id: paypalOrder.id,
      total_amount: totalAmount,
      db_order_id: tempOrderId,
      order_type: "guest",
    };
  }

  /**
   * Validate session cart items and check for price changes
   * 
   * This method performs comprehensive validation of session cart items:
   * - Validates cart structure and item data
   * - Calculates current prices including required and optional ingredients
   * - Compares with stored prices to detect changes
   * - Returns validated items with updated prices
   * - Throws special error if prices have changed
   * 
   * This is crucial for ensuring customers are charged the correct amount
   * and preventing price manipulation through session data.
   * 
   * Required ingredients are automatically included in the base price,
   * while optional ingredients only add cost if selected by the customer.
   * 
   * @param {Object} connection - Database connection
   * @param {Object} sessionCart - Session cart data
   * @returns {Object} Validated items and total amount
   * @throws {Error} If cart structure is invalid or prices have changed
   */
  async validateSessionCartItems(connection, sessionCart) {
    const validatedItems = [];
    let totalAmount = 0;
    const priceDiscrepancies = [];

    // Validate sessionCart structure
    if (!sessionCart || !Array.isArray(sessionCart.items)) {
      throw new Error("Invalid session cart structure");
    }

    // Process each cart item
    for (const cartItem of sessionCart.items) {
      // Validate cart item structure
      if (!cartItem || typeof cartItem !== 'object') {
        console.error('Invalid cart item:', cartItem);
        throw new Error("Invalid cart item structure");
      }

      // Validate required fields
      if (!cartItem.item_id || !cartItem.quantity || cartItem.quantity <= 0) {
        console.error('Missing required fields in cart item:', {
          item_id: cartItem.item_id,
          quantity: cartItem.quantity,
          price: cartItem.price
        });
        throw new Error("Cart item missing required fields (item_id, quantity)");
      }

      // Calculate current total price including required and optional ingredients
      const currentTotalPrice = await calculateItemPriceWithOptions(
        connection, 
        cartItem.item_id, 
        cartItem.options || {},
        false // Only need the price, not details
      );
      
      // Validate calculated price
      if (typeof currentTotalPrice !== 'number' || isNaN(currentTotalPrice)) {
        console.error('Invalid calculated price:', {
          item_id: cartItem.item_id,
          currentTotalPrice,
          options: cartItem.options
        });
        throw new Error(`Invalid price calculated for item ${cartItem.item_id}`);
      }
      
      console.log('Current total price (with required + optional ingredients):', currentTotalPrice, 'Cart item price:', cartItem.price);
      
      // Check for price discrepancies (tolerance of $0.01 for floating point precision)
      if (Math.abs(cartItem.price - currentTotalPrice) > 0.01) {
        priceDiscrepancies.push({
          item_id: cartItem.item_id,
          item_name: cartItem.item_name,
          cart_price: cartItem.price,
          current_price: currentTotalPrice,
        });
      }

      const validatedItem = {
        ...cartItem,
        item_price: currentTotalPrice,
      };

      validatedItems.push(validatedItem);
      
      // Calculate item total and add to order total
      const quantity = parseInt(cartItem.quantity) || 1;
      const itemTotal = currentTotalPrice * quantity;
      
      if (isNaN(itemTotal)) {
        console.error('NaN detected in calculation:', {
          currentTotalPrice,
          quantity,
          itemTotal
        });
        throw new Error(`Invalid calculation for item ${cartItem.item_id}`);
      }
      
      totalAmount += itemTotal;
    }

    // Final validation of total amount
    if (isNaN(totalAmount) || totalAmount <= 0) {
      console.error('Invalid total amount calculated:', totalAmount);
      throw new Error("Invalid total amount calculated");
    }

    // If prices have changed, throw special error with details
    if (priceDiscrepancies.length > 0) {
      const error = new Error(
        "Prices have changed since items were added to cart"
      );
      error.code = "PRICE_CHANGED";
      error.priceChanges = priceDiscrepancies;
      error.newTotal = totalAmount;
      throw error;
    }

    console.log('Final validated total amount:', totalAmount);
    return { validatedItems, totalAmount };
  }

  /**
   * Complete PayPal payment by capturing the authorized order
   * 
   * This method finalizes the payment process by:
   * - Finding the pending order in the database
   * - Capturing the payment with PayPal
   * - Marking the order as completed
   * - Handling failures by reverting or deleting the order
   * 
   * The method handles both user and guest orders differently:
   * - User orders: Reverted back to cart on failure
   * - Guest orders: Deleted on failure (no cart to revert to)
   * 
   * @param {string} orderId - PayPal order ID
   * @returns {Object} Payment completion details
   * @throws {Error} If order not found, payment capture fails, or processing fails
   */
  async completePayment(orderId) {
    let connection;
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      // Find the pending order
      const order = await this.findPendingOrder(connection, orderId);
      if (!order) {
        throw new Error("Order not found or already processed");
      }

      try {
        // Capture the PayPal payment
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(
          orderId
        );
        request.requestBody({});

        const captureResult = await paypalClient.execute(request);
        if (captureResult.result.status === "COMPLETED") {
          // Payment successful - mark order as completed
          await this.markOrderCompleted(connection, order.order_id);
          await connection.commit();
          
          return {
            success: true,
            paypal_order_id: orderId,
            capture_id:
              captureResult.result.purchase_units[0].payments.captures[0].id,
            order_id: order.order_id,
            
            is_guest: order.user_id === null,
          };
        } else {
          throw new Error(
            `Payment capture failed with status: ${captureResult.result.status}`
          );
        }
      } catch (paypalError) {
        // Payment failed - handle based on user type
        if (order.user_id) {
          // User order - revert back to cart
          await this.revertOrderToCart(connection, order.id);
        } else {
          // Guest order - delete the order
          await this.deleteGuestOrder(connection, order.order_id);
        }
        await connection.commit();
        throw new Error(`Payment capture failed: ${paypalError.message}`);
      }
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }

  /**
   * Cancel a PayPal order and handle cleanup
   * 
   * This method cancels a pending PayPal order and handles the cleanup
   * based on whether it's a user or guest order:
   * - User orders: Reverted back to cart (restore cart items)
   * - Guest orders: Deleted entirely (no cart to restore to)
   * 
   * @param {string} orderId - PayPal order ID
   * @returns {Object} Cancellation status
   * @throws {Error} If order not found or cancellation fails
   */
  async cancelOrder(orderId) {
    let connection;

    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      // Find the pending order
      const [orders] = await connection.execute(
        `
        SELECT * FROM orders
        WHERE paypal_order_id = ? AND status = 'pending' AND is_cart = FALSE
      `,
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("Order not found");
      }

      const order = orders[0];

      if (order.user_id) {
        // User order - revert back to cart
        await connection.execute(
          `
          UPDATE orders
          SET is_cart = TRUE,
              status = NULL,
              paypal_order_id = NULL,
              updated_at = NOW()
          WHERE order_id = ?
        `,
          [order.order_id]
        );
      } else {
        // Guest order - delete entirely
        await this.deleteGuestOrder(connection, order.order_id);
      }

      await connection.commit();

      return { success: true, message: "Order cancelled successfully" };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }

  /**
   * Get order history for authenticated user
   * 
   * This method retrieves the order history for a logged-in user,
   * including order details and item summaries. Only completed,
   * failed, and refunded orders are included (not pending or cart items).
   * 
   * @param {number} userId - User ID
   * @returns {Array} Array of order history items
   */
  async getOrderHistory(userId) {
    if (!userId) {
      return [];
    }

    const connection = await dbSingleton.getConnection();

    // Get order history with item summaries
    const [orders] = await connection.execute(
      `
      SELECT
        o.*,
        GROUP_CONCAT(
          CONCAT(d.item_name, ' x', oi.quantity)
          SEPARATOR ', '
        ) as items_summary
      FROM orders o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN dish d ON oi.item_id = d.item_id
      WHERE o.is_cart = FALSE
      AND o.status IN ('completed', 'failed', 'refunded')
      AND o.user_id = ?
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT 20
    `,
      [userId]
    );

    return orders;
  }

  /**
   * Find user's cart in database
   * 
   * This method locates the active cart for a logged-in user.
   * It returns the most recently updated cart (in case multiple exist).
   * 
   * @param {Object} connection - Database connection
   * @param {number} userId - User ID
   * @returns {Object|null} Cart order object or null if not found
   */
  async findUserCart(connection, userId) {
    const [carts] = await connection.execute(
      `
      SELECT * FROM orders
      WHERE user_id = ? AND is_cart = TRUE
      ORDER BY updated_at DESC
      LIMIT 1
    `,
      [userId]
    );

    return carts.length > 0 ? carts[0] : null;
  }

  /**
   * Validate cart items and check for price changes
   * 
   * This method validates items in a user's database cart and checks
   * if prices have changed since the items were added. If prices have
   * changed, it updates the cart prices and throws a special error.
   * 
   * @param {Object} connection - Database connection
   * @param {number} cartId - Cart order ID
   * @returns {Object} Validated items and total amount
   * @throws {Error} If prices have changed (with details)
   */
  async validateCartItems(connection, cartId) {
    // Get cart items with current prices
    const [items] = await connection.execute(
      `
      SELECT oi.*, d.price as current_price
      FROM order_item oi
      JOIN dish d ON oi.item_id = d.item_id
      WHERE oi.order_id = ?
    `,
      [cartId]
    );

    let totalAmount = 0;
    const priceDiscrepancies = [];

    // Check each item for price changes
    for (const item of items) {
      if (Math.abs(item.price - item.current_price) > 0.01) {
        priceDiscrepancies.push({
          item_id: item.item_id,
          cart_price: item.price,
          current_price: item.current_price,
        });
      }
      totalAmount += item.current_price * item.quantity;
    }

    // If prices have changed, update cart and throw error
    if (priceDiscrepancies.length > 0) {
      await this.updateCartPrices(connection, cartId, items);

      const error = new Error(
        "Prices have changed since items were added to cart"
      );
      error.code = "PRICE_CHANGED";
      error.priceChanges = priceDiscrepancies;
      error.newTotal = totalAmount;
      throw error;
    }

    return { items, totalAmount };
  }

  /**
   * Update cart prices to current database prices
   * 
   * This method updates all items in a cart to their current database prices
   * and recalculates the cart total. This is called when price changes are detected.
   * 
   * @param {Object} connection - Database connection
   * @param {number} cartId - Cart order ID
   * @param {Array} items - Cart items to update
   */
  async updateCartPrices(connection, cartId, items) {
    // Update each item's price to current database price
    for (const item of items) {
      await connection.execute(
        `
        UPDATE order_item
        SET price = (SELECT price FROM dish WHERE item_id = ?)
        WHERE order_id = ? AND item_id = ?
      `,
        [item.item_id, cartId, item.item_id]
      );
    }

    // Recalculate cart total
    const [totalResult] = await connection.execute(
      `
      SELECT COALESCE(SUM(price * quantity), 0) as total
      FROM order_item WHERE order_id = ?
    `,
      [cartId]
    );

    // Update cart total
    await connection.execute(
      `
      UPDATE orders SET total_price = ? WHERE order_id = ?
    `,
      [totalResult[0].total, cartId]
    );
  }

  /**
   * Create PayPal order via PayPal API
   * 
   * This method creates a PayPal order using the PayPal Checkout SDK.
   * It sets up the order with the correct amount, currency, and description.
   * 
   * @param {number} totalAmount - Total order amount
   * @param {number} orderId - Database order ID for reference
   * @param {string} orderType - Order type ('user' or 'guest')
   * @returns {Object} PayPal order response
   * @throws {Error} If amount is invalid or PayPal creation fails
   */
  async createPayPalOrder(totalAmount, orderId, orderType) {
    // Validate inputs
    if (typeof totalAmount !== 'number' || isNaN(totalAmount) || totalAmount <= 0) {
      console.error('Invalid totalAmount for PayPal order:', {
        totalAmount,
        type: typeof totalAmount,
        orderId,
        orderType
      });
      throw new Error(`Invalid total amount: ${totalAmount}`);
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log('Creating PayPal order with amount:', totalAmount.toFixed(2));

    // Create PayPal order request
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalAmount.toFixed(2),
          },
          description: `Bean to Mug ${
            orderType === "guest" ? "Guest " : "customer"
          }Order #${orderId}`,
        },
      ],
    });

    const response = await paypalClient.execute(request);
    return response.result;
  }

  /**
   * Convert cart to pending order
   * 
   * This method converts a cart order to a pending order by updating
   * the order status and linking it to the PayPal order ID.
   * 
   * @param {Object} connection - Database connection
   * @param {number} orderId - Database order ID
   * @param {string} paypalOrderId - PayPal order ID
   * @param {number} totalAmount - Order total amount
   */
  async convertCartToOrder(connection, orderId, paypalOrderId, totalAmount) {
    await connection.execute(
      `
      UPDATE orders
      SET is_cart = FALSE,
          status = 'pending',
          paypal_order_id = ?,
          total_price = ?,
          updated_at = NOW()
      WHERE order_id = ?
    `,
      [paypalOrderId, totalAmount, orderId]
    );
  }

  /**
   * Find pending order by PayPal order ID
   * 
   * This method locates a pending order in the database using the PayPal order ID.
   * 
   * @param {Object} connection - Database connection
   * @param {string} paypalOrderId - PayPal order ID
   * @returns {Object|null} Pending order or null if not found
   */
  async findPendingOrder(connection, paypalOrderId) {
    const [orders] = await connection.execute(
      `
      SELECT * FROM orders
      WHERE paypal_order_id = ? AND status = 'pending' AND is_cart = FALSE
    `,
      [paypalOrderId]
    );
    return orders.length > 0 ? orders[0] : null;
  }

  /**
   * Mark order as processing (ready for staff preparation)
   * 
   * This method updates an order's status to 'processing' after successful payment.
   * This makes the order appear in the staff queue for preparation.
   * 
   * @param {Object} connection - Database connection
   * @param {number} orderId - Database order ID
   */
  async markOrderCompleted(connection, orderId) {
    await connection.execute(
      `
      UPDATE orders
      SET status = 'processing', updated_at = NOW()
      WHERE order_id = ?
    `,
      [orderId]
    );
  }

  /**
   * Revert order back to cart
   * 
   * This method reverts a failed order back to a cart for logged-in users,
   * allowing them to retry the payment or modify their order.
   * 
   * @param {Object} connection - Database connection
   * @param {number} orderId - Database order ID
   */
  async revertOrderToCart(connection, orderId) {
    await connection.execute(
      `
      UPDATE orders
      SET is_cart = TRUE,
          status = NULL,
          paypal_order_id = NULL,
          updated_at = NOW()
      WHERE id = ?
    `,
      [orderId]
    );
  }

  /**
   * Delete guest order entirely
   * 
   * This method completely removes a guest order from the database
   * when payment fails, since guests don't have persistent carts.
   * 
   * @param {Object} connection - Database connection
   * @param {number} orderId - Database order ID
   */
  async deleteGuestOrder(connection, orderId) {
    // Delete order items first (foreign key constraint)
    await connection.execute(
      `
      DELETE FROM order_item WHERE order_id = ?
    `,
      [orderId]
    );
    // Delete the order
    await connection.execute(
      `
      DELETE FROM orders WHERE order_id = ?
    `,
      [orderId]
    );
  }
}

module.exports = new PayPalService();
