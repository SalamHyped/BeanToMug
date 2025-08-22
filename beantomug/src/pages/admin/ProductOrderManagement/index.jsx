import React, { useState } from 'react';
import styles from './index.module.css';
import ProductOrderList from './components/ProductOrderList';
import ProductOrderForm from './components/ProductOrderForm';
import ProductOrderFilters from './components/ProductOrderFilters';
import ProductOrderEditModal from './components/ProductOrderEditModal';
import ProductOrderDetailModal from './components/ProductOrderDetailModal';
import { useProductOrders } from './hooks';

const ProductOrderManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add'
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    supplier_id: '',
    status: 'all',
    date_from: '',
    date_to: '',
    sortBy: 'order_start_date',
    sortOrder: 'desc'
  });
  
  // Use the product orders hook with filters for better state management
  const { 
    fetchProductOrders, 
    filteredOrders, 
    loading, 
    error, 
    filteredCount, 
    orderStatistics,
    updateOrderStatus,
    deleteProductOrder
  } = useProductOrders(filters);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'list') {
      setEditingOrderId(null);
      setIsEditModalOpen(false);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrderId(order.order_id);
    setIsEditModalOpen(true);
  };

  const handleViewOrder = (order) => {
    setViewingOrderId(order.order_id);
    setIsDetailModalOpen(true);
  };

  const handleOrderCreated = async () => {
    // Refresh the order list and switch back to list view
    await fetchProductOrders();
    setActiveView('list');
  };

  const handleCancel = () => {
    setActiveView('list');
    setEditingOrderId(null);
    setIsEditModalOpen(false);
  };

  const handleOrderUpdated = async () => {
    // Refresh the order list and close modal
    await fetchProductOrders();
    setEditingOrderId(null);
    setIsEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditingOrderId(null);
    setIsEditModalOpen(false);
  };

  const handleCloseDetailModal = () => {
    setViewingOrderId(null);
    setIsDetailModalOpen(false);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Filters are automatically applied through the useProductOrders hook
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Product Order Management</h1>
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewButton} ${activeView === 'list' ? styles.active : ''}`}
            onClick={() => handleViewChange('list')}
          >
            📋 View Orders
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'add' ? styles.active : ''}`}
            onClick={() => handleViewChange('add')}
          >
            ➕ Create New Order
          </button>
        </div>
      </div>

      {/* Order Statistics Summary */}
      {activeView === 'list' && orderStatistics && (
        <div className={styles.statisticsBar}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Orders</span>
            <span className={styles.statValue}>{orderStatistics.total_orders}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending</span>
            <span className={`${styles.statValue} ${styles.pending}`}>{orderStatistics.pending_orders}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Shipped</span>
            <span className={`${styles.statValue} ${styles.shipped}`}>{orderStatistics.shipped_orders}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Received</span>
            <span className={`${styles.statValue} ${styles.received}`}>{orderStatistics.received_orders}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Value</span>
            <span className={styles.statValue}>${orderStatistics.total_value?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {activeView === 'list' && (
          <div className={styles.listView}>
            <ProductOrderFilters 
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
              loading={loading}
            />
            <ProductOrderList 
              onEditOrder={handleEditOrder}
              onViewOrder={handleViewOrder}
              orders={filteredOrders}
              loading={loading}
              error={error}
              filteredCount={filteredCount}
              onStatusUpdate={updateOrderStatus}
              onOrderDelete={deleteProductOrder}
            />
          </div>
        )}

        {activeView === 'add' && (
          <div className={styles.addView}>
            <ProductOrderForm 
              onOrderCreated={handleOrderCreated}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Edit Modal */}
        <ProductOrderEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          orderId={editingOrderId}
          onOrderUpdated={handleOrderUpdated}
        />

        {/* Detail View Modal */}
        <ProductOrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          orderId={viewingOrderId}
        />
      </div>
    </div>
  );
};

export default ProductOrderManagement;
