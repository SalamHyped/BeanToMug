import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../utils/config';

const useOrderAnalytics = () => {
  const [orderData, setOrderData] = useState({
    onlineOrders: {
      percentage: 0,
      formatted: "0.0%",
      target: 70,
      targetFormatted: "70%",
      percentageAchievement: 0,
      totalOrders: 0,
      onlineOrders: 0,
      cartOrders: 0
    },
    orderTypes: [],
    metadata: {
      startDate: null,
      endDate: null,
      lastUpdated: null
    },
    loading: true,
    error: null
  });

  const fetchOrderAnalytics = useCallback(async (startDate = null, endDate = null) => {
    try {
      setOrderData(prev => ({ ...prev, loading: true, error: null }));

      // Build query parameters
      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await axios.get(`${getApiConfig().baseURL}/admin/order-analytics`, {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        
        setOrderData(prev => ({
          ...prev,
          onlineOrders: {
            percentage: apiData.onlineOrders.percentage || 0,
            formatted: apiData.onlineOrders.formatted || "0.0%",
            target: apiData.onlineOrders.target || 70,
            targetFormatted: `${apiData.onlineOrders.target || 70}%`,
            percentageAchievement: Math.round((apiData.onlineOrders.percentage || 0) / (apiData.onlineOrders.target || 70) * 100),
            totalOrders: apiData.onlineOrders.totalOrders || 0,
            onlineOrders: apiData.onlineOrders.onlineOrders || 0,
            cartOrders: apiData.onlineOrders.cartOrders || 0
          },
          orderTypes: apiData.orderTypes || [],
          metadata: {
            startDate: apiData.metadata?.startDate || null,
            endDate: apiData.metadata?.endDate || null,
            lastUpdated: apiData.metadata?.lastUpdated || new Date().toISOString()
          },
          loading: false,
          error: null
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch order analytics');
      }
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      
      setOrderData(prev => ({
        ...prev,
        loading: false,
        error: `API Error: ${error.message}. Please try again later.`
      }));
    }
  }, []);

  // Fetch data on mount with default date range (last 7 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    fetchOrderAnalytics(startDate, endDate);
  }, [fetchOrderAnalytics]);

  // Function to refresh data with custom date range
  const refreshWithDateRange = useCallback((startDate, endDate) => {
    fetchOrderAnalytics(startDate, endDate);
  }, [fetchOrderAnalytics]);

  // Function to refresh current data
  const refresh = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    fetchOrderAnalytics(startDate, endDate);
  }, [fetchOrderAnalytics]);

  return {
    orderData,
    loading: orderData.loading,
    error: orderData.error,
    refresh,
    refreshWithDateRange
  };
};

export default useOrderAnalytics;
