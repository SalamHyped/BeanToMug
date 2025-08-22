import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit } from 'react-icons/fa';
import { useProductOrderEditor } from '../../hooks';
import ProductOrderFormBase from '../shared/ProductOrderFormBase';
import styles from './index.module.css';

const ProductOrderEditModal = ({ isOpen, onClose, orderId, onOrderUpdated }) => {
  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { 
    order, 
    loading: orderLoading, 
    error: orderError, 
    fetchOrder, 
    updateOrder,
    clearError 
  } = useProductOrderEditor();

  // Fetch order data when modal opens
  useEffect(() => {
    if (isOpen && orderId !== null && orderId !== undefined) {
      clearError();
      fetchOrder(orderId);
    }
  }, [isOpen, orderId, fetchOrder, clearError]);

  // Prepare initial data when order is loaded
  useEffect(() => {
    if (order && order.order) {
      const orderData = order.order;
      setInitialData({
        supplier_id: orderData.supplier_id || '',
        order_start_date: orderData.order_start_date ? orderData.order_start_date.split('T')[0] : '',
        order_end_date: orderData.order_end_date ? orderData.order_end_date.split('T')[0] : '',
        notes: orderData.notes || '',
        items: order.items || []
      });
    }
  }, [order]);

  // Reset data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialData({});
      clearError();
      setIsLoading(false);
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (orderData) => {
    setIsLoading(true);
    
    try {
      const result = await updateOrder(orderId, orderData);
      
      if (result.success) {
        if (onOrderUpdated) {
          onOrderUpdated();
        }
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <FaEdit className={styles.headerIcon} /> 
            Edit Product Order #{orderId}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          {orderLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading order details...</p>
            </div>
          ) : orderError ? (
            <div className={styles.error}>
              <p>Error loading order: {orderError}</p>
              <button onClick={() => fetchOrder(orderId)} className={styles.retryButton}>
                Retry
              </button>
            </div>
          ) : Object.keys(initialData).length > 0 ? (
            <ProductOrderFormBase
              mode="edit"
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel="Save Changes"
              isLoading={isLoading}
            />
          ) : (
            <div className={styles.loading}>
              <p>Preparing form...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductOrderEditModal;