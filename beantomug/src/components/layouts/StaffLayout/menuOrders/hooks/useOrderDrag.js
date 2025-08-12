import { useState, useCallback } from 'react';

/**
 * Custom hook for managing drag & drop functionality
 * Handles drag state, progress, and completion logic
 */
export const useOrderDrag = (onOrderComplete = () => {}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragProgress, setDragProgress] = useState({});
  const [doneOrders, setDoneOrders] = useState([]);

  const handleDragStart = useCallback((order) => {
    setDraggedItem(order);
  }, []);

  const handleDrag = useCallback((event, info, order_id) => {
    const progress = Math.min(Math.max(info.offset.x / 100, 0), 1);
    setDragProgress(prev => ({ ...prev, [order_id]: progress }));
  }, []);

  const handleDragEnd = useCallback((event, info, order_id) => {
    const progress = info.offset.x / 100;
    
    if (progress >= 0.8) {
      // Mark as done
      setDoneOrders((prev) => [...prev, order_id]);
      
      // Call the completion handler if provided
      if (onOrderComplete && typeof onOrderComplete === 'function') {
        onOrderComplete(order_id);
      }
      
      // Reset progress after animation
      setTimeout(() => {
        setDragProgress(prev => ({ ...prev, [order_id]: 0 }));
      }, 300);
    } else {
      // Reset progress if not dragged far enough
      setDragProgress(prev => ({ ...prev, [order_id]: 0 }));
    }
  }, [onOrderComplete]);

  const resetDoneOrder = useCallback((order_id) => {
    setDoneOrders((prev) => prev.filter(id => id !== order_id));
  }, []);

  return {
    draggedItem,
    dragProgress,
    doneOrders,
    setDoneOrders,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    resetDoneOrder
  };
};
