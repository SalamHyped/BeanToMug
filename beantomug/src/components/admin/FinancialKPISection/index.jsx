import React from 'react';
import {
  FaDollarSign,
  FaChartLine,
  FaReceipt,
  FaBriefcase,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaClock,
  FaBullseye,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import FinancialKPICard from '../FinancialKPICard';

const FinancialKPISection = ({ financialData, loading }) => {
  // Transform the new data structure to match our KPI cards
  const kpis = [
    {
      title: "Today's Revenue",
      value: financialData?.todaysRevenue || "$0.00",
      target: financialData?.todaysTarget || "$3,000.00",
      percentage: financialData?.todaysPercentage || 0,
      change: financialData?.todaysChange || "+0.0%",
      comparison: "vs yesterday",
      color: financialData?.todaysChange?.includes('+') ? "success" : "warning",
      trend: financialData?.todaysChange?.includes('+') ? "up" : "down",
      dataQuality: financialData?.dataQuality || "low"
    },
    {
      title: "Weekly Revenue",
      value: financialData?.weeklyRevenue || "$0.00",
      target: financialData?.weeklyTarget || "$18,000.00",
      percentage: financialData?.weeklyPercentage || 0,
      change: financialData?.weeklyChange || "+0.0%",
      comparison: "vs last week",
      color: financialData?.weeklyChange?.includes('+') ? "success" : "warning",
      trend: financialData?.weeklyChange?.includes('+') ? "up" : "down",
      dataQuality: financialData?.dataQuality || "low"
    },
    {
      title: "Average Order Value",
      value: financialData?.averageOrderValue || "$0.00",
      target: financialData?.aovTarget || "$15.00",
      percentage: financialData?.aovPercentage || 0,
      change: financialData?.aovChange || "+$0.00",
      comparison: "vs yesterday",
      color: financialData?.aovChangeDirection === "up" ? "success" : "warning",
      trend: financialData?.aovChangeDirection || "neutral",
      orderCount: financialData?.orderCount || 0,
      dataQuality: financialData?.dataQuality || "low"
    },
    {
      title: "Daily Profit",
      value: financialData?.dailyProfit || "$0.00",
      margin: financialData?.profitMargin || "0.0%",
      change: financialData?.profitChange || "+0.0%",
      comparison: "vs yesterday",
      color: financialData?.profitChange?.includes('+') ? "success" : "warning",
      trend: financialData?.profitChange?.includes('+') ? "up" : "down",
      profitSource: financialData?.profitSource || "configured",
      dataQuality: financialData?.dataQuality || "low"
    }
  ];

  if (loading) {
    return (
      <div className="p-6 bg-dashboard-content
                      rounded-2xl border-2 border-coffee-crystal/20 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaDollarSign className="text-3xl text-coffee-mocha" />
          <h2 className="text-2xl font-bold text-coffee-espresso">Financial Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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

  // Get data quality indicator with React Icons
  const getDataQualityIndicator = (quality) => {
    switch (quality) {
      case 'high':
        return {
          icon: <FaCheckCircle className="text-coffee-crystal" />,
          color: 'text-coffee-crystal',
          text: 'High Quality'
        };
      case 'medium':
        return {
          icon: <FaExclamationTriangle className="text-coffee-warm" />,
          color: 'text-coffee-warm',
          text: 'Medium Quality'
        };
      case 'low':
        return {
          icon: <FaExclamationCircle className="text-coffee-mocha" />,
          color: 'text-coffee-mocha',
          text: 'Low Quality'
        };
      default:
        return {
          icon: <FaClock className="text-coffee-medium" />,
          color: 'text-coffee-medium',
          text: 'Loading...'
        };
    }
  };

  const dataQuality = getDataQualityIndicator(financialData?.dataQuality);

  return (
    <div className="p-6 bg-dashboard-content
                    rounded-2xl border-2 border-coffee-crystal/20 mb-8
                    shadow-xl shadow-coffee-espresso/10">

      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <FaDollarSign className="text-3xl text-coffee-mocha filter drop-shadow-lg" />
        <h2 className="text-2xl font-bold text-coffee-espresso
                       bg-gradient-to-r from-coffee-espresso to-coffee-mocha
                       bg-clip-text text-transparent">
          Financial Overview
        </h2>
        <div className="ml-auto flex items-center gap-4">
          {/* Data Quality Indicator */}
          <div className={`flex items-center gap-2 text-sm ${dataQuality.color}`}>
            {dataQuality.icon}
            <span className="font-medium">{dataQuality.text}</span>
          </div>

          {/* Live Data Indicator */}
          <div className="flex items-center gap-2 text-sm text-coffee-mocha">
            <div className="w-2 h-2 bg-coffee-crystal rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <FinancialKPICard key={index} kpi={kpi} />
        ))}
      </div>

      {/* Enhanced Summary Footer */}
      <div className="mt-6 pt-4 border-t border-coffee-crystal/30">
        <div className="flex flex-wrap items-center justify-between text-sm text-coffee-mocha">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <FaClock className="text-coffee-mocha" />
              Last updated: {financialData?.lastUpdated ?
                new Date(financialData.lastUpdated).toLocaleTimeString() :
                new Date().toLocaleTimeString()}
            </span>

            <span className="flex items-center gap-2">
              <FaBullseye className="text-coffee-mocha" />
              Performance: {financialData?.todaysPercentage >= 80 ? 'Strong' :
                financialData?.todaysPercentage >= 60 ? 'Good' : 'Needs Attention'}
            </span>

            {/* Profit Source Indicator */}
            {financialData?.profitSource && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                financialData.profitSource === 'calculated' ? 'bg-coffee-crystal/20 text-coffee-espresso' :
                financialData.profitSource === 'configured' ? 'bg-coffee-pearl/20 text-coffee-mocha' :
                'bg-coffee-warm/20 text-coffee-espresso'
              }`}>
                <FaChartLine className="text-xs" />
                Profit: {financialData.profitSource === 'calculated' ? 'Real Data' :
                        financialData.profitSource === 'configured' ? 'Configured' : 'Fallback'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {financialData?.todaysChange?.includes('+') ? (
              <span className="text-coffee-crystal font-semibold flex items-center gap-1">
                <FaArrowUp />
                Trending Up
              </span>
            ) : (
              <span className="text-coffee-mocha font-semibold flex items-center gap-1">
                <FaArrowDown />
                Trending Down
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialKPISection;
