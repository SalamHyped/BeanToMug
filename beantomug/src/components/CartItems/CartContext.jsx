// CartContext.js
import { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('Dine In');
  const [error, setError] = useState(null);
  console.log("cartItems", cartItems)
console.log(cartItems)
  useEffect(() => {
    fetchCart();
  }, []);


  const fetchCart = async () => {
    try {
      const res = await axios.get('http://localhost:8801/cart', {
        withCredentials: true,
      });
      setCartItems(res.data.items || []);
      setOrderType(res.data.orderType || 'Dine In');
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.error || 'Failed to fetch cart');
      setCartItems([]);
      setOrderType('Dine In');
    }
  };

  const calculateItemPrice = (item, options) => {
    // Use item_price if available (from backend), otherwise calculate from base price
    if (item.item_price !== undefined && item.item_price !== null) {
      return parseFloat(item.item_price);
    }
    
    let totalPrice = parseFloat(item.price || 0);
    
    // Add prices from selected options if they exist
    if (options && typeof options === 'object') {
      Object.entries(options).forEach(([key, option]) => {
        if (option && option.selected && option.price) {
          totalPrice += parseFloat(option.price || 0);
        }
      });
    }

    return totalPrice;
  };

  // VAT calculation functions
  const VAT_RATE = 15.00; // 15% VAT - should match backend

  const calculateVATAmount = (subtotal) => {
    return (subtotal * VAT_RATE) / 100;
  };

  // Memoized cart totals calculation - only recalculates when cartItems change
  const cartTotals = useMemo(() => {
    let subtotal = 0;

    // Calculate subtotal for all items
    if (cartItems && Array.isArray(cartItems)) {
      cartItems.forEach(item => {
        if (item && typeof item === 'object') {
          const itemPrice = calculateItemPrice(item, item.options || {});
          const quantity = parseInt(item.quantity) || 1;
          subtotal += itemPrice * quantity;
        }
      });
    }

    // Calculate VAT
    const vatAmount = calculateVATAmount(subtotal);
    const totalWithVAT = subtotal + vatAmount;

    return {
      subtotal: subtotal,
      vatAmount: vatAmount,
      vatRate: VAT_RATE,
      totalWithVAT: totalWithVAT
    };
  }, [cartItems]); // Only recalculate when cartItems change

  // Legacy function for backward compatibility
  const calculateCartTotals = () => {
    return cartTotals;
  };

  const addToCart = async (cartData) => {
    try {
      await axios.post('http://localhost:8801/cart/add', cartData, {
        withCredentials: true
      });

      // Fetch updated cart after adding item
      await fetchCart();
      setError(null);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err.response?.data?.error || 'Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemToRemove) => {
    try {
      console.log("itemToRemove", itemToRemove)
      await axios.delete('http://localhost:8801/cart/remove', {
        data: {
          item_id: itemToRemove.item_id,
          options: itemToRemove.options
        },
        withCredentials: true
      });

      // Fetch updated cart after removing item
      await fetchCart();
      setError(null);
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.response?.data?.error || 'Failed to remove item from cart');
    }
  };

  const updateQuantity = async (itemId, newQuantity, options) => {
    try {
      // Find the item in cart to get its full details
      const item = cartItems.find(i => i.item_id === itemId);
      if (!item) {
        setError('Item not found in cart');
        return;
      }

      await axios.put('http://localhost:8801/cart/update-quantity', {
        item_id: itemId,
        quantity: newQuantity,
        options,
      }, { withCredentials: true });

      // Fetch updated cart after updating quantity
      await fetchCart();
      setError(null);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.response?.data?.error || 'Failed to update quantity');
    }
  };

  const updateOrderType = async (newOrderType) => {
    try {
      await axios.put('http://localhost:8801/cart/order-type', {
        orderType: newOrderType
      }, { withCredentials: true });

      setOrderType(newOrderType);
      setError(null);
    } catch (err) {
      console.error('Error updating order type:', err);
      setError(err.response?.data?.error || 'Failed to update order type');
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete('http://localhost:8801/cart/clear', {
        withCredentials: true
      });

      setCartItems([]);
      setError(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.response?.data?.error || 'Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider value={{ 
      cartItems,
      orderType,
      error,
      addToCart, 
      removeFromCart, 
      updateQuantity,
      updateOrderType,
      clearCart,
      setCartItems,
      refreshCart: fetchCart,
      calculateCartTotals,
      calculateVATAmount,
      VAT_RATE,
      cartTotals // Memoized totals for direct access
    }}>
      {children}
    </CartContext.Provider>
  );
};
