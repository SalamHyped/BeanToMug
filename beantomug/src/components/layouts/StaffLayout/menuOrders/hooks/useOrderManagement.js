import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing order CRUD operations
 * Handles fetching, updating, and managing order state
 */
export const useOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch orders from backend with memoization
  const fetchOrders = useCallback(async (params) => {
    try {
      setLoading(true);
      
      const response = await axios.get('http://localhost:8801/orders/staff/all', {
        params,
        withCredentials: true
      });
      
      // Orders are already filtered by backend, no need for client-side filtering
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
      setError(null);
      setLastFetchTime(new Date());
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status with optimistic updates
  const updateOrderStatus = useCallback(async (order_id, status) => {
    try {
      // Update order status in database
      await axios.put(`http://localhost:8801/orders/staff/${order_id}/status`, 
        { status },
        { withCredentials: true }
      );
      
      // WebSocket will handle real-time updates for all clients - no need to refresh
      
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('Failed to update order status');
    }
  }, []);

  // fetchSingleOrder removed - WebSocket now provides complete order data directly
  // No need for additional API calls when order updates are received
  
  // Manual refresh function
  const refreshOrders = useCallback(() => {
    // This will be called from components with current params
  }, []);

  return {
    // State
    orders,
    setOrders,
    loading,
    setLoading,
    error,
    setError,
    lastFetchTime,
    pagination,
    setPagination,
    
    // Actions
    fetchOrders,
    updateOrderStatus,
    refreshOrders
  };
};
