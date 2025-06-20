const cartService = require('../services/cartService');
const {
  validateItem,
  validateQuantity,
  validateOptions,
  validateOrderType,
  validateCartItem,
  validatePrice,
  validateIngredientSelection,
  validateCartTotal,
  validateCartDataFlexible
} = require('../middleware/cartMiddleware');

// Format cart items to include ingredient details
const formatCartItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  return items.map(item => ({
    ...item,
    total_price: (item.price || 0) * (item.quantity || 0)
  }));
};

// Get cart items
const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.session.userId, req.session.cart);
    
    if (!cart || !cart.items) {
      return res.json({
        items: [],
        orderType: cart?.orderType || 'Dine In'
      });
    }
    
    const formattedItems = formatCartItems(cart.items);
    
    if (!validateCartTotal(formattedItems)) {
      return res.status(400).json({ error: 'Invalid cart total' });
    }
    
    res.json({
      items: formattedItems,
      orderType: cart.orderType || 'Dine In'
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

// Update order type
const updateOrderType = async (req, res) => {
  try {
    const { orderType } = req.body;
    
    if (!validateOrderType(orderType)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }
    console.log('Updating order type:', { orderType });
    await cartService.updateOrderType(req.session.userId, orderType, req.session.cart);
    res.json({ message: 'Order type updated successfully' });
  } catch (error) {
    console.error('Error updating order type:', error);
    res.status(500).json({ error: 'Failed to update order type' });
  }
};

// Add item to session cart
const addToSessionCart = async (req, res) => {
  try {
    const cartData = req.body;
    console.log('cartData', cartData);

    // Use flexible validation - quantity required for add operation
    if (!validateCartDataFlexible(cartData, true)) {
      return res.status(400).json({ error: 'Invalid cart data structure' });
    }

    const { item_id, quantity, options } = cartData;

    // Get item details from database
    const [itemResult] = await req.db.query(
      `SELECT d.item_id, d.item_name, d.price, d.status
       FROM dish d
       WHERE d.item_id = ?`,
      [item_id]
    );

    if (itemResult.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemResult[0];

    if (!item.status) {
      return res.status(400).json({ error: 'Item is not available' });
    }
    
    // Get available ingredients for validation
    const availableIngredients = await cartService.getAvailableIngredients(item_id);
    
    try {
      validateIngredientSelection(options, availableIngredients);
    } catch (error) {
      if (error.code === 'MISSING_REQUIRED_INGREDIENTS') {
        return res.status(400).json({ 
          error: 'Required ingredients are missing',
          missingIngredients: error.missingIngredients
        });
      }
      if (error.code === 'INGREDIENT_NOT_AVAILABLE') {
        return res.status(400).json({ 
          error: 'Selected ingredient is not available',
          ingredientId: error.ingredientId
        });
      }
      throw error;
    }
    
    // Initialize session cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {
        items: [],
        orderType: 'Dine In'
      };
    }
    
    // Add item to cart (handles both session and database)
    const updatedCart = await cartService.addToCart(
      req.session.userId, 
      req.session.cart, 
      item, 
      quantity, 
      options
    );
    
    // Update session cart
    req.session.cart = updatedCart;
    
    // Save session to ensure cart is persisted
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session after adding to cart:', err);
        return res.status(500).json({ error: 'Failed to save cart' });
      }
      

      res.json({ 
        message: 'Item added to cart successfully',
        cart: updatedCart
      });
    });
  } catch (error) {
    console.error('Error adding to session cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Update item quantity
const updateQuantity = async (req, res) => {
  try {
    const cartData = req.body;
    console.log("cartData", cartData)

    // Use flexible validation - quantity required for update operation
    if (!validateCartDataFlexible(cartData, true)) {
      return res.status(400).json({ error: 'Invalid cart data structure' });
    }

    const { item_id, quantity, options } = cartData;
    
    // Initialize session cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {
        items: [],
        orderType: 'Dine In'
      };
    }
    
    const result = await cartService.updateQuantity(req.session.userId, req.session.cart, item_id, quantity, options);
    
    if (result.success) {
      // Update session cart with the new cart state
      req.session.cart = result.cart;
      
      // Save session to ensure cart is persisted
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session after updating quantity:', err);
          return res.status(500).json({ error: 'Failed to save cart' });
        }
        
        console.log('Session saved after updating quantity:', req.session.cart);
        res.json({ 
          message: 'Quantity updated successfully',
          cart: result.cart
        });
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const cartData = req.body;
    console.log("cartData", cartData)

    // Use flexible validation - quantity not required for remove operation
    if (!validateCartDataFlexible(cartData, false)) {
      return res.status(400).json({ error: 'Invalid cart data structure for removal' });
    }

    const { item_id, options } = cartData;
    
    const result = await cartService.removeFromCart(req.session.userId, req.session.cart, item_id, options);
    
    if (result.success) {
      // Update session cart with the new cart state
      req.session.cart = result.cart;
      
      // Save session to ensure cart is persisted
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session after removing item:', err);
          return res.status(500).json({ error: 'Failed to save cart' });
        }
        
        console.log('Session saved after removing item:', req.session.cart);
        res.json({ 
          message: 'Item removed from cart successfully',
          cart: result.cart
        });
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    // Clear session cart
    req.session.cart = {
      items: [],
      orderType: 'Dine In'
    };
    
    // If user is logged in, also clear database cart
    if (req.session.userId) {
      await cartService.clearCart(req.session.userId);
    }
    
    // Save session to ensure cart is persisted
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session after clearing cart:', err);
        return res.status(500).json({ error: 'Failed to save cart' });
      }
      
      console.log('Session saved after clearing cart:', req.session.cart);
      res.json({ message: 'Cart cleared successfully' });
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// Get cart count
const getCartCount = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.session.userId, req.session.cart);
    const count = cart.items ? cart.items.reduce((total, item) => total + (item.quantity || 0), 0) : 0;
    res.json({ count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
};

module.exports = {
  getCart,
  updateOrderType,
  addToSessionCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartCount
}; 