import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../../utils/config';
import { 
  FaEye, 
  FaTimes, 
  FaBox, 
  FaClock, 
  FaTruck, 
  FaCheckCircle, 
  FaTimesCircle,
  FaCalendarAlt,
  FaShippingFast,
  FaStore,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaClipboardList,
  FaDollarSign,
  FaCubes,
  FaTag,
  FaFlask
} from 'react-icons/fa';
import styles from './index.module.css';

const ProductOrderDetailModal = ({ isOpen, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch order details when modal opens
  useEffect(() => {
    if (isOpen && (orderId !== null && orderId !== undefined)) {
      // Reset state when opening modal
      setOrderDetails(null);
      setError(null);
      fetchOrderDetails();
    } else {
      // Reset state when modal closes
      if (!isOpen) {
        setOrderDetails(null);
        setError(null);
        setLoading(false);
      }
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `/product-orders/${orderId}`,
        getApiConfig()
      );
      
      if (response.data.success) {
        setOrderDetails(response.data);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': styles.statusPending,
      'shipped': styles.statusShipped,
      'received': styles.statusReceived,
      'cancelled': styles.statusCancelled
    };
    return colors[status] || styles.statusDefault;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <FaClock className={styles.statusIcon} />,
      'shipped': <FaTruck className={styles.statusIcon} />,
      'received': <FaCheckCircle className={styles.statusIcon} />,
      'cancelled': <FaTimesCircle className={styles.statusIcon} />
    };
    return icons[status] || <FaBox className={styles.statusIcon} />;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2><FaEye className={styles.headerIcon} /> Order Details</h2>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading order details for Order ID: {orderId}...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <p>Order ID: {orderId}</p>
              <button onClick={fetchOrderDetails} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}



          {orderDetails && !loading && (
            <div className={styles.orderDetailsContainer}>
              {/* Order Header */}
              <div className={styles.orderHeader}>
                <div className={styles.orderTitle}>
                  <h3><FaBox className={styles.sectionIcon} /> Order #{orderDetails.order.order_id}</h3>
                  <span className={`${styles.status} ${getStatusColor(orderDetails.order.status)}`}>
                    {getStatusIcon(orderDetails.order.status)} {orderDetails.order.status_display || orderDetails.order.status}
                  </span>
                </div>
                <div className={styles.orderMeta}>
                  <p><strong>Total Cost:</strong> {formatCurrency(orderDetails.order.total_price)}</p>
                  <p><strong>Items:</strong> {orderDetails.order.item_count} ({orderDetails.order.total_quantity} total qty)</p>
                </div>
              </div>

              {/* Order Timeline */}
              <div className={styles.orderDates}>
                <div className={styles.dateItem}>
                  <div className={styles.dateLabel}><FaCalendarAlt className={styles.dateIcon} /> Order Date</div>
                  <div className={styles.dateValue}>{formatDate(orderDetails.order.order_start_date)}</div>
                </div>
                <div className={styles.dateItem}>
                  <div className={styles.dateLabel}><FaShippingFast className={styles.dateIcon} /> Expected Delivery</div>
                  <div className={styles.dateValue}>{formatDate(orderDetails.order.order_end_date)}</div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className={styles.supplierSection}>
                <h4><FaStore className={styles.sectionIcon} /> Supplier Information</h4>
                <div className={styles.supplierCard}>
                  <div className={styles.supplierHeader}>
                    <h5>{orderDetails.order.supplier_name}</h5>
                    <span className={`${styles.supplierStatus} ${orderDetails.order.supplier_status ? styles.active : styles.inactive}`}>
                      {orderDetails.order.supplier_status ? <><FaCheckCircle className={styles.statusIcon} /> Active</> : <><FaTimesCircle className={styles.statusIcon} /> Inactive</>}
                    </span>
                  </div>
                  <div className={styles.supplierContact}>
                    {orderDetails.order.supplier_phone && (
                      <p><FaPhone className={styles.contactIcon} /> {orderDetails.order.supplier_phone}</p>
                    )}
                    {orderDetails.order.supplier_email && (
                      <p><FaEnvelope className={styles.contactIcon} /> {orderDetails.order.supplier_email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className={styles.itemsSection}>
                <h4><FaCubes className={styles.sectionIcon} /> Ordered Items ({orderDetails.items.length})</h4>
                <div className={styles.itemsList}>
                  {orderDetails.items.map((item) => (
                    <div key={item.order_item_id} className={styles.orderItem}>
                      <div className={styles.itemHeader}>
                        <h5>{item.ingredient_name}</h5>
                        <div className={styles.itemBadges}>
                          {item.brand && (
                            <span className={styles.brandBadge}><FaTag className={styles.badgeIcon} /> {item.brand}</span>
                          )}
                          {item.ingredient_type && (
                            <span className={styles.typeBadge}><FaFlask className={styles.badgeIcon} /> {item.ingredient_type}</span>
                          )}
                          {item.quantity_in_stock <= item.low_stock_threshold && (
                            <span className={styles.lowStockBadge}><FaExclamationTriangle className={styles.badgeIcon} /> Low Stock</span>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.itemDetails}>
                        <div className={styles.itemQuantity}>
                          <span className={styles.label}>Quantity:</span>
                          <span className={styles.value}>
                            {item.quantity_ordered} {item.unit}
                          </span>
                        </div>
                        <div className={styles.itemCost}>
                          <span className={styles.label}>Unit Cost:</span>
                          <span className={styles.value}>
                            {formatCurrency(item.unit_cost)}
                          </span>
                        </div>
                        <div className={styles.itemTotal}>
                          <span className={styles.label}>Line Total:</span>
                          <span className={`${styles.value} ${styles.total}`}>
                            {formatCurrency(item.total_cost)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.itemStock}>
                        <div className={styles.stockInfo}>
                          <span className={styles.label}>Current Stock:</span>
                          <span className={`${styles.value} ${item.quantity_in_stock <= item.low_stock_threshold ? styles.warning : ''}`}>
                            {item.quantity_in_stock} {item.unit}
                          </span>
                        </div>
                        <div className={styles.stockThreshold}>
                          <span className={styles.label}>Low Stock Threshold:</span>
                          <span className={styles.value}>
                            {item.low_stock_threshold} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className={styles.orderSummary}>
                <h4><FaClipboardList className={styles.sectionIcon} /> Order Summary</h4>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Total Items:</span>
                    <span className={styles.value}>{orderDetails.statistics.total_items}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Total Quantity:</span>
                    <span className={styles.value}>{orderDetails.statistics.total_quantity}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Order Status:</span>
                    <span className={`${styles.value} ${getStatusColor(orderDetails.order.status)}`}>
                      {getStatusIcon(orderDetails.order.status)} {orderDetails.order.status_display || orderDetails.order.status}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Total Cost:</span>
                    <span className={`${styles.value} ${styles.totalCost}`}>
                      {formatCurrency(orderDetails.order.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductOrderDetailModal;
