const cartService = require('../services/cartService');
const {
  validateItem,
  validateQuantity,
  validateOptions,
  validateOrderType,
  validateCartItem,
  validatePrice,
  validateIngredientSelection,
  validateCartTotal
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

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { item, quantity, options } = req.body;
    console.log('Adding to cart:', { item, quantity, options });
    console.log(item.price);
    if (!validateItem(item)) {
      return res.status(400).json({ error: 'Invalid item structure' });
    }
    
    if (!validateQuantity(quantity)) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (!validatePrice(item.price)) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    
    if (options && !validateOptions(options)) {
      return res.status(400).json({ error: 'Invalid options structure' });
    }
    
    // Get available ingredients for validation
    const availableIngredients = await cartService.getAvailableIngredients(item.item_id);
    console.log("Available ingredients:", availableIngredients);
    
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
    
    // Add item to cart based on user authentication
    const updatedCart = await cartService.addToCart(req.session?.userId, req.session.cart, item, quantity, options);
    
    // Update session cart
    req.session.cart = updatedCart;
    
    res.json({ 
      message: 'Item added to cart successfully',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Update item quantity
const updateQuantity = async (req, res) => {
  try {
    const { itemId, quantity, options } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    if (!validateQuantity(quantity)) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    if (options && !validateOptions(options)) {
      return res.status(400).json({ error: 'Invalid options structure' });
    }
    
    // Initialize session cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {
        items: [],
        orderType: 'Dine In'
      };
    }
    
    const result = await cartService.updateQuantity(req.session.userId, req.session.cart, itemId, quantity, options);
    
    if (result.success) {
      // Update session cart with the new cart state
      req.session.cart = result.cart;
      res.json({ 
        message: 'Quantity updated successfully',
        cart: result.cart
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
    const { itemId, options } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    if (options && !validateOptions(options)) {
      return res.status(400).json({ error: 'Invalid options structure' });
    }
    
    const result = await cartService.removeFromCart(req.session.userId, req.session.cart, itemId, options);
    
    if (result.success) {
      // Update session cart with the new cart state
      req.session.cart = result.cart;
      res.json({ 
        message: 'Item removed from cart successfully',
        cart: result.cart
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
    await cartService.clearCart(req.user?.id, req.session.id);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// Get cart count
const getCartCount = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user?.id, req.session.id);
    const count = cart.items.reduce((total, item) => total + item.quantity, 0);
    res.json({ count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
};

module.exports = {
  getCart,
  updateOrderType,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartCount
}; 