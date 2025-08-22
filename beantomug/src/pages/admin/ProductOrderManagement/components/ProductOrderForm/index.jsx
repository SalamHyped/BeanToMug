import React from 'react';
import { useProductOrderEditor } from '../../hooks';
import ProductOrderFormBase from '../shared/ProductOrderFormBase';
import styles from './index.module.css';

const ProductOrderForm = ({ onOrderCreated, onCancel }) => {
  const { createOrder, loading: creatingOrder, error: orderError } = useProductOrderEditor();

  const handleSubmit = async (orderData) => {
    const result = await createOrder(orderData);
    
    if (result.success && onOrderCreated) {
      onOrderCreated();
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>➕ Create New Product Order</h2>
        <p>Create a new order for ingredients from suppliers</p>
      </div>

      <ProductOrderFormBase
        mode="create"
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitLabel="Create Order"
        isLoading={creatingOrder}
      />

      {orderError && (
        <div className={styles.errorMessage}>
          {orderError}
        </div>
      )}
    </div>
  );
};

export default ProductOrderForm;