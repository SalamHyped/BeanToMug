import React from "react";
import Cart from "../components/CartItems/Cart";
import { useContext } from "react";
import { CartContext } from "../components/CartItems/CartContext";
import classes from "../components/CartItems/Cart.module.css";


export default function CartPage() {
  const { cartItems } = useContext(CartContext);
  return (
    <div className={classes.cartContainer}>
      <h2 className={classes.cartTitle}>Your Cart</h2>
      {cartItems.map((item, index) => (
        <Cart key={index} item={item} />
      ))}
    </div>
  );
}
