import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../utils/config';

const useOrderAnalytics = () => {
  const [orderData, setOrderData] = useState({
    onlineOrders: {
      percentage: 0,
      formatted: "0.0%",
      target: 0,
      targetFormatted: "0%",
      percentageAchievement: 0,
      totalOrders: 0,
      onlineOrders: 0,
      cartOrders: 0,
      change: "0.0%",
      trend: "neutral"
    },
    orderTypes: [],
    popularItems: [],
    orderCompletion: {},
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

      // Fetch both order analytics and popular items
      const [analyticsResponse, popularItemsResponse] = await Promise.all([
        axios.get(`${getApiConfig().baseURL}/admin/order-analytics`, {
          params,
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }),
        axios.get(`${getApiConfig().baseURL}/admin/popular-items`, {
          params,
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      if (analyticsResponse.data.success && popularItemsResponse.data.success) {
        const apiData = analyticsResponse.data.data;
        const popularItems = popularItemsResponse.data.data;
        
        setOrderData(prev => ({
          ...prev,
          onlineOrders: {
            percentage: apiData.onlineOrders.percentage || 0,
            formatted: apiData.onlineOrders.formatted || "0.0%",
            target: apiData.onlineOrders.target || 0,
            targetFormatted: apiData.onlineOrders.targetFormatted || "0%",
            percentageAchievement: apiData.onlineOrders.percentageAchievement || 0,
            totalOrders: apiData.onlineOrders.totalOrders || 0,
            onlineOrders: apiData.onlineOrders.onlineOrders || 0,
            cartOrders: apiData.onlineOrders.cartOrders || 0,
            change: apiData.onlineOrders.change || "0.0%",
            trend: apiData.onlineOrders.trend || "neutral"
          },
          orderTypes: apiData.orderTypes || [],
          popularItems: popularItems || [],
          orderCompletion: apiData.orderCompletion || {},
          targets: apiData.targets || {},
          metadata: {
            startDate: apiData.metadata?.startDate || null,
            endDate: apiData.metadata?.endDate || null,
            lastUpdated: apiData.metadata?.lastUpdated || new Date().toISOString()
          },
          loading: false,
          error: null
        }));
      } else {
        throw new Error('Failed to fetch data from one or more endpoints');
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

  // Fetch data on mount with default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    fetchOrderAnalytics(startDate, endDate);
  }, [fetchOrderAnalytics]);

  // Function to refresh data with custom date range
  const refreshWithDateRange = useCallback((startDate, endDate) => {
    fetchOrderAnalytics(startDate, endDate);
  }, [fetchOrderAnalytics]);

  // Function to refresh current data
  const refresh = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
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
