import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../utils/config';

const useSalesAnalytics = () => {
  const [salesData, setSalesData] = useState({
    revenueTrend: [],
    financialSummary: {
      currentPeriod: {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        revenuePerDay: 0
      },
      previousPeriod: {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        revenuePerDay: 0
      },
      growth: {
        revenue: '0%',
        orders: '0%',
        avgOrderValue: '0%'
      }
    },
    itemRevenue: [],
    granularity: 'daily',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRange, setCurrentRange] = useState('30_days');
  const [granularity, setGranularity] = useState('daily');

  const fetchSalesAnalytics = useCallback(async (range, customStartDate, customEndDate, gran = 'daily') => {
    setLoading(true);
    setError(null);

    try {
      let url = '/admin/sales-analytics?';
      
      if (range && range !== 'custom') {
        url += `range=${range}&granularity=${gran}`;
      } else if (customStartDate && customEndDate) {
        url += `startDate=${customStartDate.toISOString()}&endDate=${customEndDate.toISOString()}&granularity=${gran}`;
      } else {
        url += `range=30_days&granularity=${gran}`;
      }

      const response = await axios.get(url, getApiConfig());
      
      if (response.data.success) {
        setSalesData(response.data.data);
        setCurrentRange(range || '30_days');
        setGranularity(gran);
      } else {
        throw new Error(response.data.message || 'Failed to fetch sales analytics');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch sales analytics');
      console.error('Error fetching sales analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWithDateRange = useCallback((range, customStartDate, customEndDate, gran = 'daily') => {
    fetchSalesAnalytics(range, customStartDate, customEndDate, gran);
  }, [fetchSalesAnalytics]);

  const refresh = useCallback(() => {
    fetchSalesAnalytics(currentRange, null, null, granularity);
  }, [fetchSalesAnalytics, currentRange, granularity]);

  const toggleGranularity = useCallback(() => {
    const newGranularity = granularity === 'daily' ? 'weekly' : 'daily';
    setGranularity(newGranularity);
    fetchSalesAnalytics(currentRange, null, null, newGranularity);
  }, [granularity, currentRange, fetchSalesAnalytics]);

  useEffect(() => {
    fetchSalesAnalytics('30_days', null, null, 'daily');
  }, [fetchSalesAnalytics]);

  return {
    salesData,
    loading,
    error,
    currentRange,
    granularity,
    refreshWithDateRange,
    refresh,
    toggleGranularity
  };
};

export default useSalesAnalytics;
