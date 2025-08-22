import { useState, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useProductOrderEditor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch single order for editing
  const fetchOrder = useCallback(async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${getApiConfig().baseURL}/product-orders/${orderId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setOrder(response.data);
        return { success: true, order: response.data };
      } else {
        const errorMsg = 'Failed to fetch order details';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch order details. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new order
  const createOrder = useCallback(async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${getApiConfig().baseURL}/product-orders`,
        orderData,
        { withCredentials: true }
      );

      if (response.data.success) {
        return { success: true, order: response.data };
      } else {
        const errorMsg = response.data.message || 'Failed to create order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error creating order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create order. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing order
  const updateOrder = useCallback(async (orderId, orderData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(
        `${getApiConfig().baseURL}/product-orders/${orderId}`,
        orderData,
        { withCredentials: true }
      );

      if (response.data.success) {
        return { success: true, order: response.data };
      } else {
        const errorMsg = response.data.message || 'Failed to update order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error updating order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update order. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(
        `${getApiConfig().baseURL}/product-orders/${orderId}/status`,
        { status },
        { withCredentials: true }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setOrder(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    order,
    loading,
    error,
    
    // Actions
    fetchOrder,
    createOrder,
    updateOrder,
    updateOrderStatus,
    clearError,
    resetState
  };
};

export default useProductOrderEditor;
