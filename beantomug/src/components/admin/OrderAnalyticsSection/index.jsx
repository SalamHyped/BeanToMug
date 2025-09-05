import React from 'react';
import {
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaBullseye,
  FaStar
} from 'react-icons/fa';
import FinancialKPICard from '../FinancialKPICard';
import OrderTypeRatings from '../../charts/OrderTypeRatings';
import AnalyticsDateRangeSelector from '../../controls/AnalyticsDateRangeSelector';
import useOrderRatings from '../../../hooks/useOrderRatings.js';

const OrderAnalyticsSection = ({ orderData, loading, onDateRangeChange }) => {
  // Use the ratings hook directly in this component
  const { ratingsData, loading: ratingsLoading, currentRange, refreshWithDateRange } = useOrderRatings();
  
  // Helper function to get comparison text based on date range
  const getComparisonText = (range) => {
    switch (range) {
      case 'today':
        return 'vs yesterday';
      case '7_days':
        return 'vs previous 7 days';
      case '14_days':
        return 'vs previous 14 days';
      case '30_days':
        return 'vs previous 30 days';
      case '3_months':
        return 'vs previous 3 months';
      case '6_months':
        return 'vs previous 6 months';
      case '1_year':
        return 'vs previous year';
      default:
        return 'vs previous period';
    }
  };
  
  // Handle date range changes for both ratings and order analytics
  const handleDateRangeChange = (startDate, endDate, rangeKey = 'custom') => {
    // Update ratings with the correct range key
    refreshWithDateRange(startDate, endDate, rangeKey);
    // Update order analytics (including popular items)
    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
    }
  };
  // Transform the order analytics data to match our KPI cards
  const kpis = [
    {
      title: "Total Orders",
      value: orderData?.onlineOrders?.totalOrders || "0",
      target: "All Orders",
      percentage: 100,
      change: orderData?.onlineOrders?.change || "+0.0%",
      comparison: getComparisonText(currentRange),
      color: "primary",
      trend: orderData?.onlineOrders?.trend || "up",
      dataQuality: "high",
      additionalInfo: {
        totalOrders: orderData?.onlineOrders?.totalOrders || 0,
        onlineOrders: orderData?.onlineOrders?.onlineOrders || 0,
        cartOrders: orderData?.onlineOrders?.cartOrders || 0
      }
    },
    {
      title: "Average Customer Satisfaction",
      value: orderData?.customerSatisfaction?.score || "0.0",
      change: orderData?.customerSatisfaction?.change || "+0.0",
      comparison: getComparisonText(currentRange),
      color: "success",
      trend: orderData?.customerSatisfaction?.trend || "neutral",
      dataQuality: "high",
      additionalInfo: {
        totalRatings: orderData?.customerSatisfaction?.totalRatings || 0,
        averageScore: orderData?.customerSatisfaction?.score || 0,
        ratingDistribution: orderData?.customerSatisfaction?.distribution || {}
      }
    },
    {
      title: "Average Order Processing Time",
      value: orderData?.processingTime?.average || "0.0",
      change: orderData?.processingTime?.change || "+0.0 min",
      comparison: getComparisonText(currentRange),
      color: "warning",
      trend: orderData?.processingTime?.trend || "neutral",
      dataQuality: "medium",
      additionalInfo: {
        averageTime: orderData?.processingTime?.average || 0,
        fastestTime: orderData?.processingTime?.fastest || 0,
        slowestTime: orderData?.processingTime?.slowest || 0,
        totalOrders: orderData?.processingTime?.totalOrders || 0
      }
    }
  ];

  if (loading) {
    return (
      <div className="p-6 bg-dashboard-content
                      rounded-2xl border-2 border-coffee-crystal/20 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaChartLine className="text-3xl text-coffee-mocha" />
          <h2 className="text-2xl font-bold text-coffee-espresso">Order Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-h-[140px] rounded-2xl bg-coffee-mist
                                   animate-pulse">
              <div className="p-6 space-y-3">
                <div className="h-4 bg-coffee-medium/50 rounded w-3/4"></div>
                <div className="h-8 bg-coffee-medium/50 rounded w-1/2"></div>
                <div className="h-3 bg-coffee-medium/50 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-dashboard-content
                    rounded-2xl border-2 border-coffee-crystal/20 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaChartLine className="text-3xl text-coffee-mocha" />
          <h2 className="text-2xl font-bold text-coffee-espresso">Order Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-coffee-medium">Date Range:</span>
          <AnalyticsDateRangeSelector 
            currentRange={currentRange || "30_days"}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <FinancialKPICard key={index} kpi={kpi} />
        ))}
      </div>

      {/* Order Type Ratings Chart - Flexible Left Layout */}
      <div className="mt-8">
        <div className="flex flex-col lg:flex-row gap-6">
                     {/* Left Side - Order Type Ratings Chart */}
           <div className="lg:w-1/2">
             <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-4">
               <div className="flex items-center gap-2 mb-4">
                                  <h3 className="text-lg font-semibold text-coffee-espresso flex items-center gap-2">
                   <FaStar className="text-coffee-mocha" />
                   Order Type Ratings
                 </h3>
               </div>
               <div className="bg-coffee-mist/50 rounded-lg p-3">
                {ratingsLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-coffee-medium">Loading ratings...</div>
                  </div>
                ) : ratingsData ? (
                  <OrderTypeRatings 
                    byOrderType={ratingsData.byOrderType || { online: 0, pickup: 0 }} 
                    overall={ratingsData.overall || 0}
                    totalRatings={ratingsData.totalRatings || 0}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-coffee-medium">
                    No ratings data available
                  </div>
                )}
              </div>
            </div>
          </div>

                     {/* Right Side - Most Common Items */}
           <div className="lg:w-1/2">
             <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-4">
               <h3 className="text-lg font-semibold text-coffee-espresso mb-4 flex items-center gap-2">
                 <FaClipboardList className="text-coffee-mocha" />
                 Most Popular Items
               </h3>
               
               <div className="space-y-3">
                 {/* Popular Items List */}
                 <div className="space-y-2">
                    {orderData?.popularItems?.length > 0 ? (
                      orderData.popularItems.map((item, index) => (
                       <div key={index} className="flex items-center justify-between p-2.5 bg-coffee-mist/50 rounded-lg">
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-medium text-coffee-espresso w-6 text-center">
                           #{index + 1}
                         </span>
                         <span className="text-sm text-coffee-medium capitalize">
                           {item.name}
                         </span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-coffee-espresso">
                           {item.count}
                         </span>
                         <span className={`text-xs px-2 py-1 rounded-full ${
                           item.trend === 'up' ? 'bg-coffee-mist text-coffee-espresso' :
                           item.trend === 'down' ? 'bg-coffee-pearl text-coffee-espresso' :
                           'bg-coffee-cloud text-coffee-medium'
                         }`}>
                           {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                         </span>
                       </div>
                     </div>
                   ))
                   ) : (
                       <div className="text-center py-6 text-coffee-medium">
                         <p>No popular items data available</p>
                       </div>
                   )}
                 </div>
                 
                 {/* Quick Stats */}
                 <div className="bg-coffee-mist/50 rounded-lg p-3 mt-4">
                   <h4 className="text-sm font-medium text-coffee-espresso mb-2">Quick Stats</h4>
                   <div className="grid grid-cols-2 gap-3 text-xs">
                     <div className="text-center">
                       <div className="text-lg font-bold text-coffee-espresso">
                         {orderData?.popularItems?.length || 0}
                       </div>
                       <div className="text-coffee-medium">Top Items</div>
                     </div>
                     <div className="text-center">
                       <div className="text-lg font-bold text-coffee-espresso">
                         {orderData?.onlineOrders?.totalOrders || 0}
                       </div>
                       <div className="text-coffee-medium">Total Orders</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-coffee-crystal/20">
        <div className="flex items-center justify-between text-sm text-coffee-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <FaClock className="text-coffee-mocha" />
              Last updated: {orderData?.metadata?.lastUpdated ? 
                new Date(orderData.metadata.lastUpdated).toLocaleString() : 'N/A'}
            </span>
          </div>
                     <div className="flex items-center gap-4">
             <span className="flex items-center gap-2">
               <FaBullseye className="text-coffee-mocha" />
               Analytics updated in real-time
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAnalyticsSection;
