/**
 * MenuOrders Module Entry Point
 * Exports the main container component for the modular order management system
 */

export { default } from './MenuOrdersContainer';

// Re-export components for external use if needed
export { default as MenuOrdersContainer } from './MenuOrdersContainer';
export { default as OrderCard } from './components/OrderCard';
export { default as OrderItem } from './components/OrderItem';
export { default as ItemDetails } from './components/ItemDetails';

// Re-export lazy-loaded motion components
export { 
  LazyMotionDiv, 
  LazyAnimatePresence,
  FallbackDiv,
  FallbackAnimatePresence 
} from './components/MotionComponents';

// Re-export hooks for external use
export { useOrderManagement } from './hooks/useOrderManagement';
export { useOrderDrag } from './hooks/useOrderDrag';
export { useOrderItems } from './hooks/useOrderItems';
export { useOrderWebSocket } from './hooks/useOrderWebSocket';

// Re-export context
export { OrderProvider, useOrderContext } from './contexts/OrderContext';

// Re-export utilities
export * from './utils/orderFormatters';
export * from './utils/orderAnimations';
export * from './constants/orderConstants';
