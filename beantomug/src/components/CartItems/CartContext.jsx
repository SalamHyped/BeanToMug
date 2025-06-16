// CartContext.js
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('Dine In');
  const [error, setError] = useState(null);
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
    let totalPrice = item.price;
    
    // Add prices from selected ingredients
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value) {
          const option = item.options[key];
          if (option) {
            if (option.type === "select") {
              const ingredient = item.ingredients.find(ing => ing.name === value);
              if (ingredient) totalPrice += ingredient.price? ingredient.price : 0;
            } else if (option.type === "checkbox") {
              const ingredient = item.ingredients.find(ing => ing.name === key);
              if (ingredient) totalPrice += ingredient.price? ingredient.price : 0;
            }
          }
        }
      });
    }

    return totalPrice;
  };

  const addToCart = async (item, quantity, options) => {
    try {
      
      console.log("options",options);
      // Calculate the total price including ingredient prices
      const itemWithPrice = {
        ...item,
        price: calculateItemPrice(item, options)
      };

      await axios.post('http://localhost:8801/cart/add', {
        item: itemWithPrice,
        quantity,
        options,
      }, { withCredentials: true });

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
      await axios.delete('http://localhost:8801/cart/remove', {
        data: {
          itemId: itemToRemove.item_id,
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
        itemId,
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
      setCartItems
    }}>
      {children}
    </CartContext.Provider>
  );
};
