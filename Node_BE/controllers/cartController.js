const cartService = require('../services/cartService');
const { dbSingleton } = require('../dbSingleton');
const {
  validateItem,
  validateQuantity,
  validateOptions,
  validateOrderType,
  validateCartItem,
  validatePrice,
  validateCartTotal,
  validateCartDataFlexible
} = require('../middleware/cartMiddleware');

// Format cart items to include ingredient details and VAT information
const formatCartItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  return items.map(item => ({
    ...item,
    total_price: (item.price || 0) * (item.quantity || 0),
    total_price_with_vat: (item.priceWithVAT || item.price_with_vat || 0) * (item.quantity || 0),
    total_vat_amount: (item.vatAmount || item.vat_amount || 0) * (item.quantity || 0)
  }));
};

// Calculate cart totals with VAT breakdown
const calculateCartTotals = (items) => {
  if (!items || !Array.isArray(items)) {
    return {
      subtotal: 0,
      totalVatAmount: 0,
      totalWithVat: 0,
      itemCount: 0
    };
  }
  
  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  const totalVatAmount = items.reduce((sum, item) => sum + ((item.vatAmount || item.vat_amount || 0) * (item.quantity || 0)), 0);
  const totalWithVat = items.reduce((sum, item) => sum + ((item.priceWithVAT || item.price_with_vat || item.price || 0) * (item.quantity || 0)), 0);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalVatAmount: Math.round(totalVatAmount * 100) / 100,
    totalWithVat: Math.round(totalWithVat * 100) / 100,
    itemCount
  };
};

// Get cart items
const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.session.userId, req.session.cart);
    
    if (!cart || !cart.items) {
      return res.json({
        items: [],
        orderType: cart?.orderType || 'Dine In',
        totals: calculateCartTotals([])
      });
    }
    
    const formattedItems = formatCartItems(cart.items);
    
    if (!validateCartTotal(formattedItems)) {
      return res.status(400).json({ error: 'Invalid cart total' });
    }
    
    const totals = calculateCartTotals(formattedItems);
    
    res.json({
      items: formattedItems,
      orderType: cart.orderType || 'Dine In',
      totals: totals
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
    console.log("cartData", cartData)

    // Use flexible validation - quantity required for add operation
    if (!validateCartDataFlexible(cartData, true)) {
      return res.status(400).json({ error: 'Invalid cart data structure' });
    }

    const { item_id, quantity, options } = cartData;
    
    // Get item details from database
    const connection = await dbSingleton.getConnection();
    const [items] = await connection.execute(
      'SELECT item_id, item_name, price, item_photo_url FROM dish WHERE item_id = ?',
      [item_id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = items[0];
    
    // Initialize session cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {
        items: [],
        orderType: 'Dine In'
      };
    }
    
    // Add item to cart (handles validation, price calculation, and auto-addition internally)
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
    
    // Handle specific validation errors
    if (error.code === 'MISSING_REQUIRED_TYPES') {
      return res.status(400).json({ 
        error: 'Required types are missing',
        missingTypes: error.missingTypes
      });
    }
    if (error.code === 'MISSING_REQUIRED_CATEGORIES') {
      return res.status(400).json({ 
        error: 'Required categories are missing',
        missingCategories: error.missingCategories
      });
    }
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
    if (error.code === 'MULTIPLE_SELECTIONS_NOT_ALLOWED') {
      return res.status(400).json({ 
        error: 'Multiple selections not allowed for this option',
        type: error.type,
        selections: error.selections
      });
    }
    
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