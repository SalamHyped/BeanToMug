import React from 'react';
import useOrderRatings from '../../../hooks/useOrderRatings.js';

const CustomerSatisfactionSection = () => {
  const { ratingsData, loading, error } = useOrderRatings();

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

             {/* Summary Stats */}
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-6 text-center">
             <div className="text-3xl font-bold text-coffee-espresso mb-2">
               {ratingsData.totalRatings || 0}
             </div>
             <div className="text-sm text-coffee-medium font-medium">Total Ratings</div>
           </div>
           <div className="bg-coffee-ivory rounded-xl shadow-lg border border-coffee-crystal/30 p-6 text-center">
           <div className="text-3xl font-bold text-coffee-espresso mb-2">
             {ratingsData.overall ? ratingsData.overall.toFixed(1) : '0.0'}
           </div>
           <div className="text-sm text-coffee-medium font-medium">Overall Rating</div>
         </div>
       </div>


    </div>
  );
};

export default CustomerSatisfactionSection;
