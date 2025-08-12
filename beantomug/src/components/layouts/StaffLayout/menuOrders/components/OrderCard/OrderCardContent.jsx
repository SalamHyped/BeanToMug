import React from 'react';
import classes from './orderCard.module.css';

/**
 * Order card content component
 * Provides the main content area with drag handle
 */
const OrderCardContent = ({ order, children }) => {
  return (
    <div className={classes.orderContent}>
      <div className={classes.dragHandle}>⋮⋮</div>
      
      {/* Content area - typically contains order items */}
      <div className={classes.contentArea}>
        {children}
      </div>
    </div>
  );
};

export default OrderCardContent;
