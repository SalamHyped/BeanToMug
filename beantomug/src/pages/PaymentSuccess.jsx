import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Rating from '../components/Rating/Rating';
import styles from './PaymentSuccess.module.css';

const PaymentSuccess = () => {
  console.log('PaymentSuccess component rendered');
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(location.state?.orderDetails || null);
  const [showRating, setShowRating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderDetails) {
      console.log('No order details found, redirecting to home');
      navigate('/');
    } else {
      console.log('Order details found:', orderDetails);
      setShowRating(true);
    }
  }, [orderDetails, navigate]);

  const handleRatingSubmit = async (ratingData) => {
    try {
      console.log('Submitting rating:', {
        rating: ratingData.rating,
        orderId: orderDetails.order_id,
       
      });

      const response = await axios.post('http://localhost:8801/ratings', {
        orderId: orderDetails.order_id,
        rating: ratingData.rating,
      }, {
        withCredentials: true
      });

      console.log('Rating submission response:', response.data);
      navigate('/');
    } catch (error) {
      console.error('Error submitting rating:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      navigate('/');
    }
  };

  if (!orderDetails) {
    return (
      <div className={styles.container}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.successMessage}>
        <h2>Payment Successful!</h2>
        <p>Thank you for your order.</p>
        {showRating && (
          <div className={styles.ratingContainer}>
            <Rating onSubmit={handleRatingSubmit} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 