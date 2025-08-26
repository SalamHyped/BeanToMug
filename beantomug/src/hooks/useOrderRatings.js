import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../utils/config';

const useOrderRatings = () => {
  const [ratingsData, setRatingsData] = useState({
    overall: 0,
    totalRatings: 0,
    distribution: {
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0
    },
    byOrderType: {
      online: 0,
      cart: 0,
      delivery: 0,
      pickup: 0
    },
    trends: [],
    loading: true,
    error: null
  });
  
  const [currentRange, setCurrentRange] = useState('7_days');
  const [currentDates, setCurrentDates] = useState({
    start: null,
    end: null
  });

  const fetchOrderRatings = useCallback(async (startDate = null, endDate = null) => {
    try {
      setRatingsData(prev => ({ ...prev, loading: true, error: null }));

      // Build query parameters
      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await axios.get(`${getApiConfig().baseURL}/admin/order-ratings`, {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        
        setRatingsData(prev => ({
          ...prev,
          overall: apiData.overall || 0,
          totalRatings: apiData.totalRatings || 0,
          distribution: apiData.distribution || prev.distribution,
          byOrderType: apiData.byOrderType || prev.byOrderType,
          trends: apiData.trends || [],
          loading: false,
          error: null
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch order ratings');
      }
    } catch (error) {
      console.error('Error fetching order ratings:', error);
      
      setRatingsData(prev => ({
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
    fetchOrderRatings(startDate, endDate);
  }, [fetchOrderRatings]);

  // Function to refresh data with custom date range
  const refreshWithDateRange = useCallback((startDate, endDate, rangeKey = 'custom') => {
    setCurrentRange(rangeKey);
    setCurrentDates({ start: startDate, end: endDate });
    fetchOrderRatings(startDate, endDate);
  }, [fetchOrderRatings]);

  // Function to refresh current data
  const refresh = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    fetchOrderRatings(startDate, endDate);
  }, [fetchOrderRatings]);

  return {
    ratingsData,
    loading: ratingsData.loading,
    error: ratingsData.error,
    currentRange,
    currentDates,
    refresh,
    refreshWithDateRange
  };
};

export default useOrderRatings;
