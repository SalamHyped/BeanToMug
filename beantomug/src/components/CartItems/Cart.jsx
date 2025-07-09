import classes from "./Cart.module.css";
import { useContext, useState } from "react";
import { CartContext } from "./CartContext";

export default function Cart({ item }) {
  const { removeFromCart, updateQuantity, error } = useContext(CartContext);
  const [localError, setLocalError] = useState(null);

  function handleOptions() {
    if (!item.options) return "";
    
    const selectedOptionsList = [];
    
    // Handle the new options structure
    Object.entries(item.options).forEach(([key, option]) => {
      if (option && option.selected) {
        selectedOptionsList.push(`${option.label}: ${option.value}`);
      }
    });

    return selectedOptionsList.join(' | ');
  }

  const handleDecreaseQuantity = async () => {
    if (item.quantity > 1) {
      try {
        await updateQuantity(item.item_id, item.quantity - 1, item.options);
        setLocalError(null);
      } catch (err) {
        setLocalError(err.message || 'Failed to update quantity');
      }
    }
  };

  const handleIncreaseQuantity = async () => {
    try {
      await updateQuantity(item.item_id, item.quantity + 1, item.options);
      setLocalError(null);
    } catch (err) {
      setLocalError(err.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async () => {
    try {
      await removeFromCart(item);
      setLocalError(null);
    } catch (err) {
      setLocalError(err.message || 'Failed to remove item');
    }
  };

  const calculateItemTotal = () => {
    // Use item_price if available (from backend), otherwise calculate from base price
    let itemPrice;
    if (item.item_price !== undefined && item.item_price !== null) {
      itemPrice = parseFloat(item.item_price);
    } else {
      let totalPrice = parseFloat(item.price || 0);
      
      // Add prices from selected options if they exist
      if (item.options && typeof item.options === 'object') {
        Object.entries(item.options).forEach(([key, option]) => {
          if (option && option.selected && option.price) {
            totalPrice += parseFloat(option.price || 0);
          }
        });
      }
      itemPrice = totalPrice;
    }

    return itemPrice * item.quantity;
  };

  return (
    <div className={classes.cartCard}>
      {/* Error Message */}
      {localError && (
        <div className={classes.errorMessage}>
          <p>{localError}</p>
          <button 
            className={classes.closeError}
            onClick={() => setLocalError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className={classes.cartImage}>
        <img
          className={classes.cartImg}
          src={item.item_photo_url}
          alt={item.item_name}
        />
      </div>
      <div className={classes.cartDetails}>
        <div className={classes.cartName}>{item.item_name}</div>
        {item.options && Object.keys(item.options).length > 0 && (
          <div className={classes.cartOptions}>
            {handleOptions()}
          </div>
        )}
        <div className={classes.cartPrice}>
          <span className={classes.unitPrice}>
            ${Number(item.item_price || item.price || 0).toFixed(2)} base
          </span>
          <span className={classes.totalPrice}>
            Total: ${calculateItemTotal().toFixed(2)}
          </span>
        </div>
      </div>
      <div className={classes.cartQuantity}>
        <button 
          className={classes.cartButton}
          onClick={handleDecreaseQuantity}
          disabled={item.quantity <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className={classes.quantityNumber}>{item.quantity}</span>
        <button 
          className={classes.cartButton}
          onClick={handleIncreaseQuantity}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button 
        className={classes.cartDelete}
        onClick={handleRemoveItem}
        aria-label="Remove item from cart"
      >
        🗑️
      </button>
    </div>
  );
}
