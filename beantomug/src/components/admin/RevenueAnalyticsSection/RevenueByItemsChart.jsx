import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaCog } from 'react-icons/fa';
import ExportButtons from '../../controls/ExportButtons';
import RevenueByItemsModal from './RevenueByItemsModal';

const RevenueByItemsChart = ({ 
  itemRevenue, 
  currentRange, 
  onCSVExport, 
  onPDFExport,
  formatCurrency 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    categories: [],
    itemLimit: 10,
    showAllItems: false
  });

  // Apply filters to the data
  const filteredData = React.useMemo(() => {
    if (!itemRevenue) return [];
    
    let filtered = itemRevenue;
    
    // Filter by categories if any are selected
    if (chartSettings.categories && chartSettings.categories.length > 0) {
      filtered = filtered.filter(item => 
        chartSettings.categories.includes(item.category)
      );
    }
    
    // Apply item limit if not showing all
    if (!chartSettings.showAllItems && chartSettings.itemLimit) {
      filtered = filtered.slice(0, chartSettings.itemLimit);
    }
    
    return filtered;
  }, [itemRevenue, chartSettings]);
  // Chart data for revenue by items - using filtered data
  const itemsRevenueChartData = {
    labels: filteredData.map(item => item.name),
    datasets: [{
      label: 'Revenue',
      data: filteredData.map(item => item.revenue),
      backgroundColor: [
        'rgba(139, 69, 19, 0.8)',   // Coffee brown
        'rgba(210, 105, 30, 0.8)',  // Pastry orange
        'rgba(205, 133, 63, 0.8)',  // Drink tan
        'rgba(222, 184, 135, 0.8)', // Beans beige
        'rgba(245, 222, 179, 0.8)', // Snacks cream
        'rgba(160, 82, 45, 0.8)',   // Merch brown
        'rgba(139, 69, 19, 0.6)',   // Additional colors for more items
        'rgba(210, 105, 30, 0.6)',
        'rgba(205, 133, 63, 0.6)',
        'rgba(222, 184, 135, 0.6)'
      ],
      borderColor: [
        'rgba(139, 69, 19, 1)',
        'rgba(210, 105, 30, 1)',
        'rgba(205, 133, 63, 1)',
        'rgba(222, 184, 135, 1)',
        'rgba(245, 222, 179, 1)',
        'rgba(160, 82, 45, 1)',
        'rgba(139, 69, 19, 0.8)',
        'rgba(210, 105, 30, 0.8)',
        'rgba(205, 133, 63, 0.8)',
        'rgba(222, 184, 135, 0.8)'
      ],
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    }]
  };

  const itemsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // Hide legend since we only have one dataset
      },
      title: {
        display: true,
        text: 'Top Revenue Generating Items',
        color: '#8B4513',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Revenue: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Items',
          color: '#8B4513'
        },
        grid: {
          display: false
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
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
  };

  const handleModalApply = (settings) => {
    setChartSettings(settings);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-coffee-brown">
          Revenue by Items
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenModal}
            className="p-2 text-coffee-dark hover:text-coffee-brown hover:bg-coffee-snow rounded-md transition-colors"
            title="Chart Settings"
          >
            <FaCog className="w-4 h-4" />
          </button>
          {itemRevenue && itemRevenue.length > 0 && (
            <ExportButtons 
              onCSVExport={onCSVExport}
              onPDFExport={onPDFExport}
              variant="chart"
              size="small"
            />
          )}
        </div>
      </div>
      <div className="h-80">
        {itemRevenue && itemRevenue.length > 0 ? (
          <Bar data={itemsRevenueChartData} options={itemsChartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-coffee-dark">
              <p className="text-lg font-medium">No item revenue data available</p>
              <p className="text-sm opacity-70">Select a different date range or check your orders</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <RevenueByItemsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleModalApply}
        itemRevenue={itemRevenue}
        currentSettings={chartSettings}
      />
      
    </div>
  );
};

export default RevenueByItemsChart;
