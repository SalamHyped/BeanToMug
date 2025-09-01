import React, { useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { FaDollarSign, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import AnalyticsDateRangeSelector from '../../controls/AnalyticsDateRangeSelector';
import ExportButtons from '../../controls/ExportButtons';
import RevenueByItemsChart from './RevenueByItemsChart';
import useSalesAnalytics from '../../../hooks/useSalesAnalytics';
import useExportData from '../../../hooks/useExportData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RevenueAnalyticsSection = () => {
  const {
    salesData,
    loading,
    error,
    currentRange,
    granularity,
    refreshWithDateRange,
    toggleGranularity
  } = useSalesAnalytics();

  const { downloadCSV: exportCSV, downloadPDF: exportPDF } = useExportData();

  // Handle date range changes - pass the range key directly
  const handleDateRangeChange = useCallback((startDate, endDate, rangeKey = 'custom') => {
    refreshWithDateRange(rangeKey, startDate, endDate, granularity);
  }, [refreshWithDateRange, granularity]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // This could come from database config later
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Export functionality using the hook
  const handleCSVExport = () => {
    if (!salesData.revenueTrend || salesData.revenueTrend.length === 0) {
      alert('No data available to download');
      return;
    }

    const headers = ['Date', 'Revenue', 'Orders', 'Avg Order Value'];
    const csvData = salesData.revenueTrend.map(item => ({
      date: granularity === 'weekly' 
        ? `Week ${item.date}` 
        : new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          }),
      revenue: formatCurrency(item.revenue),
      orders: item.orderCount,
      avgOrderValue: formatCurrency(item.avgOrderValue)
    }));

    const summaryData = [
      ['Total Revenue', formatCurrency(salesData.financialSummary.currentPeriod.totalRevenue), '', ''],
      ['Total Orders', salesData.financialSummary.currentPeriod.totalOrders, '', ''],
      ['Revenue/Day', formatCurrency(salesData.financialSummary.currentPeriod.revenuePerDay), '', ''],
      ['Revenue Growth', salesData.financialSummary.growth.revenue, '', '']
    ];

    const filename = `revenue-analytics-${currentRange}-${granularity}-${new Date().toISOString().split('T')[0]}.csv`;
    
    exportCSV(csvData, filename, headers, summaryData);
  };

  const handlePDFExport = async () => {
    if (!salesData.revenueTrend || salesData.revenueTrend.length === 0) {
      alert('No data available to download');
      return;
    }

    const pdfData = salesData.revenueTrend.map(item => [
      granularity === 'weekly' 
        ? `Week ${item.date}` 
        : new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          }),
      formatCurrency(item.revenue),
      item.orderCount.toString(),
      formatCurrency(item.avgOrderValue)
    ]);

    const summaryData = [
      ['Total Revenue', formatCurrency(salesData.financialSummary.currentPeriod.totalRevenue), salesData.financialSummary.growth.revenue],
      ['Total Orders', salesData.financialSummary.currentPeriod.totalOrders.toString(), salesData.financialSummary.growth.orders],
      ['Revenue/Day', formatCurrency(salesData.financialSummary.currentPeriod.revenuePerDay), ''],
      ['Avg Order Value', formatCurrency(salesData.financialSummary.currentPeriod.avgOrderValue), salesData.financialSummary.growth.avgOrderValue]
    ];

    const filename = `revenue-analytics-${currentRange}-${granularity}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Capture chart as image
    let chartImage = null;
    try {
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas) {
        chartImage = chartCanvas.toDataURL('image/png');
      }
    } catch (error) {
      console.warn('Could not capture chart:', error);
    }
    
    const options = {
      title: 'Revenue Analytics Report',
      subtitle: `Date Range: ${getCurrentRangeLabel()}, Granularity: ${granularity}`,
      generatedDate: `Generated: ${new Date().toLocaleDateString()}`,
      summaryTitle: 'Financial Summary',
      summaryHeaders: ['Metric', 'Value', 'Change'],
      summaryData: summaryData,
      chartTitle: 'Revenue Trend Chart',
      chartData: true,
      chartImage: chartImage,
      dataTitle: 'Revenue Trend Details',
      dataHeaders: ['Date', 'Revenue', 'Orders', 'Avg Order Value']
    };

    exportPDF(pdfData, filename, options);
  };

  // Export functionality for items revenue chart
  const handleItemsCSVExport = () => {
    if (!salesData.itemRevenue || salesData.itemRevenue.length === 0) {
      alert('No item revenue data available to download');
      return;
    }

    const headers = ['Item', 'Category', 'Revenue', 'Orders', 'Quantity', 'Percentage of Total'];
    const totalRevenue = salesData.itemRevenue.reduce((sum, item) => sum + item.revenue, 0);
    
    const csvData = salesData.itemRevenue.map(item => {
      const percentage = ((item.revenue / totalRevenue) * 100).toFixed(1);
      return {
        item: item.name,
        category: item.category,
        revenue: formatCurrency(item.revenue),
        orders: item.orderCount,
        quantity: item.totalQuantity,
        percentage: `${percentage}%`
      };
    });

    const summaryData = [
      ['Total Revenue', formatCurrency(totalRevenue), '', '', '', '100%'],
      ['Top Item', salesData.itemRevenue[0]?.name || 'N/A', '', '', '', `${((salesData.itemRevenue[0]?.revenue || 0) / totalRevenue * 100).toFixed(1)}%`],
      ['Total Items', salesData.itemRevenue.length.toString(), '', '', '', '']
    ];

    const filename = `revenue-by-items-${currentRange}-${new Date().toISOString().split('T')[0]}.csv`;
    
    exportCSV(csvData, filename, headers, summaryData);
  };

  const handleItemsPDFExport = async () => {
    if (!salesData.itemRevenue || salesData.itemRevenue.length === 0) {
      alert('No item revenue data available to download');
      return;
    }

    const totalRevenue = salesData.itemRevenue.reduce((sum, item) => sum + item.revenue, 0);
    
    const pdfData = salesData.itemRevenue.map(item => {
      const percentage = ((item.revenue / totalRevenue) * 100).toFixed(1);
      return [
        item.name,
        item.category,
        formatCurrency(item.revenue),
        item.orderCount.toString(),
        item.totalQuantity.toString(),
        `${percentage}%`
      ];
    });

    const summaryData = [
      ['Total Revenue', formatCurrency(totalRevenue), '100%'],
      ['Top Item', salesData.itemRevenue[0]?.name || 'N/A', `${((salesData.itemRevenue[0]?.revenue || 0) / totalRevenue * 100).toFixed(1)}%`],
      ['Total Items', salesData.itemRevenue.length.toString(), ''],
      ['Average per Item', formatCurrency(totalRevenue / salesData.itemRevenue.length), '']
    ];

    const filename = `revenue-by-items-${currentRange}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Capture chart as image
    let chartImage = null;
    try {
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas) {
        chartImage = chartCanvas.toDataURL('image/png');
      }
    } catch (error) {
      console.warn('Could not capture chart:', error);
    }
    
    const options = {
      title: 'Revenue by Items Report',
      subtitle: `Date Range: ${getCurrentRangeLabel()}`,
      generatedDate: `Generated: ${new Date().toLocaleDateString()}`,
      summaryTitle: 'Items Summary',
      summaryHeaders: ['Metric', 'Value', 'Percentage'],
      summaryData: summaryData,
      chartTitle: 'Revenue by Items Chart',
      chartData: true,
      chartImage: chartImage,
      dataTitle: 'Item Revenue Details',
      dataHeaders: ['Item', 'Category', 'Revenue', 'Orders', 'Quantity', 'Percentage']
    };

    exportPDF(pdfData, filename, options);
  };

  const getComparisonText = (range) => {
    if (range === 'today') return 'vs yesterday';
    if (range === '7_days') return 'vs previous 7 days';
    if (range === '14_days') return 'vs previous 14 days';
    if (range === '30_days') return 'vs previous 30 days';
    if (range === '3_months') return 'vs previous 3 months';
    if (range === '6_months') return 'vs previous 6 months';
    if (range === '1_year') return 'vs previous year';
    return 'vs previous period';
  };

  const getCurrentRangeLabel = () => {
    if (currentRange === 'today') return 'Today';
    if (currentRange === '7_days') return 'Last 7 Days';
    if (currentRange === '14_days') return 'Last 14 Days';
    if (currentRange === '30_days') return 'Last 30 Days';
    if (currentRange === '3_months') return 'Last 3 Months';
    if (currentRange === '6_months') return 'Last 6 Months';
    if (currentRange === '1_year') return 'Last Year';
    if (currentRange === 'custom') return 'Custom Range';
    return 'Last 30 Days';
  };



  // Chart data for revenue trend
  const revenueChartData = {
    labels: salesData.revenueTrend.map(item => {
      if (granularity === 'weekly') {
        // Format week number to be more readable
        const weekNum = item.date;
        return `Week ${weekNum}`;
      }
      // Format date for daily view
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.revenueTrend.map(item => item.revenue),
        borderColor: '#8B4513',
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Revenue Trend (${granularity === 'daily' ? 'Daily' : 'Weekly'})`,
        color: '#8B4513',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue ($)',
          color: '#8B4513'
        },
        grid: {
          color: 'rgba(139, 69, 19, 0.1)'
        }
      }
    },
  };



  // Financial KPIs - Focus on revenue-specific metrics
  const kpis = [
        {
      title: 'Total Revenue',
      value: formatCurrency(salesData.financialSummary.currentPeriod.totalRevenue),
      change: salesData.financialSummary.growth.revenue,
      trend: salesData.financialSummary.growth.revenue.startsWith('+') ? 'up' : 'down',
      icon: FaDollarSign,
      color: 'bg-coffee-rich text-white'
    },
    {
      title: 'Revenue/Day',
      value: formatCurrency(salesData.financialSummary.currentPeriod.revenuePerDay),
      change: salesData.financialSummary.growth.revenue,
      trend: salesData.financialSummary.growth.revenue.startsWith('+') ? 'up' : 'down',
      icon: FaCalendarAlt,
      color: 'bg-coffee-crystal text-coffee-espresso'
    },
    {
      title: 'Revenue Growth',
      value: salesData.financialSummary.growth.revenue,
      change: salesData.financialSummary.growth.revenue,
      trend: salesData.financialSummary.growth.revenue.startsWith('+') ? 'up' : 'down',
      icon: FaChartLine,
      color: 'bg-coffee-mist text-coffee-espresso'
    },
    {
      title: 'Top Revenue Day',
      value: salesData.revenueTrend.length > 0 
        ? new Date(salesData.revenueTrend.reduce((max, item) => 
            item.revenue > max.revenue ? item : max
          ).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'N/A',
      change: salesData.revenueTrend.length > 0 
        ? formatCurrency(salesData.revenueTrend.reduce((max, item) => 
            item.revenue > max.revenue ? item : max
          ).revenue)
        : 'N/A',
      trend: 'up',
      icon: FaCalendarAlt,
      color: 'bg-coffee-pearl text-coffee-espresso'
    }
  ];

  if (loading) {
    return (
      <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-coffee-cream rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-coffee-cream rounded"></div>
            ))}
          </div>
          <div className="h-80 bg-coffee-cream rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-6">
        <div className="text-center text-red-600">
          <p>Error loading revenue analytics: {error}</p>
          <button 
            onClick={() => refreshWithDateRange(currentRange)}
            className="mt-2 px-4 py-2 bg-coffee-brown text-white rounded hover:bg-coffee-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-coffee-brown mb-2">
            Revenue Analytics
          </h2>
          <p className="text-coffee-dark text-sm">
            Track revenue trends and financial metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <AnalyticsDateRangeSelector
            currentRange={currentRange}
            onRangeChange={handleDateRangeChange}
          />
          
          <button
            onClick={toggleGranularity}
            className="px-4 py-2 bg-coffee-cream text-coffee-brown rounded-lg hover:bg-coffee-ivory transition-colors flex items-center gap-2"
          >
            <FaCalendarAlt />
            {granularity === 'daily' ? 'Daily' : 'Weekly'}
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <div key={index} className={`${kpi.color} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <IconComponent className="text-2xl opacity-80" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change}
                </span>
                <span className="text-xs opacity-70">
                  {getComparisonText(currentRange)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-coffee-brown">
            Revenue Trend Chart
          </h3>
          <ExportButtons 
            onCSVExport={handleCSVExport}
            onPDFExport={handlePDFExport}
            variant="chart"
            size="small"
          />
        </div>
        <div className="h-80">
          <Line data={revenueChartData} options={revenueChartOptions} />
        </div>
      </div>

      {/* Revenue by Items Chart */}
      <RevenueByItemsChart 
        itemRevenue={salesData.itemRevenue}
        currentRange={currentRange}
        onCSVExport={handleItemsCSVExport}
        onPDFExport={handleItemsPDFExport}
        formatCurrency={formatCurrency}
      />

      {/* Sales Performance Table */}
      <div className="bg-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-coffee-brown">
            Sales Performance Details
          </h3>
          <ExportButtons 
            onCSVExport={handleCSVExport}
            onPDFExport={handlePDFExport}
            variant="primary"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-coffee-cream">
                <th className="text-left py-2 px-3 text-coffee-brown font-semibold">Date</th>
                <th className="text-right py-2 px-3 text-coffee-brown font-semibold">Revenue</th>
                <th className="text-right py-2 px-3 text-coffee-brown font-semibold">Orders</th>
                <th className="text-right py-2 px-3 text-coffee-brown font-semibold">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {salesData.revenueTrend.map((item, index) => (
                <tr key={index} className="border-b border-coffee-cream hover:bg-coffee-snow">
                  <td className="py-2 px-3 text-coffee-dark">
                    {granularity === 'weekly' 
                      ? `Week ${item.date}` 
                      : new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })
                    }
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-coffee-brown">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="py-2 px-3 text-right text-coffee-dark">
                    {formatNumber(item.orderCount)}
                  </td>
                  <td className="py-2 px-3 text-right text-coffee-dark">
                    {formatCurrency(item.avgOrderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalyticsSection;
