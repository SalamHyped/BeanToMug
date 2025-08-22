import React from 'react';
import styles from './index.module.css';

const ProductOrderEditModal = ({ isOpen, onClose, orderId, onOrderUpdated }) => {
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
          <h2>✏️ Edit Product Order</h2>
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
            <p>Order editing functionality is currently under development.</p>
            <p>Order ID: {orderId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductOrderEditModal;
