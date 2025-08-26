import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OrderTypeRatings = ({ byOrderType, overall, totalRatings }) => {
  // Filter out zero values and create dynamic labels
  const orderTypes = Object.entries(byOrderType)
    .filter(([key, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      value,
      label: key === 'online' ? 'Dine In' : key === 'pickup' ? 'Take Away' : key
    }));

  const data = {
    labels: orderTypes.map(type => type.label),
    datasets: [
      {
        label: 'Average Rating',
        data: orderTypes.map(type => type.value),
        backgroundColor: orderTypes.map((type, index) => {
          const colors = ['#A67B4A', '#C4A484', '#D4B898', '#E2C8A8']; // coffee-warm, coffee-latte, coffee-light, coffee-cream
          return colors[index % colors.length];
        }),
        borderColor: orderTypes.map((type, index) => {
          const colors = ['#8B5A2B', '#A67B4A', '#C4A484', '#D4B898']; // coffee-medium, coffee-warm, coffee-latte, coffee-light
          return colors[index % colors.length];
        }),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Rating: ${context.parsed.y.toFixed(1)}/5`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value + '★';
          },
          color: '#6B4423',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: '#E2C8A8',
          borderColor: '#E2C8A8'
        },
        border: {
          color: '#E2C8A8'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B4423',
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };

  return (
    <div className="order-type-ratings bg-gradient-to-br from-coffee-mist to-coffee-cloud rounded-2xl p-6 border border-coffee-crystal/30 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-coffee-espresso mb-2">
          Satisfaction by Order Type
        </h3>
        <p className="text-sm text-coffee-medium">
          Average customer ratings for different order types
        </p>
      </div>
      <div style={{ height: '300px' }}>
        <Bar data={data} options={options} />
      </div>
      
      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-coffee-crystal/20 rounded-lg border border-coffee-crystal/30">
          <div className="text-2xl font-bold text-coffee-espresso">{totalRatings || 0}</div>
          <div className="text-sm text-coffee-medium font-medium">Total Ratings</div>
        </div>
        <div className="text-center p-4 bg-coffee-crystal/20 rounded-lg border border-coffee-crystal/30">
          <div className="text-2xl font-bold text-coffee-espresso">{overall ? overall.toFixed(1) : '0.0'}</div>
          <div className="text-sm text-coffee-medium font-medium">Overall Rating</div>
        </div>
      </div>
      
      {orderTypes.length === 0 && (
        <div className="text-center py-8 text-coffee-medium">
          <p>No ratings data available for the selected period</p>
        </div>
      )}
    </div>
  );
};

export default OrderTypeRatings;

