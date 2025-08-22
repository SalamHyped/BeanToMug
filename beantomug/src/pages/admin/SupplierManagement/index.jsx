import React, { useState } from 'react';
import styles from './index.module.css';
import SupplierList from './components/SupplierList';
import SupplierForm from './components/SupplierForm';
import SupplierFilters from './components/SupplierFilters';
import SupplierEditModal from './components/SupplierEditModal';
import { useSuppliers } from './hooks';

const SupplierManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add'
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'supplier_name',
    sortOrder: 'asc'
  });
  
  // Use the suppliers hook with filters for better state management
  const { 
    fetchSuppliers, 
    filteredSuppliers, 
    loading, 
    error, 
    filteredCount, 
    filteredActiveCount, 
    filteredInactiveCount 
  } = useSuppliers(filters);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'list') {
      setEditingSupplierId(null);
      setIsEditModalOpen(false);
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplierId(supplier.supplier_id);
    setIsEditModalOpen(true);
  };

  const handleSupplierCreated = async () => {
    // Refresh the supplier list and switch back to list view
    await fetchSuppliers();
    setActiveView('list');
  };

  const handleCancel = () => {
    setActiveView('list');
    setEditingSupplierId(null);
    setIsEditModalOpen(false);
  };

  const handleSupplierUpdated = async () => {
    // Refresh the supplier list and close modal
    await fetchSuppliers();
    setEditingSupplierId(null);
    setIsEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditingSupplierId(null);
    setIsEditModalOpen(false);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Filters are automatically applied through the useSuppliers hook
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Supplier Management</h1>
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewButton} ${activeView === 'list' ? styles.active : ''}`}
            onClick={() => handleViewChange('list')}
          >
            📋 View Suppliers
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'add' ? styles.active : ''}`}
            onClick={() => handleViewChange('add')}
          >
            ➕ Add New Supplier
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeView === 'list' && (
          <div className={styles.listView}>
            <SupplierFilters 
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
              loading={loading}
            />
            <SupplierList 
              onEditSupplier={handleEditSupplier}
              suppliers={filteredSuppliers}
              loading={loading}
              error={error}
              filteredCount={filteredCount}
              filteredActiveCount={filteredActiveCount}
              filteredInactiveCount={filteredInactiveCount}
            />
          </div>
        )}

        {activeView === 'add' && (
          <div className={styles.addView}>
            <SupplierForm 
              onSupplierCreated={handleSupplierCreated}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Edit Modal */}
        <SupplierEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          supplierId={editingSupplierId}
          onSupplierUpdated={handleSupplierUpdated}
        />
      </div>
    </div>
  );
};

export default SupplierManagement;
