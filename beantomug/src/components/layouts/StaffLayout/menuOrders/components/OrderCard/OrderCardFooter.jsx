import React from 'react';
import { getDragProgressMessage } from '../../utils/orderFormatters';
import classes from './orderCard.module.css';

/**
 * Order card footer component
 * Displays drag indicators and action buttons
 */
const OrderCardFooter = ({ 
  order, 
  showCompleted, 
  isDragging, 
  dragProgress, 
  onToggleBackToProcessing 
}) => {
  const handleRestoreClick = (e) => {
    e.stopPropagation();
    onToggleBackToProcessing(order.order_id);
  };

  return (
    <div className={classes.orderFooter}>
      <div className={classes.dragIndicator}>
        {showCompleted ? (
          <button 
            className={classes.restoreButton}
            onClick={handleRestoreClick}
          >
            ↩ Restore to Processing
          </button>
        ) : (
          isDragging ? (
            getDragProgressMessage(dragProgress)
          ) : (
            "→ Swipe right to complete"
          )
        )}
      </div>
    </div>
  );
};

export default OrderCardFooter;
