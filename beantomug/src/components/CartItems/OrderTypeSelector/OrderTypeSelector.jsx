import React, { useContext } from 'react';
import styles from './OrderTypeSelector.module.css';
import { CartContext } from '../CartContext';

const OrderTypeSelector = ({ selectedType, onTypeChange }) => {
  const { updateOrderType } = useContext(CartContext);

  const handleTypeChange = async (newType) => {
    try {
      await updateOrderType(newType);
      onTypeChange(newType);
    } catch (error) {
      console.error('Error updating order type:', error);
    }
  };

  return (
    <div className={styles.orderTypeContainer}>
      <h3 className={styles.title}>Order Type</h3>
      <div className={styles.toggleContainer}>
        <div className={styles.toggleBackground}>
          <div className={`${styles.toggleSlider} ${selectedType === 'Take Away' ? styles.slideRight : ''}`}></div>
        </div>
        <label className={styles.toggleLabel}>
          <input
            type="radio"
            name="orderType"
            value="Dine In"
            checked={selectedType === 'Dine In'}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
          <span>Dine In</span>
        </label>
        <label className={styles.toggleLabel}>
          <input
            type="radio"
            name="orderType"
            value="Take Away"
            checked={selectedType === 'Take Away'}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
          <span>Take Away</span>
        </label>
      </div>
    </div>
  );
};

export default OrderTypeSelector; 