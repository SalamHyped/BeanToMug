import React from 'react';
import { useProductOrders } from '../../hooks';
import styles from './index.module.css';

const ProductOrderList = ({ 
  onEditOrder,
  onViewOrder, 
  orders = [], 
  loading = false, 
  error = null,
  filteredCount = 0
}) => {
  const {
    updateOrderStatus,
    deleteProductOrder
  } = useProductOrders();

  const handleEdit = (order) => {
    if (onEditOrder) {
      onEditOrder(order);
    }
  };

  const handleView = (order) => {
    if (onViewOrder) {
      onViewOrder(order);
    }
  };

  const handleStatusUpdate = async (orderId, currentStatus) => {
    // Define next status progression
    const statusProgression = {
      'pending': 'shipped',
      'shipped': 'received',
      'received': 'received', // Can't progress further
      'cancelled': 'cancelled' // Can't progress further
    };

    const nextStatus = statusProgression[currentStatus];
    
    if (nextStatus && nextStatus !== currentStatus) {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (!result.success) {
        console.error('Failed to update order status');
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      const result = await updateOrderStatus(orderId, 'cancelled');
      if (!result.success) {
        console.error('Failed to cancel order');
      }
    }
  };

  const handleDelete = async (order) => {
    if (order.status !== 'pending') {
      alert('Only pending orders can be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete order #${order.order_id}? This action cannot be undone.`)) {
      const result = await deleteProductOrder(order.order_id);
      if (!result.success) {
        console.error('Failed to delete order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return styles.pending;
      case 'shipped': return styles.shipped;
      case 'received': return styles.received;
      case 'cancelled': return styles.cancelled;
      default: return '';
    }
  };

  const getNextStatusAction = (status) => {
    switch (status) {
      case 'pending': return { label: '🚚 Mark as Shipped', action: 'shipped' };
      case 'shipped': return { label: '📦 Mark as Received', action: 'received' };
      case 'received': return { label: '✅ Completed', disabled: true };
      case 'cancelled': return { label: '❌ Cancelled', disabled: true };
      default: return { label: 'Update Status', disabled: true };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading product orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No product orders found matching your filters. Try adjusting your search criteria or create your first order to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.orderList}>
      <div className={styles.listHeader}>
        <div className={styles.stats}>
          <h3>Orders: {filteredCount} found</h3>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.ordersTable}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier</th>
              <th>Order Date</th>
              <th>Delivery Date</th>
              <th>Total Value</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const nextAction = getNextStatusAction(order.status);
              
              return (
                <tr key={order.order_id} className={`${styles.tableRow} ${!order.status ? styles.inactiveOrder : ''}`}>
                  <td className={styles.idCell}>
                    <h4>#{order.order_id}</h4>
                  </td>
                  <td className={styles.supplierCell}>
                    <div className={styles.supplierInfo}>
                      <strong>{order.supplier_name}</strong>
                      {order.supplier_phone && (
                        <small>📞 {order.supplier_phone}</small>
                      )}
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(order.order_start_date)}
                  </td>
                  <td className={styles.dateCell}>
                    {order.order_end_date ? formatDate(order.order_end_date) : 'Not set'}
                  </td>
                  <td className={styles.priceCell}>
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className={styles.itemsCell}>
                    <div className={styles.itemsInfo}>
                      <span className={styles.itemCount}>{order.item_count || 0} items</span>
                      <span className={styles.quantity}>Qty: {order.total_quantity || 0}</span>
                    </div>
                  </td>
                  <td className={styles.statusCell}>
                    <span className={`${styles.status} ${getStatusColor(order.status)}`}>
                      {order.status_display || order.status}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button 
                      onClick={() => handleView(order)}
                      className={styles.viewButton}
                      title="View order details"
                    >
                      👁️ View
                    </button>
                    
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleEdit(order)}
                        className={styles.editButton}
                        title="Edit order"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    
                    {!nextAction.disabled && (
                      <button 
                        onClick={() => handleStatusUpdate(order.order_id, order.status)}
                        className={styles.statusButton}
                        title={nextAction.label}
                      >
                        {nextAction.label}
                      </button>
                    )}
                    
                    {order.status !== 'cancelled' && order.status !== 'received' && (
                      <button 
                        onClick={() => handleCancelOrder(order.order_id)}
                        className={styles.cancelButton}
                        title="Cancel order"
                      >
                        ❌ Cancel
                      </button>
                    )}
                    
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleDelete(order)}
                        className={styles.deleteButton}
                        title="Delete order"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductOrderList;
