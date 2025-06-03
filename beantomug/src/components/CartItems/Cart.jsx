import classes from "./Cart.module.css";
import { useContext } from "react";
import { CartContext } from "./CartContext";

export default function Cart({ item }) {
  const { removeFromCart, updateQuantity } = useContext(CartContext);

  function handleOptions() {
    const options = Object.entries(item.options)
      .map(([key, value]) => {
        if (value) {
          return typeof value === "boolean" ? key : value.toString();
        }
      })
      .filter(Boolean);

    return options.join(", ");
  }

  const handleDecreaseQuantity = () => {

    if (item.quantity > 1) {
      updateQuantity(item.item_id, item.quantity - 1, item.options);
    }
  };

  const handleIncreaseQuantity = () => {
    updateQuantity(item.item_id, item.quantity + 1, item.options);
  };

  const handleRemoveItem = () => {
    removeFromCart(item);
  };

  return (
    <div className={classes.cartCard}>
      <div className={classes.cartImage}>
        <img
          className={classes.cartImg}
          src={item.item_photo_url}
          alt={item.item_name}
        />
      </div>
      <div className={classes.cartDetails}>
        <div className={classes.cartName}>{item.item_name}</div>
        <div className={classes.cartOptions}>
          {item.options && Object.keys(item.options).length
            ? handleOptions()
            : ""}
        </div>
      </div>
      <div className={classes.cartQuantity}>
        <button 
          className={classes.cartButton}
          onClick={handleDecreaseQuantity}
          disabled={item.quantity <= 1}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span>{item.quantity}</span>
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
