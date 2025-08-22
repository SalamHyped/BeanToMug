import { useEffect, useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useProductOrders = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatistics, setOrderStatistics] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch product orders from the backend
  const fetchProductOrders = useCallback(async (customFilters = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use provided filters or current filters
      const currentFilters = customFilters || filters;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(
        `${getApiConfig().baseURL}/product-orders?${queryParams.toString()}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        setError('Failed to fetch product orders');
      }
    } catch (err) {
      console.error('Error fetching product orders:', err);
      setError('Failed to fetch product orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); // Remove filters dependency to prevent infinite loops

  // Fetch order statistics
  const fetchOrderStatistics = useCallback(async () => {
    try {
      const response = await axios.get(
        `${getApiConfig().baseURL}/product-orders/statistics`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setOrderStatistics(response.data.overview);
      }
    } catch (err) {
      console.error('Error fetching order statistics:', err);
      // Don't set error for statistics - it's not critical
    }
  }, []);

  // Create new product order
  const createProductOrder = useCallback(async (orderData) => {
    try {
      setError(null);
      
      const response = await axios.post(
        `${getApiConfig().baseURL}/product-orders`,
        orderData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchProductOrders(filters); // Refresh list with current filters
        await fetchOrderStatistics(); // Refresh stats
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.data.message || 'Failed to create product order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error creating product order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create product order. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [fetchProductOrders, fetchOrderStatistics]);

  // Update product order
  const updateProductOrder = useCallback(async (orderId, orderData) => {
    try {
      setError(null);
      
      const response = await axios.put(
        `${getApiConfig().baseURL}/product-orders/${orderId}`,
        orderData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchProductOrders(filters); // Refresh list with current filters
        await fetchOrderStatistics(); // Refresh stats
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.data.message || 'Failed to update product order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error updating product order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update product order. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [fetchProductOrders, fetchOrderStatistics]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      setError(null);
      
      const response = await axios.put(
        `${getApiConfig().baseURL}/product-orders/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchProductOrders(filters); // Refresh list with current filters
        await fetchOrderStatistics(); // Refresh stats
        return { success: true };
      } else {
        const errorMsg = response.data.message || 'Failed to update order status';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update order status. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [fetchProductOrders, fetchOrderStatistics]);

  // Delete product order
  const deleteProductOrder = useCallback(async (orderId) => {
    try {
      setError(null);
      
      const response = await axios.delete(
        `${getApiConfig().baseURL}/product-orders/${orderId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchProductOrders(filters); // Refresh list with current filters
        await fetchOrderStatistics(); // Refresh stats
        return { success: true };
      } else {
        const errorMsg = response.data.message || 'Failed to delete product order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error deleting product order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete product order. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [fetchProductOrders, fetchOrderStatistics]);

  // Client-side filtering is minimal since backend handles most filtering
  const filteredOrders = useMemo(() => {
    return orders; // Backend already filters, just return the orders
  }, [orders]);

  // Get order by ID utility
  const getOrderById = useCallback((orderId) => {
    return orders.find(order => order.order_id === orderId);
  }, [orders]);

  // Fetch orders when filters change
  useEffect(() => {
    fetchProductOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.supplier_id, 
    filters.status, 
    filters.date_from, 
    filters.date_to, 
    filters.sortBy, 
    filters.sortOrder
  ]); // Depend on individual filter properties to avoid object reference issues

  // Fetch statistics only once on mount
  useEffect(() => {
    fetchOrderStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - statistics don't depend on filters

  return {
    // State
    orders,
    filteredOrders,
    loading,
    error,
    orderStatistics,
    
    // Actions
    fetchProductOrders,
    fetchOrderStatistics,
    createProductOrder,
    updateProductOrder,
    updateOrderStatus,
    deleteProductOrder,
    getOrderById,
    clearError,
    
    // Computed
    filteredCount: filteredOrders.length,
    totalOrders: orders.length
  };
};

export default useProductOrders;
