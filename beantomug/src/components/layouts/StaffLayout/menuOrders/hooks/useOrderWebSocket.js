import { useEffect, useCallback, useRef } from 'react';
import socketService from '../../../../../services/socketService';

/**
 * Custom hook for managing WebSocket real-time updates
 * Handles new orders, order updates, and status changes
 * Now expects complete order data from backend WebSocket emissions
 */
export const useOrderWebSocket = (dependencies = {}) => {
  const { showCompleted = false, setOrders = () => {} } = dependencies;
  
  // Use ref to track current state to avoid stale closures
  const currentShowCompletedRef = useRef(showCompleted);
  
  // Update ref when dependency changes
  useEffect(() => {
    currentShowCompletedRef.current = showCompleted;
  }, [showCompleted]);

  // Handle new orders
  const handleNewOrder = useCallback((orderData) => {
    // Check if order matches current filter
    const shouldShow = (currentShowCompletedRef.current && orderData.status === 'completed') || 
                      (!currentShowCompletedRef.current && orderData.status === 'processing');
    
    if (shouldShow) {
      // Backend now always sends complete order data
      setOrders(prev => [...prev, orderData]);
    }
  }, [setOrders]);

  // Handle order updates (status changes, etc.)
  const handleOrderUpdate = useCallback((orderData) => {
    // Use order_id consistently
    const order_id = orderData.order_id;
    const newStatus = orderData.status;
    
    if (!order_id || !newStatus) {
      return;
    }
    
    // Check if order should be shown in current view
    const shouldShow = (currentShowCompletedRef.current && newStatus === 'completed') || 
                      (!currentShowCompletedRef.current && newStatus === 'processing');
    
    setOrders(prev => {
      const existingOrderIndex = prev.findIndex(order => 
        order.order_id == order_id
      );
      
      if (existingOrderIndex !== -1) {
        // Order exists in current view
        if (shouldShow) {
          // Update existing order with complete data from backend
          const updatedOrders = [...prev];
          updatedOrders[existingOrderIndex] = { ...orderData };
          return updatedOrders;
        } else {
          // Remove order if it no longer matches current filter
          return prev.filter(order => 
            order.order_id != order_id
          );
        }
      } else {
        // Order does not exist in current view
        if (shouldShow) {
          // Add order with complete data from backend
          return [...prev, orderData];
        }
        return prev;
      }
    });
  }, [setOrders]);

  // WebSocket event listeners setup
  useEffect(() => {
    socketService.on('newOrder', handleNewOrder);
    socketService.on('orderUpdate', handleOrderUpdate);

    return () => {
      socketService.off('newOrder', handleNewOrder);
      socketService.off('orderUpdate', handleOrderUpdate);
    };
  }, [handleNewOrder, handleOrderUpdate]);

  return {
    handleNewOrder,
    handleOrderUpdate
  };
};
