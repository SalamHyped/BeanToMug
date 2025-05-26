// Cart.js
import  { useContext } from 'react';
import { CartContext } from './CartContext';

export default function Cart() {
  const { cartItems  } = useContext(CartContext);

  return (
    <div>
      <h2>Your Cart</h2>
      {cartItems.length === 0 && <p>Cart is empty</p>}
      {cartItems.map((item, index) => (
        <div key={index}>
          <p>
            {item.item_name} x {item.quantity}
          </p>
          <p>Options: {JSON.stringify(item.options)}</p>
          <p>Total: {(item.price * item.quantity).toFixed(2)} ₪</p>
        </div>
      ))}
    </div>
  );
}