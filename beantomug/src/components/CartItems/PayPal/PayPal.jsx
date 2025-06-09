import { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../CartContext';
import { useUser } from '../../../context/UserContext/UserContext';
import classes from './PayPal.module.css';
import axios from 'axios';

/**
 * PayPal Component with Guest Checkout Support
 */
export default function PayPal({ onSuccess, onError, onCancel }) {
  const navigate = useNavigate();
  const { cartItems, setCartItems } = useContext(CartContext);
  const { user } = useUser(); // Get authentication status (optional for guests)
  const paypalRef = useRef();
  const paypalInstanceRef = useRef(null); // Track PayPal instance
  const isInitializingRef = useRef(false); // Prevent multiple initializations
  const cleanupTimeoutRef = useRef(null); // Track cleanup timeout
  const isMountedRef = useRef(true); // Track component mount status
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paypalKey, setPaypalKey] = useState(0); // Force re-render key

  // Memoize cart key to prevent unnecessary re-renders
  const cartKey = useMemo(() => {
    return cartItems.map(item => 
      `${item.item_id || item.id}-${item.quantity}-${JSON.stringify(item.options || {})}`
    ).join('|');
  }, [cartItems]);

  /**
   * Calculate total price for display
   */
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.item_price * item.quantity);
    }, 0).toFixed(2);
  };

  /**
   * 🔒 Create order on server - Supports both guest and authenticated users
   */
  const createSecureOrder = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      
      const response = await axios.post('http://localhost:8801/paypal/create-paypal-order', {}, {
        withCredentials: true,
        timeout: 15000
      });
      console.log('PayPal order created:', response.data);

      return response.data.order_id;
    } catch (err) {
      console.error('Order creation failed:', err);
      setIsProcessing(false); // ← Critical fix: Reset loading state
      
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create order';
      setError(errorMessage);
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      throw new Error(errorMessage);
    }
  };

  /**
   * 🔒 Complete payment on server - Supports both guest and authenticated users
   */
  const completeSecurePayment = async (paypalOrderId) => {
    console.log('PayPal SDK onApprove:', paypalOrderId);
    try {
      const response = await axios.post('http://localhost:8801/paypal/complete-payment', {
        order_id: paypalOrderId
      }, {
        withCredentials: true,
        timeout: 15000
      });

      if (response.data.success) {
        // Clear cart after successful payment
        setCartItems([]);
        
        // Navigate to payment success page
        navigate('/payment-success', { 
          state: { 
            orderDetails: response.data 
          }
        });
        
        // Notify parent of success
        if (onSuccess) {
          onSuccess({
            ...response.data,
            message: 'Payment completed successfully! Thank you for your purchase.'
          });
        }
      } else {
        throw new Error(response.data.error || 'Payment completion failed');
      }
    } catch (err) {
      console.error('Payment completion failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Payment processing failed';
      setError(errorMessage);
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Enhanced cleanup PayPal buttons - PREVENTS DUPLICATION
   */
  const cleanupPayPal = () => {
    // Clear any pending cleanup timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Close PayPal instance
    if (paypalInstanceRef.current) {
      try {
        if (typeof paypalInstanceRef.current.close === 'function') {
          paypalInstanceRef.current.close();
        }
      } catch (err) {
        console.warn('PayPal cleanup warning:', err);
      }
      paypalInstanceRef.current = null;
    }
    
    // Aggressive DOM cleanup
    if (paypalRef.current) {
      // First, clear immediately
      paypalRef.current.innerHTML = '';
      
      // Additional cleanup with timeout for PayPal's internal cleanup
      cleanupTimeoutRef.current = setTimeout(() => {
        if (paypalRef.current && isMountedRef.current) {
          // Clear everything including any PayPal-generated content
          paypalRef.current.innerHTML = '';
          
          // Remove any PayPal-specific classes or attributes
          const paypalElements = paypalRef.current.querySelectorAll('[data-paypal-checkout]');
          paypalElements.forEach(el => el.remove());
        }
        cleanupTimeoutRef.current = null;
      }, 500); // Longer timeout for thorough cleanup
    }
  };

  /**
   * Initialize PayPal buttons with enhanced duplication prevention
   */
  useEffect(() => {
    // Reset mount status on effect
    isMountedRef.current = true;

    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      return;
    }

    // Check if user has items in cart
    if (cartItems.length === 0) {
      cleanupPayPal();
      setIsLoading(false);
      return;
    }

    // Check if PayPal SDK is loaded
    if (!window.paypal) {
      console.warn('PayPal SDK not loaded, waiting...');
      setIsLoading(true);
      setError('Loading PayPal SDK...');
      return;
    }

    // Validate PayPal SDK has required methods
    if (!window.paypal.Buttons || typeof window.paypal.Buttons !== 'function') {
      console.error('PayPal SDK loaded but Buttons method not available');
      setError('PayPal SDK not properly loaded. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    // Set initialization flag
    isInitializingRef.current = true;

    const initializePayPal = async () => {
      try {
        if (!isMountedRef.current) {
          return; // Component unmounted, abort
        }

        setIsLoading(false);
        setError(null);
        
        // Cleanup any existing PayPal instance first
        cleanupPayPal();
        
        // Wait for cleanup to complete + extra safety margin
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Double-check component is still mounted and container exists
        if (!isMountedRef.current || !paypalRef.current || !document.contains(paypalRef.current)) {
          console.warn('PayPal container not found or component unmounted');
          return;
        }

        // Force container reset
        paypalRef.current.innerHTML = '';
        
        // Generate unique container ID to prevent conflicts
        const containerId = `paypal-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        paypalRef.current.innerHTML = `<div id="${containerId}"></div>`;
        
        // Wait a bit more for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create PayPal buttons with unique container
        const paypalButtons = window.paypal.Buttons({
          createOrder: async () => {
            try {
              return await createSecureOrder();
            } catch (error) {
              setIsProcessing(false);
              throw error;
            }
          },

          onApprove: async (data) => {
            try {
              await completeSecurePayment(data.orderID);
            } catch (error) {
              setIsProcessing(false);
            }
          },

          onError: (err) => {
            console.error('PayPal SDK error details:', {
              error: err,
              errorType: typeof err,
              errorMessage: err?.message || 'Unknown error',
              errorCode: err?.code,
              stack: err?.stack,
              timestamp: new Date().toISOString()
            });
            
            setIsProcessing(false);
            
            // More specific error messages based on error type
            let errorMessage = 'PayPal encountered an error. Please try again.';
            
            if (err?.message) {
              if (err.message.includes('timeout')) {
                errorMessage = 'PayPal request timed out. Please check your connection and try again.';
              } else if (err.message.includes('network')) {
                errorMessage = 'Network error connecting to PayPal. Please try again.';
              } else if (err.message.includes('permission') || err.message.includes('authorization')) {
                errorMessage = 'PayPal authorization error. Please refresh the page and try again.';
              }
            }
            
            setError(errorMessage);
            
            if (onError) {
              onError(new Error(errorMessage));
            }
          },

          onCancel: (data) => {
            console.log('PayPal payment cancelled:', data);
            setIsProcessing(false);
            
            if (onCancel) {
              onCancel(data);
            }
          },

          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 55
          }
        });

        // Render to the unique container
        const targetContainer = document.getElementById(containerId);
        if (targetContainer && isMountedRef.current) {
          paypalInstanceRef.current = await paypalButtons.render(`#${containerId}`);
          console.log('PayPal buttons rendered successfully');
        }

      } catch (error) {
        console.error('PayPal initialization error:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsProcessing(false);
          setError('Failed to initialize PayPal. Please refresh the page.');
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializePayPal();

    // Cleanup function
    return () => {
      isInitializingRef.current = false;
      cleanupPayPal();
    };
  }, [cartKey, paypalKey]); // Include paypalKey for forced re-renders

  // Mount/unmount management
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupPayPal();
    };
  }, []);

  // Manual retry function that forces complete re-initialization
  const forceReinitialize = () => {
    setError(null);
    setIsProcessing(false);
    cleanupPayPal();
    
    // Force re-render with new key
    setTimeout(() => {
      setPaypalKey(prev => prev + 1);
    }, 600);
  };

  // Don't render if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className={classes.paypalContainer}>
        <p>Your cart is empty. Add some items to checkout!</p>
      </div>
    );
  }

  return (
    <div className={classes.paypalContainer}>
      {/* Order Summary */}
      <div className={classes.paypalSummary}>
        <h3 className={classes.paypalTitle}>Secure Checkout</h3>
        
        {/* User Status */}
        {user ? (
          <p className={classes.userInfo}>Logged in as: <strong>{user.username}</strong></p>
        ) : (
          <p className={classes.guestInfo}>Checking out as guest</p>
        )}
        
        {/* Error Display */}
        {error && (
          <div className={classes.orderError}>
            <p>⚠️ {error}</p>
            <button 
              className={classes.retryButton}
              onClick={forceReinitialize}
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Cart Items */}
        <div className={classes.paypalItems}>
          {cartItems.map((item, index) => (
            <div key={index} className={classes.paypalItem}>
              <span className={classes.itemName}>
                {item.item_name}
                {item.options && Object.keys(item.options).length > 0 && (
                  <span className={classes.itemOptions}>
                    ({Object.entries(item.options)
                      .filter(([key, value]) => value)
                      .map(([key, value]) => typeof value === 'boolean' ? key : value)
                      .join(', ')})
                  </span>
                )}
              </span>
              <span className={classes.itemQuantity}>Qty: {item.quantity}</span>
              <span className={classes.itemPrice}>
                ${(item.item_price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className={classes.paypalTotal}>
          <strong>Total: ${calculateTotal()}</strong>
        </div>
      </div>
      
      {/* Processing Overlay */}
      {isProcessing && (
        <div className={classes.processingOverlay}>
          <div className={classes.spinner}></div>
          <h3>Processing Payment</h3>
          <p>Please wait while we complete your order...</p>
        </div>
      )}
      
      {/* PayPal Button Container */}
      <div className={classes.paypalButtonContainer}>
        {isLoading && (
          <div className={classes.loadingButton}>
            <div className={classes.buttonSpinner}></div>
            <span>Loading PayPal...</span>
          </div>
        )}
        
        {/* PayPal SDK renders buttons here */}
        <div 
          ref={paypalRef}
          className={`${classes.paypalButtonWrapper} ${(error || isProcessing) ? classes.disabled : ''}`}
        ></div>
      </div>
      
      {/* Security Information */}
      <div className={classes.securityInfo}>
        <div className={classes.securityBadges}>
          <span className={classes.badge}>🔒 SSL Encrypted</span>
          <span className={classes.badge}>✅ Server Validated</span>
          <span className={classes.badge}>🛡️ PayPal Secure</span>
        </div>
        <p>Your payment is processed securely through PayPal</p>
        {!user && (
          <p className={classes.guestNote}>
            💡 Want to track your order? <a href="/login">Sign up</a> for faster checkout next time!
          </p>
        )}
      </div>
    </div>
  );
}
