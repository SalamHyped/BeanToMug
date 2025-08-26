import React, { useState } from 'react';
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa';

const AnalyticsDateRangeSelector = ({ onRangeChange, currentRange = '7_days' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const quickRanges = [
    { key: '7_days', label: 'Last 7 Days', days: 7 },
    { key: '14_days', label: 'Last 14 Days', days: 14 },
    { key: '30_days', label: 'Last 30 Days', days: 30 },
    { key: '3_months', label: 'Last 3 Months', days: 90 },
    { key: '6_months', label: 'Last 6 Months', days: 180 },
    { key: '1_year', label: 'Last Year', days: 365 }
  ];

  const handleQuickRange = (range) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - range.days * 24 * 60 * 60 * 1000);
    onRangeChange(startDate, endDate);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      onRangeChange(startDate, endDate);
      setIsOpen(false);
    }
  };

  const getCurrentRangeLabel = () => {
    const range = quickRanges.find(r => r.key === currentRange);
    return range ? range.label : 'Custom Range';
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 transition-colors text-xs"
      >
        <FaCalendarAlt className="text-coffee-600 text-xs" />
        <span className="font-medium text-gray-700">{getCurrentRangeLabel()}</span>
        <FaChevronDown className={`text-gray-400 transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {/* Quick Ranges */}
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Quick Ranges</h3>
            <div className="grid grid-cols-1 gap-1">
              {quickRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleQuickRange(range)}
                  className="px-2 py-1.5 text-xs text-left text-gray-700 hover:bg-coffee-50 hover:text-coffee-700 rounded transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Custom Range</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-coffee-500 focus:border-coffee-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-coffee-500 focus:border-coffee-500"
                />
              </div>
              <button
                onClick={handleCustomRange}
                disabled={!customStartDate || !customEndDate}
                className="w-full px-3 py-1.5 bg-coffee-600 text-white text-xs font-medium rounded hover:bg-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply Custom Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default AnalyticsDateRangeSelector;
