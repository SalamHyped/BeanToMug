/**
 * Pure utility functions for formatting order data
 * These functions have no side effects and are easily testable
 */
import { parseDateAsUTC } from '../../../../../utils/dateUtils';

/**
 * Format time string for display
 * Backend sends dates as ISO strings with Z (UTC), we parse and convert to local time
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = parseDateAsUTC(dateString);
  if (!date) return '';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format last update time
 */
export const formatLastUpdate = (lastFetchTime) => {
  if (!lastFetchTime) return 'Never';
  return lastFetchTime.toLocaleTimeString();
};

/**
 * Get priority CSS class based on order status
 */
export const getPriorityClass = (status) => {
  switch(status) {
    case 'processing': return 'mediumPriority';
    default: return 'lowPriority';
  }
};

/**
 * Format order text for notifications
 */
export const formatOrderText = (order) => {
  const itemDetails = order.items.map(item => {
    let itemText = `${item.item_name} x${item.quantity}`;
    
    // Add ingredients/options if they exist
    if (item.ingredients && item.ingredients.length > 0) {
      const ingredientsList = item.ingredients.map(ing => ing.ingredient_name).join(', ');
      itemText += ` (${ingredientsList})`;
    }
    
    return itemText;
  }).join(', ');
  
  return `Order #${order.order_id} - ${itemDetails}`;
};

/**
 * Check if item has ingredients/details to display
 */
export const hasItemDetails = (item) => {
  return item.ingredients && item.ingredients.length > 0;
};

/**
 * Get customer display name
 */
export const getCustomerName = (order) => {
  if (!order.first_name && !order.last_name) return null;
  return [order.first_name, order.last_name].filter(Boolean).join(' ');
};

/**
 * Get drag progress message
 */
export const getDragProgressMessage = (dragProgress) => {
  if (dragProgress > 60) {
    return "✓ Release to complete";
  } else if (dragProgress > 30) {
    return "→ Keep swiping to complete";
  } else {
    return "→ Swipe right to complete";
  }
};
