import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socketService from '../../../services/socketService';
import { AlertTriangle, AlertCircle, Package, Bell, TrendingUp, ShoppingCart, Coffee, Users } from 'lucide-react';
import { getApiConfig } from '../../../utils/config';

const GeneralAlertsSection = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState({
    productOrders: [],
    general: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffActivity, setStaffActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch initial alerts data
  useEffect(() => {
    fetchAllAlerts();
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (socketService.isConnected) {
      socketService.on('productOrderAlert', handleProductOrderAlert);
      socketService.on('generalAlert', handleGeneralAlert);
      socketService.on('staffAlertActivity', handleStaffAlertActivity);

      return () => {
        socketService.off('productOrderAlert', handleProductOrderAlert);
        socketService.off('generalAlert', handleGeneralAlert);
        socketService.off('staffAlertActivity', handleStaffAlertActivity);
      };
    }
  }, []);

  const fetchAllAlerts = async () => {
    try {
      setLoading(true);
      const productOrdersRes = await axios.get('/product-orders/alerts', getApiConfig()).catch(() => ({ data: { orders: [] } }));

      setAlerts({
        productOrders: productOrdersRes.data.orders || [],
        general: []
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };


  const handleProductOrderAlert = (data) => {
    setAlerts(prev => ({
      ...prev,
      productOrders: [{
        id: Date.now(),
        product_order_id: data.productOrderId,
        alert_type: data.alertType,
        message: data.message,
        created_at: data.timestamp,
        is_read: false,
        category: 'productOrders'
      }, ...prev.productOrders]
    }));
  };

  const handleGeneralAlert = (data) => {
    setAlerts(prev => ({
      ...prev,
      general: [{
        id: Date.now(),
        alert_type: data.alertType,
        message: data.message,
        created_at: data.timestamp,
        is_read: false,
        category: 'general'
      }, ...prev.general]
    }));
  };

  const handleStaffAlertActivity = (data) => {
    setStaffActivity(data);
    
    // Clear staff activity after 10 seconds
    setTimeout(() => {
      setStaffActivity(null);
    }, 10000);
  };

  const getAlertIcon = (alertType, category) => {
    switch (alertType) {
      case 'low_stock':
        return <AlertTriangle size={16} className="text-amber-600" />;
      case 'out_of_stock':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'urgent_order':
        return <ShoppingCart size={16} className="text-orange-500" />;
      case 'ingredient_expiry':
        return <Coffee size={16} className="text-purple-500" />;
      case 'staff_shortage':
        return <Users size={16} className="text-blue-500" />;
      default:
        return <Package size={16} className="text-blue-500" />;
    }
  };

  const getAlertColor = (alertType, category, status, isExpired) => {
    // Handle product orders with specific status colors
    if (category === 'productOrders') {
      if (isExpired) {
        return 'border-l-red-500 bg-red-50';
      } else if (status === 'pending') {
        return 'border-l-amber-500 bg-amber-50';
      } else {
        return 'border-l-sky-500 bg-sky-50';
      }
    }
    
    // Handle other alert types
    switch (alertType) {
      case 'low_stock':
        return 'border-l-amber-500 bg-amber-50';
      case 'out_of_stock':
        return 'border-l-red-500 bg-red-50';
      case 'urgent_order':
        return 'border-l-orange-500 bg-orange-50';
      case 'ingredient_expiry':
        return 'border-l-purple-500 bg-purple-50';
      case 'staff_shortage':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'productOrders':
        return <Coffee size={14} className="text-coffee-dark" />;
      case 'general':
        return <Bell size={14} className="text-coffee-dark" />;
      default:
        return <Bell size={14} className="text-coffee-dark" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'productOrders':
        return 'Product Orders';
      case 'general':
        return 'General';
      default:
        return 'Alert';
    }
  };

  const getNavigationPath = (category) => {
    switch (category) {
      case 'productOrders':
        return '/admin/product-orders';
      default:
        return '/admin/dashboard';
    }
  };

  const getAllAlerts = () => {
    return [
      ...alerts.productOrders.map(alert => ({ ...alert, category: 'productOrders' })),
      ...alerts.general.map(alert => ({ ...alert, category: 'general' }))
    ].sort((a, b) => {
      // Handle different date fields for different alert types
      const dateA = a.created_at || a.order_date || new Date(0);
      const dateB = b.created_at || b.order_date || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });
  };

  const getFilteredAlerts = () => {
    if (activeTab === 'all') {
      return getAllAlerts();
    }
    // Ensure category field is set even when filtering by specific tab
    return (alerts[activeTab] || []).map(alert => ({ ...alert, category: activeTab }));
  };

  const getTotalAlerts = () => {
    return Object.values(alerts).reduce((total, categoryAlerts) => total + categoryAlerts.length, 0);
  };

  const tabs = [
    { key: 'all', label: 'All', count: getTotalAlerts() },
    { key: 'productOrders', label: 'Product Orders', count: alerts.productOrders.length }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-coffee-crystal/30">
        <div className="animate-pulse">
          <div className="h-5 bg-coffee-cream rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-coffee-cream rounded"></div>
            <div className="h-3 bg-coffee-cream rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 border border-coffee-crystal/30">
        <div className="text-center text-red-600">
          <AlertCircle size={20} className="mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

        const filteredAlerts = getFilteredAlerts();

  return (
    <div className="bg-white rounded-lg p-4 border border-coffee-crystal/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-coffee-rich rounded-lg">
            <Bell size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-coffee-brown">
              Business Alerts
            </h3>
            <p className="text-xs text-coffee-dark">
              {getTotalAlerts() > 0 ? `${getTotalAlerts()} active alert${getTotalAlerts() !== 1 ? 's' : ''}` : 'All systems operational'}
            </p>
          </div>
        </div>

        {/* Staff Activity Indicator */}
        {staffActivity && staffActivity.type === 'viewing_alerts' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-coffee-mist rounded text-xs">
            <span className="text-lg">👥</span>
            <span className="text-coffee-espresso font-medium">
              Staff viewing {staffActivity.alertCount} alert{staffActivity.alertCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Alert Category Tabs */}
      <div className="flex gap-1 mb-3 p-1 bg-coffee-cream rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-coffee-espresso shadow-sm'
                : 'text-coffee-dark hover:text-coffee-espresso'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.key
                  ? 'bg-coffee-rich text-white'
                  : 'bg-coffee-crystal text-coffee-dark'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List - Compact View */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-2">
          {filteredAlerts.slice(0, 3).map((alert, index) => (
            <div
              key={alert.id || alert.product_order_id || `${alert.category}_${index}`}
              className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.alert_type, alert.category, alert.status, alert.is_expired)} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => {
                console.log('Alert clicked!', {
                  category: alert.category,
                  navigationPath: getNavigationPath(alert.category),
                  alert: alert
                });
                navigate(getNavigationPath(alert.category));
              }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-coffee-dark bg-coffee-crystal px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      {getCategoryIcon(alert.category)}
                      {getCategoryLabel(alert.category)}
                    </span>
                  </div>
                  
                  {/* Compact Alert Content */}
                  {alert.category === 'productOrders' ? (
                    <div>
                      <h4 className="font-medium text-coffee-brown mb-1 text-sm">
                        {alert.customer_name || `Order #${alert.product_order_id}`} - {alert.order_type || 'Product Order'}
                      </h4>
                      
                      {/* Compact Order Summary */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-coffee-dark mb-2">
                        <div>ID: #{alert.product_order_id}</div>
                        <div>
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            alert.is_pending ? 'bg-amber-100 text-amber-800' : 
                            alert.is_expired ? 'bg-red-100 text-red-800' : 
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {alert.status || 'Unknown'}
                          </span>
                        </div>
                        <div>Total: ${alert.total_amount || '0.00'}</div>
                        <div>Supplier: {alert.supplier_name || 'Unknown'}</div>
                      </div>
                      
                      {/* Expandable Order Items */}
                      {alert.items && alert.items.length > 0 ? (
                        <details className="mt-2">
                          <summary className="text-xs text-coffee-dark cursor-pointer hover:text-coffee-brown">
                            📦 Order Items ({alert.item_count || alert.items.length}) - Click to expand
                          </summary>
                          <div className="mt-2 space-y-1 pl-2">
                            {alert.items.map((item, itemIndex) => (
                              <div key={item.order_item_id || itemIndex} className="bg-coffee-cream/50 rounded p-2 text-xs">
                                <div className="font-medium text-coffee-brown">
                                  {item.ingredient_name || 'Unknown Item'}
                                </div>
                                <div className="text-coffee-dark">
                                  {item.quantity_ordered || '0'} {item.unit || 'units'} × ${item.unit_cost || '0.00'} = ${item.item_total_cost || '0.00'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <div className="text-xs text-coffee-dark mt-2">
                          📦 No order items available
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-coffee-brown mb-1 text-sm">
                        {alert.title || alert.message || 'Alert'}
                      </h4>
                      <p className="text-xs text-coffee-dark">
                        {alert.description || 'No description available'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-coffee-dark">
                    {alert.category === 'productOrders' ? (
                      alert.is_pending ? 'Pending Order' :
                      alert.is_expired ? 'Overdue Delivery' : 'Product Order'
                    ) : (
                      alert.alert_type === 'low_stock' ? 'Low Stock' : 
                      alert.alert_type === 'out_of_stock' ? 'Out of Stock' :
                      alert.alert_type === 'urgent_order' ? 'Urgent Order' :
                      alert.alert_type === 'ingredient_expiry' ? 'Expiring Soon' :
                      alert.alert_type === 'staff_shortage' ? 'Staff Needed' : 'Alert'
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredAlerts.length > 3 && (
            <div className="text-center pt-2">
              <button className="text-sm text-coffee-mocha hover:text-coffee-espresso font-medium">
                View all {filteredAlerts.length} alerts →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="p-2 bg-emerald-100 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <h4 className="text-sm font-medium text-coffee-brown mb-1">
            All Good!
          </h4>
          <p className="text-coffee-dark text-xs">
            No active {activeTab === 'all' ? '' : `${activeTab} `}alerts at the moment
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneralAlertsSection;
