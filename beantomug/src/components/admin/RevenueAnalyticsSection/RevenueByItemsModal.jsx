import React, { useState, useEffect } from 'react';

const RevenueByItemsModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  itemRevenue = [],
  currentSettings = {}
}) => {
  const [selectedCategories, setSelectedCategories] = useState(currentSettings.categories || []);
  const [itemLimit, setItemLimit] = useState(currentSettings.itemLimit || 10);
  const [showAllItems, setShowAllItems] = useState(currentSettings.showAllItems || false);

  // Get unique categories from item revenue data
  const availableCategories = React.useMemo(() => {
    if (!itemRevenue || !Array.isArray(itemRevenue)) {
      console.log('Modal: No itemRevenue data available');
      return [];
    }
    
    console.log('Modal: Raw itemRevenue data:', itemRevenue);
    
    // Extract unique categories, filter out null/undefined, and sort them
    const categories = [...new Set(
      itemRevenue
        .filter(item => item && item.category)
        .map(item => item.category)
    )];
    
    console.log('Modal: Extracted categories:', categories);
    console.log('Modal: Categories count:', categories.length);
    
    return categories.sort();
  }, [itemRevenue]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategories(currentSettings.categories || []);
      setItemLimit(currentSettings.itemLimit || 10);
      setShowAllItems(currentSettings.showAllItems || false);
    }
  }, [isOpen, currentSettings]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(availableCategories);
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleApply = () => {
    const settings = {
      categories: selectedCategories,
      itemLimit: showAllItems ? null : itemLimit,
      showAllItems
    };
    onApply(settings);
    onClose();
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setItemLimit(10);
    setShowAllItems(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-8 py-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Revenue by Items Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 flex-1 overflow-y-auto">
          {/* Item Limit Section */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Number of Items to Display
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200 cursor-pointer">
                <input
                  type="radio"
                  name="itemLimit"
                  checked={!showAllItems}
                  onChange={() => setShowAllItems(false)}
                  className="mr-4 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-gray-700 font-medium">Show top items:</span>
              </label>
              
              {!showAllItems && (
                <div className="ml-8 mb-4">
                  <select
                    value={itemLimit}
                    onChange={(e) => setItemLimit(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  >
                    <option value={5}>Top 5 Items</option>
                    <option value={10}>Top 10 Items</option>
                    <option value={15}>Top 15 Items</option>
                    <option value={20}>Top 20 Items</option>
                  </select>
                </div>
              )}

              <label className="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200 cursor-pointer">
                <input
                  type="radio"
                  name="itemLimit"
                  checked={showAllItems}
                  onChange={() => setShowAllItems(true)}
                  className="mr-4 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-gray-700 font-medium">Show all items</span>
              </label>
            </div>
          </div>

          {/* Category Filter Section */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Filter by Categories
              </h3>
              <div className="space-x-3">
                <button
                  onClick={handleSelectAllCategories}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAllCategories}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white shadow-inner">
              {availableCategories.length > 0 ? (
                <div className="space-y-3">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="mr-3 text-blue-600 focus:ring-blue-500 rounded w-4 h-4"
                      />
                      <span className="text-gray-700 font-medium">{category}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No categories available</p>
              )}
            </div>
            
            {selectedCategories.length === 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 text-center">
                  <span className="font-medium">No categories selected</span> = Show all categories
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200 shadow-sm">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Summary
            </h4>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-blue-800 text-center">
                <span className="font-bold">
                  {showAllItems ? 'All items' : `Top ${itemLimit} items`}
                </span>
                {selectedCategories.length > 0 
                  ? ` from ${selectedCategories.length} selected categories`
                  : ' from all categories'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-8 py-6 rounded-b-xl shadow-lg">
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:-translate-y-0.5"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueByItemsModal;
