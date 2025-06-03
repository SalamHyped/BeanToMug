// CartContext.js
import { createContext, useState ,useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);


  useEffect(() => {
    axios.get('http://localhost:8801/cart', {
      withCredentials: true,
    })
    .then(res => {
      setCartItems(res.data.cart);

    })
    .catch(err => {
      console.error('Error fetching cart:', err);
    });
  }, []);



  const addToCart = (item, quantity, options) => {
     axios.post('http://localhost:8801/cart/add', {
    item,
    quantity,
    options,
  }, { withCredentials: true })
    .then(res => setCartItems(res.data.cart)) // Fixed: Use res.data.cart consistently
    .catch(err => console.error('Error adding to cart:', err));
};
 

  const removeFromCart = (itemToRemove) => {
    axios.delete('http://localhost:8801/cart/remove', {
      
      data: {
        itemId: itemToRemove.item_id,
        options: itemToRemove.options
      },
      withCredentials: true
    })
    .then(res => setCartItems(res.data.cart)) // Fixed: Use res.data.cart consistently
    .catch(err => console.error('Error removing from cart:', err));
  };

  const updateQuantity = (itemId, newQuantity, options) => {
    axios.put('http://localhost:8801/cart/update-quantity', {
      itemId,
      quantity: newQuantity,
      options
    }, { withCredentials: true })
    .then(res => setCartItems(res.data.cart)) // Fixed: Use res.data.cart consistently
    .catch(err => console.error('Error updating quantity:', err));
  };

  return (
    <CartContext.Provider value={{ cartItems, setCartItems, addToCart, removeFromCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};
