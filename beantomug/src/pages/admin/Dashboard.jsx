import React from 'react';
import { useOutletContext } from 'react-router-dom';
import styles from './Dashboard.module.css';
import FinancialKPISection from "../../components/admin/FinancialKPISection";
import OrderAnalyticsSection from "../../components/admin/OrderAnalyticsSection";
import CustomerSatisfactionSection from "../../components/admin/CustomerSatisfactionSection";
import RevenueAnalyticsSection from "../../components/admin/RevenueAnalyticsSection";
import useFinancialKPIs from "../../hooks/useFinancialKPIs.js";
import useOrderAnalytics from "../../hooks/useOrderAnalytics.js";

const AdminDashboard = () => {
  const { isSidebarCollapsed } = useOutletContext() || { isSidebarCollapsed: false };
  
  // Financial KPIs hook
  const financialData = useFinancialKPIs();
  // Order Analytics hook
  const orderAnalytics = useOrderAnalytics();

  const handleRefreshTargets = async () => {
    try {
      const response = await fetch('/admin/targets/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        console.log('Targets refreshed successfully');
        // Refresh the order analytics data to show updated targets
        orderAnalytics.refresh();
      }
    } catch (error) {
      console.error('Failed to refresh targets:', error);
    }
  };

  return (
    <div className={`${styles.dashboard} ${isSidebarCollapsed ? styles.dashboardCollapsed : ''}`}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
      </div>

      {/* Financial KPIs Section */}
      <FinancialKPISection 
        financialData={financialData}
        loading={financialData.loading}
      />

      {/* Order Analytics Section */}
      <OrderAnalyticsSection
        orderData={orderAnalytics.orderData}
        loading={orderAnalytics.loading}
        onDateRangeChange={orderAnalytics.refreshWithDateRange}
      />

      {/* Revenue Analytics Section */}
      <RevenueAnalyticsSection />

      {/* Customer Satisfaction Section */}
      <CustomerSatisfactionSection />

      {/* Refresh Targets Button */}
      <div className="flex justify-center mt-12 mb-8">
        <button 
          onClick={handleRefreshTargets}
          className="bg-gradient-to-br from-coffee-espresso to-coffee-mocha text-coffee-snow w-16 h-16 rounded-full cursor-pointer transition-all duration-300 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 hover:rotate-180 active:translate-y-0"
          title="Refresh targets from database"
        >
          <svg 
            className="w-6 h-6 transition-transform duration-300 ease-in-out"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;