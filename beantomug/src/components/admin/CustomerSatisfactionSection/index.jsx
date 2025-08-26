import React from 'react';
import useOrderRatings from '../../../hooks/useOrderRatings.js';
import OrderTypeRatings from '../../charts/OrderTypeRatings';
import AnalyticsDateRangeSelector from '../../controls/AnalyticsDateRangeSelector';

const CustomerSatisfactionSection = () => {
  const { ratingsData, loading, error, currentRange, refreshWithDateRange } = useOrderRatings();

  if (loading) {
    return (
      <div className="customer-satisfaction-section">
        <div className="section-header">
          <h2>Customer Satisfaction</h2>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading satisfaction data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-satisfaction-section">
        <div className="section-header">
          <h2>Customer Satisfaction</h2>
        </div>
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-satisfaction-section">
      <div className="section-header">
        <h2>Customer Satisfaction</h2>
                 <p className="section-description mb-6">
           Monitor customer ratings and satisfaction scores across all order types
         </p>
      </div>

             <div className="charts-grid">
         {/* Order Type Ratings */}
         <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-semibold text-gray-800">
               Order Type Ratings
             </h3>
             <AnalyticsDateRangeSelector 
               currentRange={currentRange}
               onRangeChange={refreshWithDateRange}
             />
           </div>
           <div className="bg-gray-50 rounded-lg p-4">
             <OrderTypeRatings 
               byOrderType={ratingsData.byOrderType} 
               overall={ratingsData.overall}
               totalRatings={ratingsData.totalRatings}
             />
           </div>
         </div>
       </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-item">
          <div className="stat-value">{ratingsData.totalRatings}</div>
          <div className="stat-label">Total Ratings</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{ratingsData.overall.toFixed(1)}</div>
          <div className="stat-label">Overall Rating</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSatisfactionSection;
