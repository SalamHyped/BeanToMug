import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiConfig } from '../utils/config';

const useFinancialKPIs = () => {
  const [financialData, setFinancialData] = useState({
    todaysRevenue: null,
    weeklyRevenue: null,
    averageOrderValue: null,
    dailyProfit: null,
    todaysPercentage: null,
    weeklyPercentage: null,
    aovPercentage: null,
    profitMargin: null,
    todaysChange: null,
    weeklyChange: null,
    aovChange: null,
    profitChange: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchFinancialData = async () => {
    try {
      setFinancialData(prev => ({ ...prev, loading: true, error: null }));
      
      // Call the real API endpoint
      const response = await axios.get(`${getApiConfig().baseURL}/admin/financial-kpis`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setFinancialData(prev => ({
          ...prev,
          ...response.data.data,
          loading: false,
          lastUpdated: new Date().toISOString()
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch financial data');
      }
    } catch (error) {
      console.error('Error fetching financial KPIs:', error);
      
      // Set mock data for development/demo purposes when API fails
      console.warn('Using mock financial data due to API error:', error.message);
      setFinancialData(prev => ({
        ...prev,
        todaysRevenue: "$2,450.75",
        weeklyRevenue: "$14,250.30", 
        averageOrderValue: "$12.85",
        dailyProfit: "$980.30",
        todaysPercentage: 81.7,
        weeklyPercentage: 79.2,
        aovPercentage: 85.7,
        profitMargin: "40.0%",
        todaysChange: "+15.2%",
        weeklyChange: "+8.5%",
        aovChange: "-$0.45",
        profitChange: "+12.3%",
        loading: false,
        error: `API Error: ${error.message} (Using mock data)`,
        lastUpdated: new Date().toISOString()
      }));
    }
  };

  const refreshFinancialData = () => {
    fetchFinancialData();
  };

  useEffect(() => {
    // Initial fetch
    fetchFinancialData();
    
    // Set up real-time updates every 30 seconds for financial data
    const interval = setInterval(fetchFinancialData, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    refreshFinancialData();
  };

  return {
    ...financialData,
    refreshFinancialData: handleRefresh,
    isStale: financialData.lastUpdated && 
             (Date.now() - new Date(financialData.lastUpdated).getTime()) > 60000 // 1 minute
  };
};

export default useFinancialKPIs;
