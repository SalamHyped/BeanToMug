import React, { memo } from 'react';
import { LazyMotionDiv } from '../MotionComponents';
import OrderCardHeader from './OrderCardHeader';
import OrderCardContent from './OrderCardContent';
import OrderCardFooter from './OrderCardFooter';
import { 
  orderCardTransition, 
  orderCardDragConfig,
  getDragProgressData 
} from '../../utils/orderAnimations';
import { getPriorityClass } from '../../utils/orderFormatters';
import classes from './orderCard.module.css';

/**
 * Individual order card component with drag functionality
 * Handles the complete order display and interactions
 * Uses lazy-loaded Framer Motion for reduced initial bundle size
 */
const OrderCard = memo(({ 
  order, 
  showCompleted,
  dragState,
  onDragStart,
  onDrag,
  onDragEnd,
  onToggleBackToProcessing,
  children // For additional content like items
}) => {
  const { draggedItem, dragProgress, doneOrders } = dragState;
  
  const isDragging = draggedItem?.order_id === order.order_id;
  const isDone = doneOrders.includes(order.order_id);
  const currentDragProgress = dragProgress[order.order_id] || 0;

  // Animation values (direct values, not function params)
  const animateValues = {
    x: isDone ? -200 : 0,
    opacity: isDone ? 0 : 1,
    scale: isDragging ? 1.05 : 1,
    rotate: isDragging 
      ? currentDragProgress > 60 
        ? 5 
        : currentDragProgress > 30 
          ? 2 
          : 0
      : 0
  };

  // Drag configuration
  const dragConfig = showCompleted ? 
    { drag: false } : 
    {
      ...orderCardDragConfig,
      onDragStart: () => onDragStart(order),
      onDrag: (event, info) => onDrag(event, info, order.order_id),
      onDragEnd: (event, info) => onDragEnd(event, info, order.order_id)
    };

  return (
    <LazyMotionDiv
      key={order.order_id}
      layout
      initial={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={animateValues}
      exit={{ x: -200, opacity: 0, scale: 0.8, rotate: -10 }}
      transition={orderCardTransition}
      {...dragConfig}
      className={`${classes.orderCard} ${classes[getPriorityClass(order.status)]} ${isDragging ? classes.dragging : ''}`}
      data-progress={isDragging ? getDragProgressData(currentDragProgress) : undefined}
    >
      <OrderCardHeader order={order} />
      
      <OrderCardContent order={order}>
        {children}
      </OrderCardContent>
      
      <OrderCardFooter 
        order={order}
        showCompleted={showCompleted}
        isDragging={isDragging}
        dragProgress={currentDragProgress}
        onToggleBackToProcessing={onToggleBackToProcessing}
      />
      
      {/* Drag progress indicator */}
      <LazyMotionDiv
        className={classes.dragProgressBar}
        initial={{ width: "0%" }}
        animate={{ 
          width: currentDragProgress > 0 ? `${currentDragProgress}%` : "0%" 
        }}
      />
    </LazyMotionDiv>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;
