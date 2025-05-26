// CartContext.js
import { createContext, useState ,useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);


console.log('Cart items:', cartItems);
  useEffect(() => {
    axios.get('http://localhost:8801/cart', {
      withCredentials: true,
    })
    .then(res => {
      setCartItems(res.data);
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
    .then(res => setCartItems(res.data)) // Update local state with the updated cart from session
    .catch(err => console.error('Error adding to cart:', err));
};
 

  const removeFromCart = (itemToRemove) => {
  setCartItems((prevItems) =>
    prevItems.filter(
      (item) =>
        item.id !== itemToRemove.id ||
        JSON.stringify(item.options) !== JSON.stringify(itemToRemove.options)
    )
  );
};

  return (
    <CartContext.Provider value={{ cartItems, addToCart ,removeFromCart}}>
      {children}
    </CartContext.Provider>
  );
};
