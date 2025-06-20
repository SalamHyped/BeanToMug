const express = require('express');
const router = express.Router();
const paypalService = require('../services/paypalService');

// Create PayPal Order (convert cart to order) - Supports both users and guests
router.post('/create-paypal-order', async (req, res) => {
  try {
    const userId = req.session.userId || null;
    const sessionCart = req.session.cart || { items: [] };
    
    // Check if user has items in cart (either database or session)
    if (!userId && (!sessionCart.items || sessionCart.items.length === 0)) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    const result = await paypalService.createOrderFromCart(userId, sessionCart);
    res.json(result);
    
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    
    // Handle price change errors specially
    if (error.code === 'PRICE_CHANGED') {
      return res.status(409).json({
        error: error.message,
        price_changes: error.priceChanges,
        new_total: error.newTotal
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create PayPal order'
    });
  }
});

// Complete payment (capture PayPal order) - Supports both users and guests
router.post('/complete-payment', async (req, res) => {
  try {
    const { order_id } = req.body;
    
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    const result = await paypalService.completePayment(order_id);
    
    // Clear session cart on successful payment (for both guests and users)
    req.session.cart = { items: [], orderType: 'Dine In' };
    
    res.json(result);
    
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to complete payment'
    });
  }
});

// Cancel order (revert to cart or delete guest order)
router.post('/cancel-order', async (req, res) => {
  try {
    const { order_id } = req.body;
    
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    const result = await paypalService.cancelOrder(order_id);
    res.json(result);
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to cancel order' 
    });
  }
});

// Get order history for user (guests don't have order history)
router.get('/order-history', async (req, res) => {
  try {
    const orders = await paypalService.getOrderHistory(req.session.userId);
    res.json(orders);
    
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

module.exports = router; 