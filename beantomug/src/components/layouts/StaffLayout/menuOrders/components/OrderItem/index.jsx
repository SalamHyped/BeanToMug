import React, { memo } from 'react';
import ItemDetails from '../ItemDetails';
import classes from './orderItem.module.css';

/**
 * Memoized OrderItem component to prevent unnecessary re-renders
 * Handles individual order items with preparation checkboxes
 */
const OrderItem = ({ 
  item, 
  originalIndex, 
  isPrepared, 
  order_id, 
  toggleItemPrepared,
  parentClasses // CSS classes from parent component
}) => {
  // Use parent classes if provided, fallback to local classes
  const styles = parentClasses || classes;

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    toggleItemPrepared(order_id, originalIndex);
  };

  const handleContainerEvents = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={`${styles.orderItemDetail} ${isPrepared ? styles.preparedItem : ''}`}>
      <div className={styles.itemMain}>
        <div 
          className={styles.itemCheckbox}
          onClick={handleContainerEvents}
          onMouseDown={handleContainerEvents}
          onTouchStart={handleContainerEvents}
        >
          <input
            type="checkbox"
            checked={isPrepared}
            onChange={handleCheckboxChange}
            className={styles.preparationCheckbox}
          />
          <span className={`${styles.itemName} ${isPrepared ? styles.preparedText : ''}`}>
            {item.item_name}
          </span>
        </div>
        <span className={styles.itemQuantity}>x{item.quantity}</span>
      </div>
      <ItemDetails item={item} classes={styles} />
    </div>
  );
};

OrderItem.displayName = 'OrderItem';

export default OrderItem;
