import React from 'react';
import {
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaBullseye
} from 'react-icons/fa';
import FinancialKPICard from '../FinancialKPICard';

const OrderAnalyticsSection = ({ orderData, loading }) => {
  // Transform the order analytics data to match our KPI cards
  const kpis = [
    {
      title: "Online Orders",
      value: orderData?.onlineOrders?.formatted || "0.0%",
      target: orderData?.onlineOrders?.targetFormatted || "70%",
      percentage: orderData?.onlineOrders?.percentageAchievement || 0,
      change: "+0.0%",
      comparison: "vs last week",
      color: "success",
      trend: "up",
      dataQuality: orderData?.dataQuality || "low",
      additionalInfo: {
        totalOrders: orderData?.onlineOrders?.totalOrders || 0,
        onlineOrders: orderData?.onlineOrders?.onlineOrders || 0,
        cartOrders: orderData?.onlineOrders?.cartOrders || 0
      }
    },
    {
      title: "Order Types",
      value: orderData?.orderTypes?.[0]?.type || "N/A",
      target: `${orderData?.orderTypes?.[0]?.percentage || 0}%`,
      percentage: orderData?.orderTypes?.[0]?.percentage || 0,
      change: `${orderData?.orderTypes?.[0]?.count || 0} orders`,
      comparison: "most popular type",
      color: "info",
      trend: "neutral",
      dataQuality: "medium",
      additionalInfo: {
        totalTypes: orderData?.orderTypes?.length || 0,
        topType: orderData?.orderTypes?.[0]?.type || "N/A",
        topTypeCount: orderData?.orderTypes?.[0]?.count || 0
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
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
      <div className="flex items-center gap-3 mb-6">
        <FaChartLine className="text-3xl text-coffee-mocha" />
        <h2 className="text-2xl font-bold text-coffee-espresso">Order Analytics</h2>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi, index) => (
          <FinancialKPICard key={index} kpi={kpi} />
        ))}
      </div>

      {/* Additional Order Insights */}
      {orderData && (
        <div className="mt-8">
          {/* Order Type Distribution */}
          <div className="bg-coffee-mist/50 rounded-xl p-4 border border-coffee-crystal/20">
            <h3 className="text-lg font-semibold text-coffee-espresso mb-3 flex items-center gap-2">
              <FaClipboardList className="text-coffee-mocha" />
              Order Type Distribution
            </h3>
            <div className="space-y-2">
              {orderData.orderTypes?.slice(0, 3).map((type, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-coffee-medium capitalize">{type.type}</span>
                  <span className="text-coffee-espresso font-medium">
                    {type.count} ({type.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              Target: 70% online orders
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAnalyticsSection;
