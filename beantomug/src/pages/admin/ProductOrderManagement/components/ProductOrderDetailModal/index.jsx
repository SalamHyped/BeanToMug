import React from 'react';
import styles from './index.module.css';

const ProductOrderDetailModal = ({ isOpen, onClose, orderId }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>👁️ Order Details</h2>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.comingSoon}>
            <h3>🚧 Coming Soon</h3>
            <p>Detailed order view is currently under development.</p>
            <p>Order ID: {orderId}</p>
            <p>This will show:</p>
            <ul>
              <li>Complete order information</li>
              <li>All ordered ingredients</li>
              <li>Supplier contact details</li>
              <li>Status history</li>
              <li>Delivery tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductOrderDetailModal;
