import React from "react";
import Cart from "../components/CartItems/Cart";
import PayPal from "../components/CartItems/PayPal";
import { useContext, useState } from "react";
import { CartContext } from "../components/CartItems/CartContext";
import classes from "../components/CartItems/Cart.module.css";
import OrderTypeSelector from "../components/CartItems/OrderTypeSelector/OrderTypeSelector";

export default function CartPage() {
  const { cartItems, orderType, updateOrderType, error, cartTotals } = useContext(CartContext);
  const [orderStatus, setOrderStatus] = useState(null);

  const handlePaymentSuccess = (details) => {
    console.log('Payment successful:', details);
    setOrderStatus({
      type: 'success',
      message: `Order #${details.order_id} completed successfully! Thank you for your purchase.`
    });
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setOrderStatus({
      type: 'error',
      message: `Payment failed: ${error.message}`
    });
  };

  const handlePaymentCancel = (data) => {
    console.log('Payment cancelled:', data);
    setOrderStatus({
      type: 'info',
      message: 'Payment was cancelled. You can try again anytime.'
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className={classes.cartContainer}>
        <h2 className={classes.cartTitle}>Your Cart</h2>
        <div className={classes.emptyCart}>
          <p>Your cart is empty</p>
          <p>Add some delicious coffee to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.cartContainer}>
      <h2 className={classes.cartTitle}>Your Cart</h2>
      
      {/* Error Messages */}
      {error && (
        <div className={`${classes.orderStatus} ${classes.error}`}>
          <p>{error}</p>
          <button 
            className={classes.closeStatus}
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Order Status Messages */}
      {orderStatus && (
        <div className={`${classes.orderStatus} ${classes[orderStatus.type]}`}>
          <p>{orderStatus.message}</p>
          <button 
            className={classes.closeStatus}
            onClick={() => setOrderStatus(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Order Type Selector */}
      <OrderTypeSelector 
        selectedType={orderType}
        onTypeChange={updateOrderType}
      />
      
      {/* Cart Items */}
      <div className={classes.cartItems}>
        {cartItems.map((item, index) => (
          <Cart key={index} item={item} />
        ))}
      </div>
      
      {/* Cart Summary */}
      <div className={classes.cartSummary}>
        <div className={classes.summaryRow}>
          <span>Subtotal:</span>
          <span>${cartTotals.subtotal.toFixed(2)}</span>
        </div>
        <div className={classes.summaryRow}>
          <span>VAT ({cartTotals.vatRate}%):</span>
          <span>${cartTotals.vatAmount.toFixed(2)}</span>
        </div>
        <div className={classes.summaryTotal}>
          <span>Total:</span>
          <span>${cartTotals.totalWithVAT.toFixed(2)}</span>
        </div>
      </div>
      
      {/* PayPal Checkout */}
      <PayPal 
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={handlePaymentCancel}
      />
    </div>
  );
}
