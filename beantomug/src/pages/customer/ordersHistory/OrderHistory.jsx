import React, { useState, useEffect, useContext } from 'react';
import { useUser } from '../../../context/UserContext/UserContext';
import axios from 'axios';
import OrderItemDisplay from '../../../components/OrderItemDisplay';
import classes from './OrderHistory.module.css';

export default function OrderHistory() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8801/orders/history', {
        withCredentials: true
      });
      setOrders(response.data.orders || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return classes.statusPending;
      case 'completed':
        return classes.statusCompleted;
      case 'cancelled':
        return classes.statusCancelled;
      case 'processing':
        return classes.statusProcessing;
      default:
        return classes.statusDefault;
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'processing':
        return '🔄';
      default:
        return '📋';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status.toLowerCase() === filter;
    const matchesSearch = order.order_id.toString().includes(searchTerm) || 
                         order.items.some(item => 
                           item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesFilter && matchesSearch;
  });

  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(selectedOrder?.order_id === order.order_id ? null : order);
  };

  if (!user) {
    return (
      <div className={classes.container}>
        <div className={classes.errorMessage}>
          Please log in to view your order history.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={classes.container}>
        <div className={classes.loading}>
          <div className={classes.spinner}></div>
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1>Order History</h1>
        <p>Welcome back, {user.username}! Here are your past orders.</p>
      </div>

      {/* Filters and Search */}
      <div className={classes.controls}>
        <div className={classes.searchBox}>
          <input
            type="text"
            placeholder="Search orders by ID or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={classes.searchInput}
          />
        </div>
        
        <div className={classes.filterButtons}>
          <button
            className={`${classes.filterBtn} ${filter === 'all' ? classes.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All Orders
          </button>
          <button
            className={`${classes.filterBtn} ${filter === 'pending' ? classes.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`${classes.filterBtn} ${filter === 'processing' ? classes.active : ''}`}
            onClick={() => setFilter('processing')}
          >
            Processing
          </button>
          <button
            className={`${classes.filterBtn} ${filter === 'completed' ? classes.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`${classes.filterBtn} ${filter === 'cancelled' ? classes.active : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {error && (
        <div className={classes.errorMessage}>
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className={classes.ordersContainer}>
        {filteredOrders.length === 0 ? (
          <div className={classes.emptyState}>
            <div className={classes.emptyIcon}>📦</div>
            <h3>No orders found</h3>
            <p>
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t placed any orders yet. Start shopping to see your order history here!'
              }
            </p>
          </div>
        ) : (
          <div className={classes.ordersList}>
            {filteredOrders.map((order) => (
              <div key={order.order_id} className={classes.orderCard}>
                <div 
                  className={classes.orderHeader}
                  onClick={() => handleOrderClick(order)}
                >
                  <div className={classes.orderInfo}>
                    <h3>Order #{order.order_id}</h3>
                    <p className={classes.orderDate}>
                      {formatDate(order.created_at)}
                    </p>
                    <p className={classes.orderType}>
                      {order.order_type} • {order.items.length} items
                    </p>
                  </div>
                  
                  <div className={classes.orderStatus}>
                    <span className={`${classes.statusBadge} ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span className={classes.orderTotal}>
                      ${calculateOrderTotal(order.items).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className={classes.expandIcon}>
                    {selectedOrder?.order_id === order.order_id ? '−' : '+'}
                  </div>
                </div>

                {/* Expanded Order Details */}
                {selectedOrder?.order_id === order.order_id && (
                  <div className={classes.orderDetails}>
                    <OrderItemDisplay 
                      items={order.items}
                      variant="detailed"
                      showOptions={true}
                      showPrice={true}
                      showQuantity={true}
                    />
                    
                    <div className={classes.orderSummary}>
                      <div className={classes.summaryRow}>
                        <span>Subtotal:</span>
                        <span>${calculateOrderTotal(order.items).toFixed(2)}</span>
                      </div>
                      <div className={classes.summaryRow}>
                        <span>Order Type:</span>
                        <span>{order.order_type}</span>
                      </div>
                      <div className={classes.summaryRow}>
                        <span>Status:</span>
                        <span className={getStatusColor(order.status)}>
                          {order.status}
                        </span>
                      </div>
                      <div className={classes.summaryRow}>
                        <span>Order Date:</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      {order.updated_at && order.updated_at !== order.created_at && (
                        <div className={classes.summaryRow}>
                          <span>Last Updated:</span>
                          <span>{formatDate(order.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 