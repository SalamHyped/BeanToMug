import React from 'react';
import { formatTime, getCustomerName } from '../../utils/orderFormatters';
import classes from './orderCard.module.css';

/**
 * Order card header component
 * Displays order number, status, type, time, and customer info
 */
const OrderCardHeader = ({ order }) => {
  const customerName = getCustomerName(order);

  return (
    <div className={classes.orderHeader}>
      <div className={classes.orderTitle}>
        <span className={classes.orderNumber}>#{order.order_id}</span>
        <span className={classes.orderStatus}>{order.status}</span>
      </div>
      
      <div className={classes.orderMeta}>
        <span className={classes.orderType}>{order.order_type}</span>
        <span className={classes.orderTime}>{formatTime(order.created_at)}</span>
      </div>
      
      {/* Customer name if available */}
      {customerName && (
        <div className={classes.customerInfo}>
          <span className={classes.customerName}>
            {customerName}
          </span>
        </div>
      )}
    </div>
  );
};

export default OrderCardHeader;
