const express = require('express');
const router = express.Router();
const { initializeSessionCart } = require('../middleware/cartMiddleware');
const cartController = require('../controllers/cartController');

// Apply cart initialization middleware to all routes
router.use((req, res, next) => {
  req.session.cart = initializeSessionCart(req);
  next();
});

// Get cart items
router.get('/', cartController.getCart);

// Update order type
router.put('/order-type', cartController.updateOrderType);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update item quantity in cart
router.put('/update-quantity', cartController.updateQuantity);

// Remove item from cart
router.delete('/remove', cartController.removeFromCart);

// Clear all items from cart
router.delete('/clear', cartController.clearCart);

// Get cart count (for badge/notification)
router.get('/count', cartController.getCartCount);

module.exports = router;