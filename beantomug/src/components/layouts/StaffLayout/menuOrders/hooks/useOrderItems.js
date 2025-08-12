import { useState, useCallback, useEffect } from 'react';
import socketService from '../../../../../services/socketService';

/**
 * Custom hook for managing item preparation state and expansion
 * Handles item checkboxes, sorting, and expansion state with WebSocket cross-view sync
 */
export const useOrderItems = () => {
  const [preparedItems, setPreparedItems] = useState({}); // Track which items are prepared {order_id: {itemIndex: true/false}}
  const [expandedOrders, setExpandedOrders] = useState({}); // Track which orders have expanded items

          // Toggle item preparation status
        const toggleItemPrepared = useCallback((order_id, itemIndex) => {
          setPreparedItems(prev => {
            const currentStatus = prev[order_id]?.[itemIndex] || false;
            const newStatus = !currentStatus;

            return {
              ...prev,
              [order_id]: {
                ...prev[order_id],
                [itemIndex]: newStatus
              }
            };
          });

          // Check if socket is connected before sending
          if (!socketService.getConnectionStatus().isConnected) {
            return;
          }

          // Emit WebSocket update for real-time sync
          const preparationData = {
            order_id,
            itemIndex,
            isPrepared: !preparedItems[order_id]?.[itemIndex]
          };

          const success = socketService.sendToServer('itemPreparationToggle', preparationData);
        }, [preparedItems]);

  // Toggle expanded items for an order
  const toggleExpandedItems = useCallback((order_id) => {
    setExpandedOrders(prev => ({
      ...prev,
      [order_id]: !prev[order_id]
    }));
  }, []);

  // WebSocket listener for item preparation updates
  useEffect(() => {
    // Get the actual Socket.IO client from the service
    const socket = socketService.socketClient;
    
    if (!socket) {
      return;
    }

    const handleItemPreparationUpdate = (data) => {
      const { order_id, itemIndex, isPrepared } = data;
      
      setPreparedItems(prev => {
        return {
          ...prev,
          [order_id]: {
            ...prev[order_id],
            [itemIndex]: isPrepared
          }
        };
      });
    };

    // Listen for item preparation updates from other staff members
    socket.on('itemPreparationUpdate', handleItemPreparationUpdate);

    return () => {
      socket.off('itemPreparationUpdate', handleItemPreparationUpdate);
    };
  }, []);

  // Get sorted items with preparation status
  const getSortedItems = useCallback((orderItems, order_id) => {
    if (!orderItems || !Array.isArray(orderItems)) return [];
    
    const orderPreparedItems = preparedItems[order_id] || {};
    
    // Create array with original index for efficient sorting
    const itemsWithIndex = orderItems.map((item, index) => ({
      item,
      originalIndex: index,
      isPrepared: orderPreparedItems[index] || false
    }));
    
    // Sort: unprepared first, prepared last
    itemsWithIndex.sort((a, b) => {
      if (a.isPrepared === b.isPrepared) return 0;
      return a.isPrepared ? 1 : -1;
    });
    
    return itemsWithIndex;
  }, [preparedItems]);

  return {
    // State
    preparedItems,
    expandedOrders,
    
    // Actions
    toggleItemPrepared,
    toggleExpandedItems,
    getSortedItems
  };
};
