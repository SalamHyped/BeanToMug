/**
 * Constants and configuration for order management
 * Centralizes all magic numbers and configuration values
 */

// Order status constants
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Valid status transitions
export const VALID_STATUS_TRANSITIONS = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED
];

// Drag thresholds
export const DRAG_THRESHOLDS = {
  COMPLETION: 160, // 80% of 200px - requires more intentional swipe
  PROGRESS_HIGH: 60, // 60% progress
  PROGRESS_MEDIUM: 30, // 30% progress
  MAX_DISTANCE: 200 // Maximum drag distance
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  ORDER_REMOVAL: 300,
  DRAG_COMPLETION: 500,
  ITEM_EXPANSION: 200,
  ITEM_COLLAPSE: 150
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 50,
  INITIAL_PAGE: 1
};

// Item display limits
export const ITEM_DISPLAY = {
  INITIAL_ITEMS: 3, // Show first 3 items by default
  EXPAND_ALL: -1 // Show all items when expanded
};

// WebSocket event types
export const WEBSOCKET_EVENTS = {
  NEW_ORDER: 'newOrder',
  ORDER_UPDATE: 'orderUpdate',

};

// Filter options
export const FILTER_OPTIONS = {
  TIME_FILTERS: ['all', 'today', 'yesterday', 'week', 'month'],
  DEFAULT_TIME_FILTER: 'all',
  DEBOUNCE_DELAY: 300
};

// CSS class mappings
export const CSS_CLASSES = {
  PRIORITY: {
    [ORDER_STATUSES.PROCESSING]: 'mediumPriority',
    DEFAULT: 'lowPriority'
  },
  DRAG_PROGRESS: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  ORDERS_ALL: '/orders/staff/all',
  ORDER_STATUS: (order_id) => `/orders/staff/${order_id}/status`
};

// Error messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to load orders',
  UPDATE_FAILED: 'Failed to update order status',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_STATUS: 'Invalid status. Must be one of: pending, processing, completed, cancelled'
};
