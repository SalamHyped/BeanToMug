import React, { createContext, useContext } from 'react';
import { useOrderManagement } from '../hooks/useOrderManagement';
import { useOrderDrag } from '../hooks/useOrderDrag';
import { useOrderItems } from '../hooks/useOrderItems';


/**
 * Order Context for managing global order state
 * Combines all order-related hooks and provides unified state management
 */
const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  // Initialize all custom hooks
  const orderManagement = useOrderManagement();
  const orderItems = useOrderItems();
  
  // Handle order completion from drag
  const handleOrderComplete = async (order_id) => {
    try {
      await orderManagement.updateOrderStatus(order_id, 'completed');
      
      // Remove from UI after animation
      setTimeout(() => {
        orderManagement.setOrders((prev) => prev.filter(order => order.order_id !== order_id));
      }, 300); // match the animation duration
      
    } catch (err) {
      orderManagement.setError('Failed to update order status');
      
      // Rollback optimistic update on error
      if (orderDrag.resetDoneOrder) {
        orderDrag.resetDoneOrder(order_id);
      }
    }
  };
  
  // Initialize orderDrag with the completion handler
  const orderDrag = useOrderDrag(handleOrderComplete);

  // WebSocket is now handled in MenuOrdersView for better control

  // Combine all state and actions
  const contextValue = {
    // Order Management
    ...orderManagement,
    
    // Drag & Drop
    ...orderDrag,
    
    // Item Management
    ...orderItems,
    
    // Additional actions
    handleOrderComplete
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the order context
export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;
