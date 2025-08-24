import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../utils/config';
import socketService from '../services/socketService';

const useFinancialKPIs = () => {
  const [financialData, setFinancialData] = useState({
    // Revenue data
    todaysRevenue: "$0.00",
    todaysPercentage: 0,
    todaysChange: "+0.0%",
    todaysTarget: "$3,000.00",
    
    weeklyRevenue: "$0.00",
    weeklyPercentage: 0,
    weeklyChange: "+0.0%",
    weeklyTarget: "$18,000.00",
    
    // AOV data
    averageOrderValue: "$0.00",
    aovPercentage: 0,
    aovChange: "+$0.00",
    aovChangeDirection: "neutral",
    aovTarget: "$15.00",
    orderCount: 0,
    
    // Profit data
    dailyProfit: "$0.00",
    profitMargin: "0.0%",
    profitChange: "+0.0%",
    profitSource: "loading",
    
    // Metadata
    dataQuality: "loading",
    lastUpdated: null,
    loading: true,
    error: null
  });

  const fetchFinancialData = useCallback(async () => {
    try {
      setFinancialData(prev => ({ ...prev, loading: true, error: null }));

      // Call the new FinancialService API endpoint
      const response = await axios.get(`${getApiConfig().baseURL}/admin/financial-kpis`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        
        // Transform the new API response to match our frontend expectations
        setFinancialData(prev => ({
          ...prev,
          // Revenue
          todaysRevenue: apiData.todaysRevenue,
          todaysPercentage: apiData.todaysPercentage,
          todaysChange: apiData.todaysChange,
          todaysTarget: apiData.todaysTarget || "$3,000.00",
          
          weeklyRevenue: apiData.weeklyRevenue,
          weeklyPercentage: apiData.weeklyPercentage,
          weeklyChange: apiData.weeklyChange,
          weeklyTarget: apiData.weeklyTarget || "$18,000.00",
          
          // AOV
          averageOrderValue: apiData.averageOrderValue,
          aovPercentage: apiData.aovPercentage,
          aovChange: apiData.aovChange,
          aovChangeDirection: apiData.aovChangeDirection || "neutral",
          aovTarget: apiData.aovTarget || "$15.00",
          orderCount: apiData.orderCount || 0,
          
          // Profit
          dailyProfit: apiData.dailyProfit,
          profitMargin: apiData.profitMargin,
          profitChange: apiData.profitChange,
          profitSource: apiData.profitSource || "configured",
          
          // Metadata
          dataQuality: apiData.dataQuality || "medium",
          lastUpdated: apiData.lastUpdated || new Date().toISOString(),
          loading: false,
          error: null
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch financial data');
      }
    } catch (error) {
      console.error('Error fetching financial KPIs:', error);

      // Only handle network/API errors, not business logic fallbacks
      // The backend already provides fallback data for business scenarios
      setFinancialData(prev => ({
        ...prev,
        loading: false,
        error: `API Error: ${error.message}. The backend will provide fallback data on next request.`
      }));
    }
  }, []);

  useEffect(() => {
    fetchFinancialData();

    // Use existing socketService for real-time updates
    let cleanup = () => {};
    
    // Define fallback polling functions first (before they're used)
    let fallbackInterval = null;
    
    const startFallbackPolling = () => {
      if (!fallbackInterval) {
        fallbackInterval = setInterval(fetchFinancialData, 60000); // 1 minute instead of 30 seconds
      }
    };
    
    const stopFallbackPolling = () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    };
    
    try {
      // Check if socketService is available and connected
      if (socketService && socketService.isConnected) {
        stopFallbackPolling(); // Stop fallback polling since WebSocket is working

        // Listen for order completion events only
        const handleOrderCompleted = (data) => {
          if (data.kpiChanges) {
            setFinancialData(prev => {
              const changes = data.kpiChanges;
              
              // Robust currency parsing function
              const parseCurrency = (currencyString) => {
                if (typeof currencyString !== 'string') return 0;
                const cleanString = currencyString.replace(/[^0-9.]/g, '');
                const parsed = parseFloat(cleanString);
                return isNaN(parsed) ? 0 : parsed;
              };
              
              const currentRevenue = parseCurrency(prev.todaysRevenue);
              const currentProfit = parseCurrency(prev.dailyProfit);
              const currentOrderCount = prev.orderCount || 0;
              const newRevenue = currentRevenue + (changes.revenueIncrease || 0);
              const newProfit = currentProfit + (changes.profitIncrease || 0);
              const newOrderCount = currentOrderCount + (changes.orderCountIncrease || 0);
              let newTodayPercentage = prev.todaysPercentage || 0;
              if (changes.currentTotals && prev.todaysTarget) {
                const target = parseCurrency(prev.todaysTarget);
                if (target > 0) {
                  newTodayPercentage = Math.round((newRevenue / target) * 100);
                }
              }
              
              return {
                ...prev,
                todaysRevenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newRevenue),
                todaysPercentage: newTodayPercentage,
                dailyProfit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newProfit),
                orderCount: newOrderCount,
                lastUpdated: new Date().toISOString(),
                loading: false,
                error: null
              };
            });
          } else {
            fetchFinancialData();
          }
        };

        const handleOrderStatusChanged = (data) => {
          if (data.kpiChanges && data.kpiChanges.isDecrease) {
            setFinancialData(prev => {
              const changes = data.kpiChanges;
              
              // Robust currency parsing function
              const parseCurrency = (currencyString) => {
                if (typeof currencyString !== 'string') return 0;
                const cleanString = currencyString.replace(/[^0-9.]/g, '');
                const parsed = parseFloat(cleanString);
                return isNaN(parsed) ? 0 : parsed;
              };
              
              // Parse current values safely
              const currentRevenue = parseCurrency(prev.todaysRevenue);
              const currentProfit = parseCurrency(prev.dailyProfit);
              const currentOrderCount = prev.orderCount || 0;
              
              // Calculate new values (decrease)
              const newRevenue = Math.max(0, currentRevenue - (changes.revenueDecrease || 0));
              const newProfit = Math.max(0, currentProfit - (changes.profitDecrease || 0));
              const newOrderCount = Math.max(0, currentOrderCount - (changes.orderCountDecrease || 0));
              
              // Calculate new percentage if we have target
              let newTodayPercentage = prev.todaysPercentage || 0;
              if (prev.todaysTarget) {
                const target = parseCurrency(prev.todaysTarget);
                if (target > 0) {
                  newTodayPercentage = Math.round((newRevenue / target) * 100);
                }
              }
              
              return {
                ...prev,
                // Update revenue with decrease
                todaysRevenue: new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(newRevenue),
                todaysPercentage: newTodayPercentage,
                
                // Update profit with decrease
                dailyProfit: new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(newProfit),
                
                // Update order count
                orderCount: newOrderCount,
                
                // Update last updated timestamp
                lastUpdated: new Date().toISOString(),
                loading: false,
                error: null
              };
            });
          } else {
            fetchFinancialData();
          }
        };

        const handleFinancialKPIsUpdated = (data) => {
          if (data.kpiChanges) {
            setFinancialData(prev => {
              const changes = data.kpiChanges;
              
              // Robust currency parsing function
              const parseCurrency = (currencyString) => {
                if (typeof currencyString !== 'string') return 0;
                const cleanString = currencyString.replace(/[^0-9.]/g, '');
                const parsed = parseFloat(cleanString);
                return isNaN(parsed) ? 0 : parsed;
              };
              
              const currentRevenue = parseCurrency(prev.todaysRevenue);
              const currentProfit = parseCurrency(prev.dailyProfit);
              const currentOrderCount = prev.orderCount || 0;
              const newRevenue = currentRevenue + (changes.revenueIncrease || 0);
              const newProfit = currentProfit + (changes.profitIncrease || 0);
              const newOrderCount = currentOrderCount + (changes.orderCountIncrease || 0);
              let newTodayPercentage = prev.todaysPercentage || 0;
              if (changes.currentTotals && prev.todaysTarget) {
                const target = parseCurrency(prev.todaysTarget);
                if (target > 0) {
                  newTodayPercentage = Math.round((newRevenue / target) * 100);
                }
              }
              
              return {
                ...prev,
                todaysRevenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newRevenue),
                todaysPercentage: newTodayPercentage,
                dailyProfit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newProfit),
                orderCount: newOrderCount,
                lastUpdated: new Date().toISOString(),
                loading: false,
                error: null
              };
            });
          } else {
            fetchFinancialData();
          }
        };
        
        // Add listeners to socketService
        socketService.on('order-completed', handleOrderCompleted);
        socketService.on('order-status-changed', handleOrderStatusChanged);
        socketService.on('financial-kpis-updated', handleFinancialKPIsUpdated);
        
        // Monitor connection status
        socketService.on('connected', () => {
          stopFallbackPolling();
        });
        
        socketService.on('disconnected', () => {
          startFallbackPolling();
        });
        
        // Cleanup function
        cleanup = () => {
          socketService.off('order-completed', handleOrderCompleted);
          socketService.off('order-status-changed', handleOrderStatusChanged);
          socketService.off('financial-kpis-updated', handleFinancialKPIsUpdated);
          socketService.off('connected', () => stopFallbackPolling());
          socketService.off('disconnected', () => startFallbackPolling());
        };
        
      } else {
        const connectAndListen = async () => {
          try {
            await socketService.connect();
            
            // Add listeners after connection
            const handleOrderCompleted = (data) => {
              fetchFinancialData();
            };
            
            const handleOrderStatusChanged = (data) => {
              fetchFinancialData();
            };
            
            const handleFinancialKPIsUpdated = (data) => {
              fetchFinancialData();
            };
            
            socketService.on('order-completed', handleOrderCompleted);
            socketService.on('order-status-changed', handleOrderStatusChanged); // Use the main function
            socketService.on('financial-kpis-updated', handleFinancialKPIsUpdated);
            
            cleanup = () => {
              socketService.off('order-completed', handleOrderCompleted);
              socketService.off('order-status-changed', handleOrderStatusChanged); // Use the main function
              socketService.off('financial-kpis-updated', handleFinancialKPIsUpdated);
            };
            
          } catch (error) {
            // Silent fallback to polling
          }
        };
        
        connectAndListen();
      }
      
    } catch (error) {
      // Silent fallback to polling
    }

    // Smart fallback: Only poll if WebSocket is not available
    if (!socketService || !socketService.isConnected) {
      startFallbackPolling();
    }

    return () => {
      stopFallbackPolling();
      cleanup(); // Clean up socket listeners
    };
  }, [fetchFinancialData]);

  // Helper function to get trend icon based on change direction
  const getTrendIcon = (changeDirection) => {
    switch (changeDirection) {
      case 'up': return 'up';
      case 'down': return 'down';
      default: return 'neutral';
    }
  };

  // Helper function to get change color class
  const getChangeColorClass = (changeDirection, isPercentage = false) => {
    if (isPercentage) {
      // For percentage changes, check if it's positive
      const isPositive = changeDirection === 'up' || 
                        (typeof changeDirection === 'string' && changeDirection.includes('+'));
      return isPositive ? 'success' : 'danger';
    }
    
    switch (changeDirection) {
      case 'up': return 'success';
      case 'down': return 'danger';
      default: return 'warning';
    }
  };

  return {
    ...financialData,
    getTrendIcon,
    getChangeColorClass,
    refresh: fetchFinancialData
  };
};

export default useFinancialKPIs;
