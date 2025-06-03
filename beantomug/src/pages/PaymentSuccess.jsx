import { useEffect, useState, useContext, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../components/CartItems/CartContext';
import axios from 'axios';
import classes from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCartItems } = useContext(CartContext);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Optimized payment completion with retry logic
   */
  const completePayment = useCallback(async (paypalOrderId, attempt = 1) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await axios.post('http://localhost:8801/api/complete-payment', {
        paypalOrderId
      }, {
        withCredentials: true,
        signal: controller.signal,
        timeout: 10000 // Axios timeout
      });

      clearTimeout(timeoutId);

      if (response.data.success) {
        setOrderDetails(response.data);
        
        // Optimized cart clearing (batch update)
        setCartItems([]);
        
        // Auto redirect with longer delay for better UX
        setTimeout(() => navigate('/'), 3000);
        
        return true;
      } else {
        throw new Error(response.data.error || 'Payment completion failed');
      }

    } catch (err) {
      console.error(`Payment completion attempt ${attempt} failed:`, err);
      
      // Retry logic for transient failures
      if (attempt < 3 && !err.message.includes('No order ID')) {
        setRetryCount(attempt);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        return completePayment(paypalOrderId, attempt + 1);
      }
      
      throw err;
    }
  }, [setCartItems, navigate]);

  /**
   * Manual retry handler
   */
  const handleRetry = useCallback(() => {
    const paypalOrderId = searchParams.get('token');
    if (!paypalOrderId) return;
    
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    
    completePayment(paypalOrderId)
      .catch(err => {
        setError(err.response?.data?.error || err.message || 'Payment processing failed');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchParams, completePayment]);

  useEffect(() => {
    const paypalOrderId = searchParams.get('token');
    
    if (!paypalOrderId) {
      setError('No order ID found in URL');
      setIsLoading(false);
      return;
    }

    // Optimized completion with cleanup
    let isMounted = true;
    
    completePayment(paypalOrderId)
      .catch(err => {
        if (isMounted) {
          setError(err.response?.data?.error || err.message || 'Payment processing failed');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
    };
  }, [searchParams, completePayment]);

  const isSuccess = !isLoading && !error;

  return (
    <div className={classes.paymentResultContainer}>
      <div className={classes.paymentResultCard}>
        {isLoading && (
          <>
            <div className={classes.spinner}></div>
            <h2>Processing Payment</h2>
            <p>Completing your order...</p>
            {retryCount > 0 && (
              <p className={classes.retryInfo}>
                Retry attempt {retryCount}/3...
              </p>
            )}
          </>
        )}
        
        {isSuccess && (
          <>
            <div className={classes.successIcon}>✅</div>
            <h2>Payment Successful!</h2>
            <p>Thank you for your purchase!</p>
            
            {orderDetails && (
              <div className={classes.orderDetails}>
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> #{orderDetails.orderId}</p>
                <p><strong>Transaction:</strong> {orderDetails.paypalOrderId}</p>
              </div>
            )}
            
            <p className={classes.redirectNote}>
              Redirecting to home in 3 seconds...
            </p>
            
            <button 
              className={classes.continueButton}
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </>
        )}
        
        {error && (
          <>
            <div className={classes.errorIcon}>❌</div>
            <h2>Payment Processing Issue</h2>
            <p>{error}</p>
            
            <div className={classes.errorActions}>
              <button 
                className={classes.retryButton}
                onClick={handleRetry}
              >
                Retry Processing
              </button>
              <button 
                className={classes.retryButton}
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </button>
              <button 
                className={classes.homeButton}
                onClick={() => navigate('/')}
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 