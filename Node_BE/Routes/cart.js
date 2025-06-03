const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');

// Initialize session cart if it doesn't exist
const initializeSessionCart = (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

// Get cart items
router.get('/', async (req, res) => {
  try {
    const sessionCart = initializeSessionCart(req);
    const cart = await cartService.getCart(req.session.userId, sessionCart);
    
    res.json({
      cart: cart
    });
    
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart'
    });
  }
});

// Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { item, quantity = 1, options = {} } = req.body;
    
    if (!item || !item.item_id) {
      return res.status(400).json({
        success: false,
        error: 'Item details are required'
      });
    }
    
    const sessionCart = initializeSessionCart(req);
    const updatedCart = await cartService.addToCart(
      req.session.userId,
      sessionCart,
      item,
      quantity,
      options
    );
    
    // Update session cart for guests
    if (!req.session.userId) {
      req.session.cart = updatedCart;
    }
    
    res.json({
      success: true,
      cart: updatedCart,
      message: `${item.item_name} added to cart`
    });
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add item to cart'
    });
  }
});

// Update item quantity in cart
router.put('/update-quantity', async (req, res) => {
  try {
    const { itemId, quantity, options = {} } = req.body;
    if (!itemId || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid item ID and quantity are required'
      });
    }
    
    const sessionCart = initializeSessionCart(req);
    const result = await cartService.updateQuantity(
      req.session.userId,
      sessionCart,
      itemId,
      quantity,
      options
    );
    
    // Update session cart for guests
    if (!req.session.userId) {
      if (result.success) {
        req.session.cart = result.cart;
        res.json({
          success: true,
          cart: result.cart,
          message: quantity === 0 ? 'Item removed from cart' : 'Quantity updated'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } else {
      res.json({
        success: true,
        cart: result,
        message: quantity === 0 ? 'Item removed from cart' : 'Quantity updated'
      });
    }
    
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update cart'
    });
  }
});

// Remove item from cart
router.delete('/remove', async (req, res) => {
  try {
    const { itemId, options = {} } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }
    
    const sessionCart = initializeSessionCart(req);
    const result = await cartService.removeFromCart(
      req.session.userId,
      sessionCart,
      itemId,
      options
    );
    
    // Update session cart for guests
    if (!req.session.userId) {
      if (result.success) {
        req.session.cart = result.cart;
        res.json({
          success: true,
          cart: result.cart,
          message: 'Item removed from cart'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } else {
      res.json({
        success: true,
        cart: result,
        message: 'Item removed from cart'
      });
    }
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove item from cart'
    });
  }
});

// Clear all items from cart
router.delete('/clear', async (req, res) => {
  try {
    await cartService.clearCart(req.session.userId);
    
    // Clear session cart
    req.session.cart = [];
    
    res.json({
      success: true,
      cart: [],
      message: 'Cart cleared'
    });
    
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

// Get cart count (for badge/notification)
router.get('/count', async (req, res) => {
  try {
    const sessionCart = initializeSessionCart(req);
    const cart = await cartService.getCart(req.session.userId, sessionCart);
    
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      count: totalCount
    });
    
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart count'
    });
  }
});

module.exports = router;