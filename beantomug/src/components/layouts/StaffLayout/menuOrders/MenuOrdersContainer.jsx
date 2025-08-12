import React from 'react';
import { OrderProvider } from './contexts/OrderContext';
import MenuOrdersView from './MenuOrdersView';

/**
 * Main container component for MenuOrders
 * Provides the order context and error boundary
 */
const MenuOrdersContainer = () => {
  return (
    <OrderProvider>
      <MenuOrdersView />
    </OrderProvider>
  );
};

export default MenuOrdersContainer;
