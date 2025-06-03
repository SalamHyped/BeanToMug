import { useNavigate } from 'react-router-dom';
import classes from './PaymentCancel.module.css';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className={classes.paymentCancelContainer}>
      <div className={classes.paymentCancelCard}>
        <div className={classes.cancelIcon}>⚠️</div>
        <h2>Payment Cancelled</h2>
        <p>Your PayPal payment was cancelled.</p>
        <p>Your cart items have been saved and you can try again anytime.</p>
        
        <div className={classes.cancelActions}>
          <button 
            className={classes.backToCartButton}
            onClick={() => navigate('/cart')}
          >
            Back to Cart
          </button>
          <button 
            className={classes.homeButton}
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
        
        <div className={classes.helpText}>
          <p>Need help? Contact our support team.</p>
        </div>
      </div>
    </div>
  );
} 