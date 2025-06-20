const express = require('express');
const router = express.Router();
const paypalService = require('../services/paypalService');

/**
 * POST /paypal/create-paypal-order
 * Creates a PayPal order from the user's cart and converts it to a pending order
 * 
 * This endpoint handles the transition from cart to order:
 * - Supports both authenticated users and guest users
 * - Validates cart contents before creating PayPal order
 * - Converts session cart or database cart to a PayPal order
 * - Creates a pending order in the database
 * - Returns PayPal order details for frontend payment flow
 * 
 * Flow:
 * 1. Check if user is logged in (userId in session) or guest
 * 2. Validate cart has items (either in database for users or session for guests)
 * 3. Call PayPal service to create order and convert cart
 * 4. Return PayPal order details for payment processing
 * 
 * Authentication: Optional (supports both users and guests)
 * Request Body: None (uses session data)
 * Response: PayPal order details or error with price changes
 */
router.post('/create-paypal-order', async (req, res) => {
  try {
    // Extract user ID from session (null for guests)
    // This determines whether to use database cart or session cart
    const userId = req.session.userId || null;
    
    // Get cart from session (for guests) or prepare for database lookup (for users)
    // Session cart contains items array and order type
    const sessionCart = req.session.cart || { items: [] };
    
    // Validate that there are items to order
    // For guests: check session cart has items
    // For users: cart validation happens in the service layer
    if (!userId && (!sessionCart.items || sessionCart.items.length === 0)) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Delegate to PayPal service to handle the complex order creation logic
    // This service handles:
    // - Database cart retrieval for logged-in users
    // - Session cart processing for guests
    // - PayPal order creation
    // - Database order creation
    // - Price validation and updates
    const result = await paypalService.createOrderFromCart(userId, sessionCart);
    
    // Return the PayPal order details to the frontend
    res.json(result);
    
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    
    // Handle price change errors specially
    // This occurs when item prices have changed since the cart was created
    // Frontend can use this to update prices and ask user to confirm
    if (error.code === 'PRICE_CHANGED') {
      return res.status(409).json({
        error: error.message,
        price_changes: error.priceChanges,  // Details of what prices changed
        new_total: error.newTotal          // Updated total amount
      });
    }
    
    // Return generic error for other failures
    res.status(500).json({ 
      error: error.message || 'Failed to create PayPal order'
    });
  }
});

/**
 * POST /paypal/complete-payment
 * Completes a PayPal payment by capturing the authorized order
 * 
 * This endpoint finalizes the payment process:
 * - Captures the PayPal payment that was previously authorized
 * - Updates the order status in the database
 * - Clears the user's cart (both session and database)
 * - Handles both user and guest orders
 * 
 * Flow:
 * 1. Receive PayPal order ID from frontend
 * 2. Capture the payment with PayPal
 * 3. Update order status in database
 * 4. Clear cart and return success
 * 
 * Authentication: Optional (supports both users and guests)
 * Request Body: { order_id: string }
 * Response: Payment completion status
 */
router.post('/complete-payment', async (req, res) => {
  try {
    // Extract PayPal order ID from request body
    // This is the order ID returned from PayPal during order creation
    const { order_id } = req.body;
    
    // Validate that order ID is provided
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Delegate to PayPal service to complete the payment
    // This service handles:
    // - PayPal payment capture
    // - Database order status update
    // - Inventory updates
    // - Email notifications (if configured)
    const result = await paypalService.completePayment(order_id);
    
    // Clear session cart on successful payment
    // This ensures a fresh start for the next order
    // Works for both guests and logged-in users
    req.session.cart = { items: [], orderType: 'Dine In' };
    
    // Return success response
    res.json(result);
    
  } catch (error) {
    console.error('Error completing payment:', error);
    
    // Return error response
    res.status(500).json({ 
      error: error.message || 'Failed to complete payment'
    });
  }
});

/**
 * POST /paypal/cancel-order
 * Cancels a PayPal order and reverts changes
 * 
 * This endpoint handles order cancellation:
 * - Cancels the PayPal order (if not yet captured)
 * - For logged-in users: reverts cart to previous state
 * - For guests: deletes the pending order
 * - Handles cleanup of temporary order data
 * 
 * Flow:
 * 1. Receive PayPal order ID from frontend
 * 2. Cancel PayPal order
 * 3. Revert database changes based on user type
 * 4. Return cancellation status
 * 
 * Authentication: Optional (supports both users and guests)
 * Request Body: { order_id: string }
 * Response: Cancellation status
 */
router.post('/cancel-order', async (req, res) => {
  try {
    // Extract PayPal order ID from request body
    const { order_id } = req.body;
    
    // Validate that order ID is provided
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Delegate to PayPal service to cancel the order
    // This service handles:
    // - PayPal order cancellation
    // - Database cleanup (revert cart for users, delete order for guests)
    // - Inventory restoration if needed
    const result = await paypalService.cancelOrder(order_id);
    
    // Return cancellation result
    res.json(result);
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    
    // Return error response
    res.status(500).json({ 
      error: error.message || 'Failed to cancel order' 
    });
  }
});

/**
 * GET /paypal/order-history
 * Retrieves order history for the authenticated user
 * 
 * This endpoint provides order history functionality:
 * - Only available for logged-in users (guests don't have persistent history)
 * - Fetches all past orders from the database
 * - Returns order details including items and status
 * 
 * Note: This endpoint is primarily for logged-in users since guests
 * don't have persistent order history in the database.
 * 
 * Authentication: Required (user must be logged in)
 * Request Body: None
 * Response: Array of user's order history
 */
router.get('/order-history', async (req, res) => {
  try {
    // Get order history for the logged-in user
    // Uses session user ID to fetch orders from database
    const orders = await paypalService.getOrderHistory(req.session.userId);
    
    // Return order history
    res.json(orders);
    
  } catch (error) {
    console.error('Error fetching order history:', error);
    
    // Return error response
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

module.exports = router; 