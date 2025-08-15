// CartContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../utils/config';

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
      const res = await axios.get('/cart', getApiConfig());
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

  // Unified price calculation function
  const calculateItemPrice = (item, options, includeVAT = false) => {
    let totalPrice = parseFloat(item.price || 0);
    
    // Add prices from selected options if they exist
    if (options && typeof options === 'object') {
      Object.entries(options).forEach(([key, option]) => {
        if (option && option.selected && option.price) {
          totalPrice += parseFloat(option.price || 0);
        }
      });
    }

    // If VAT is requested and backend provides it, use backend calculation
    if (includeVAT && item.priceWithVAT !== undefined && item.priceWithVAT !== null) {
      return parseFloat(item.priceWithVAT);
    }
    
    // If VAT is requested but backend doesn't provide it, calculate locally
    if (includeVAT) {
      const FALLBACK_VAT_RATE = 15.00; // Fallback VAT rate
      const vatAmount = (totalPrice * FALLBACK_VAT_RATE) / 100;
      return totalPrice + vatAmount;
    }
    
    // Return base price without VAT
    return totalPrice;
  };

  // Helper function for VAT amount calculation
  const calculateVATAmount = (subtotal, vatRate = 15.00) => {
    return (subtotal * vatRate) / 100;
  };

  // Memoized cart totals calculation - only recalculates when cartItems change
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let subtotalWithVAT = 0;
    let totalVATAmount = 0;

    // Calculate subtotal for all items
    if (cartItems && Array.isArray(cartItems)) {
      cartItems.forEach(item => {
        if (item && typeof item === 'object') {
          const itemBasePrice = calculateItemPrice(item, item.options || {}, false); // No VAT
          const itemPriceWithVAT = calculateItemPrice(item, item.options || {}, true); // With VAT
          const quantity = parseInt(item.quantity) || 1;
          
          subtotal += itemBasePrice * quantity;
          subtotalWithVAT += itemPriceWithVAT * quantity;
          
          // If backend provides VAT amount, use it for more accurate calculation
          if (item.vatAmount !== undefined && item.vatAmount !== null) {
            totalVATAmount += parseFloat(item.vatAmount) * quantity;
          }
        }
      });
    }

    // Use backend VAT amount if available, otherwise calculate from difference
    const vatAmount = totalVATAmount > 0 ? totalVATAmount : (subtotalWithVAT - subtotal);
    const totalWithVAT = subtotalWithVAT;

    return {
      subtotal: subtotal,
      subtotalWithVAT: subtotalWithVAT,
      vatAmount: vatAmount,
      vatRate: 15.00, // Fallback rate, actual rate comes from backend
      totalWithVAT: totalWithVAT
    };
  }, [cartItems]); // Only recalculate when cartItems change

  // Legacy function for backward compatibility (now just returns memoized totals)
  const calculateCartTotals = () => {
    return cartTotals;
  };

  const addToCart = async (cartData) => {
    try {
      await axios.post('/cart/add', cartData, getApiConfig());

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
      await axios.delete('/cart/remove', {
        ...getApiConfig(),
        data: {
          item_id: itemToRemove.item_id,
          options: itemToRemove.options,
          orderType: orderType
        }
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
      if (newQuantity <= 0) {
        await removeFromCart({ item_id: itemId });
        return;
      }

      await axios.put('/cart/update-quantity', {
        item_id: itemId,
        quantity: newQuantity,
        options: options,
        orderType: orderType
      }, getApiConfig());

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
      await axios.put('/cart/order-type', {
        orderType: newOrderType
      }, getApiConfig());

      setOrderType(newOrderType);
      setError(null);
    } catch (err) {
      console.error('Error updating order type:', err);
      setError(err.response?.data?.error || 'Failed to update order type');
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/cart/clear', getApiConfig());

      setCartItems([]);
      setOrderType('dine-in');
      setError(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.response?.data?.error || 'Failed to clear cart');
    }
  };

  const contextValue = {
    cartItems,
    setCartItems, // Add this so components can clear cart
    orderType,
    error,
    cartTotals,
    calculateCartTotals,
    calculateItemPrice, // Now unified function with VAT parameter
    addToCart,
    removeFromCart,
    updateQuantity,
    updateOrderType, // Add the missing function
    setOrderType,
    fetchCart,
    clearCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
