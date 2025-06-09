import React, { useState } from 'react';
import styles from './Rating.module.css';

const Rating = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit({ rating });
    }
  };

  return (
    <div className={styles.ratingContainer}>
      <h2 className={styles.title}>How was your experience?</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={`${styles.star} ${star <= (hover || rating) ? styles.active : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          ))}
        </div>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={rating === 0}
        >
          Submit Rating
        </button>
      </form>
    </div>
  );
};

export default Rating; 