// CartContext.js
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('Dine In');
console.log(orderType);
console.log(cartItems);
  useEffect(() => {
    axios.get('http://localhost:8801/cart', {
      withCredentials: true,
    })
    .then(res => {
      setCartItems(res.data.cart?.items || []);
      setOrderType(res.data.cart?.orderType || 'Dine In');
    })
    .catch(err => {
      console.error('Error fetching cart:', err);
      setCartItems([]);
      setOrderType('Dine In');
    });
  }, []);

  const addToCart = (item, quantity, options) => {
    axios.post('http://localhost:8801/cart/add', {
      item,
      quantity,
      options,
    }, { withCredentials: true })
    .then(res => {
      setCartItems(res.data.cart?.items || []);
      setOrderType(res.data.cart?.orderType || 'Dine In');
    })
    .catch(err => {
      console.error('Error adding to cart:', err);
    });
  };

  const removeFromCart = (itemToRemove) => {
    axios.delete('http://localhost:8801/cart/remove', {
      data: {
        itemId: itemToRemove.item_id,
        options: itemToRemove.options
      },
      withCredentials: true
    })
    .then(res => {
      setCartItems(res.data.cart?.items || []);
      setOrderType(res.data.cart?.orderType || 'Dine In');
    })
    .catch(err => {
      console.error('Error removing from cart:', err);
    });
  };

  const updateQuantity = (itemId, newQuantity, options) => {
    axios.put('http://localhost:8801/cart/update-quantity', {
      itemId,
      quantity: newQuantity,
      options
    }, { withCredentials: true })
    .then(res => {
      setCartItems(res.data.cart?.items || []);
      setOrderType(res.data.cart?.orderType || 'Dine In');
    })
    .catch(err => {
      console.error('Error updating quantity:', err);
    });
  };

  const updateOrderType = (newOrderType) => {
    return axios.put('http://localhost:8801/cart/order-type', {
      orderType: newOrderType
    }, { withCredentials: true })
    .then(res => {
      setOrderType(newOrderType);
    });
  };

  return (
    <CartContext.Provider value={{ 
      cartItems,
      orderType,
      setCartItems,
      addToCart, 
      removeFromCart, 
      updateQuantity,
      updateOrderType 
    }}>
      {children}
    </CartContext.Provider>
  );
};
