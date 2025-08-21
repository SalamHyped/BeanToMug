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

  // Simple price calculation for backward compatibility (now just returns backend values)
  const calculateItemPrice = (item, options, includeVAT = false) => {
    if (includeVAT) {
      // Return backend-calculated VAT price if available
      return parseFloat(item.priceWithVAT || item.price_with_vat || item.price || 0);
    }
    // Return base price without VAT
    return parseFloat(item.price || 0);
  };

  // Helper function for VAT amount calculation
  const calculateVATAmount = (subtotal, vatRate = 15.00) => {
    return (subtotal * vatRate) / 100;
  };

  // Memoized cart totals calculation - now uses backend-calculated totals
  const cartTotals = useMemo(() => {
    // Default empty totals
    let totals = {
      subtotal: 0,
      subtotalWithVAT: 0,
      vatAmount: 0,
      vatRate: 15.00, // Fallback rate, actual rate comes from backend
      totalWithVAT: 0
    };

    // Calculate totals from cart items (backend should provide these values)
    if (cartItems && Array.isArray(cartItems)) {
      cartItems.forEach(item => {
        if (item && typeof item === 'object') {
          const quantity = parseInt(item.quantity) || 1;
          
          // Use backend-calculated prices when available
          const itemSubtotal = (item.price || 0) * quantity;
          const itemVATAmount = (item.vatAmount || item.vat_amount || 0) * quantity;
          const itemTotalWithVAT = (item.priceWithVAT || item.price_with_vat || 0) * quantity;
          
          totals.subtotal += itemSubtotal;
          totals.vatAmount += itemVATAmount;
          totals.totalWithVAT += itemTotalWithVAT;
        }
      });
      
      // Calculate subtotalWithVAT (subtotal + VAT)
      totals.subtotalWithVAT = totals.subtotal + totals.vatAmount;
    }

    // Round to 2 decimal places to prevent floating point issues
    return {
      subtotal: Math.round(totals.subtotal * 100) / 100,
      subtotalWithVAT: Math.round(totals.subtotalWithVAT * 100) / 100,
      vatAmount: Math.round(totals.vatAmount * 100) / 100,
      vatRate: totals.vatRate,
      totalWithVAT: Math.round(totals.totalWithVAT * 100) / 100
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
