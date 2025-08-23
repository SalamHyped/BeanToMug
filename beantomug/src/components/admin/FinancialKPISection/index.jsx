import React from 'react';
import { FaDollarSign } from 'react-icons/fa';
import FinancialKPICard from '../FinancialKPICard';

const FinancialKPISection = ({ financialData, loading }) => {
  // Mock data structure - replace with real data from your API
  const kpis = [
    {
      title: "Today's Revenue",
      value: financialData?.todaysRevenue || "$2,450.75",
      target: "$3,000.00",
      percentage: financialData?.todaysPercentage || 81.7,
      change: financialData?.todaysChange || "+15.2%",
      comparison: "vs yesterday",
      color: "success",
      trend: "up"
    },
    {
      title: "Weekly Revenue",
      value: financialData?.weeklyRevenue || "$14,250.30",
      target: "$18,000.00", 
      percentage: financialData?.weeklyPercentage || 79.2,
      change: financialData?.weeklyChange || "+8.5%",
      comparison: "vs last week",
      color: "success",
      trend: "up"
    },
    {
      title: "Average Order Value",
      value: financialData?.averageOrderValue || "$12.85",
      target: "$15.00",
      percentage: financialData?.aovPercentage || 85.7,
      change: financialData?.aovChange || "-$0.45",
      comparison: "vs yesterday",
      color: "warning",
      trend: "down"
    },
    {
      title: "Daily Profit",
      value: financialData?.dailyProfit || "$980.30",
      margin: financialData?.profitMargin || "40.0%",
      change: financialData?.profitChange || "+12.3%",
      comparison: "vs yesterday",
      color: "success",
      trend: "up"
    }
  ];

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-crystal-frost/50 to-mocha-cream/30 
                      rounded-2xl border-2 border-mocha-medium/20 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaDollarSign className="text-3xl text-mocha-medium" />
          <h2 className="text-2xl font-bold text-mocha-dark">Financial Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-h-[140px] rounded-2xl bg-gradient-to-br 
                                   from-mocha-light/50 to-crystal-ice/50 
                                   animate-pulse">
              <div className="p-6 space-y-3">
                <div className="h-4 bg-mocha-medium/50 rounded w-3/4"></div>
                <div className="h-8 bg-mocha-medium/50 rounded w-1/2"></div>
                <div className="h-3 bg-mocha-medium/50 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-crystal-frost/50 to-mocha-cream/30 
                    rounded-2xl border-2 border-mocha-medium/20 mb-8
                    shadow-xl shadow-mocha-dark/10">
      
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <FaDollarSign className="text-3xl text-mocha-medium filter drop-shadow-lg" />
        <h2 className="text-2xl font-bold text-mocha-dark 
                       bg-gradient-to-r from-mocha-dark to-mocha-medium 
                       bg-clip-text text-transparent">
          Financial Overview
        </h2>
        <div className="ml-auto">
          <div className="flex items-center gap-2 text-sm text-mocha-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <FinancialKPICard 
            key={index} 
            kpi={kpi}
          />
        ))}
      </div>
      
      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-mocha-light/30">
        <div className="flex flex-wrap items-center justify-between text-sm text-mocha-medium">
          <div className="flex items-center gap-4">
            <span>📊 Last updated: {new Date().toLocaleTimeString()}</span>
            <span>🎯 Performance: Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-semibold">↗ Trending Up</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialKPISection;
