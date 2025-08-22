import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../../utils/config';
import styles from './index.module.css';

const ProductOrderFilters = ({ onFiltersChange, currentFilters, loading }) => {
  const [localFilters, setLocalFilters] = useState({
    supplier_id: '',
    status: 'all',
    date_from: '',
    date_to: '',
    sortBy: 'order_start_date',
    sortOrder: 'desc',
    ...currentFilters
  });

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  // Load suppliers for filter dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        const response = await axios.get(`${getApiConfig().baseURL}/suppliers`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setSuppliers(response.data.suppliers || []);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setSuppliersLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);

  // Update local filters when parent filters change
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...currentFilters
    }));
  }, [currentFilters]);

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    
    // Apply filters immediately (no debouncing needed for dropdowns/dates)
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      supplier_id: '',
      status: 'all',
      date_from: '',
      date_to: '',
      sortBy: 'order_start_date',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = localFilters.supplier_id || 
    localFilters.status !== 'all' || 
    localFilters.date_from || 
    localFilters.date_to;

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="supplier_id" className={styles.filterLabel}>
            🏪 Supplier
          </label>
          <select
            id="supplier_id"
            value={localFilters.supplier_id}
            onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
            className={styles.filterSelect}
            disabled={loading || suppliersLoading}
          >
            <option value="">All Suppliers</option>
            {suppliers.map(supplier => (
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="status" className={styles.filterLabel}>
            📊 Status
          </label>
          <select
            id="status"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="date_from" className={styles.filterLabel}>
            📅 From Date
          </label>
          <input
            id="date_from"
            type="date"
            value={localFilters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className={styles.dateInput}
            disabled={loading}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="date_to" className={styles.filterLabel}>
            📅 To Date
          </label>
          <input
            id="date_to"
            type="date"
            value={localFilters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className={styles.dateInput}
            disabled={loading}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sortBy" className={styles.filterLabel}>
            📋 Sort By
          </label>
          <select
            id="sortBy"
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="order_start_date">Order Date</option>
            <option value="order_end_date">Delivery Date</option>
            <option value="total_price">Total Price</option>
            <option value="status">Status</option>
            <option value="supplier_name">Supplier Name</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sortOrder" className={styles.filterLabel}>
            🔄 Order
          </label>
          <select
            id="sortOrder"
            value={localFilters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className={styles.filterGroup}>
            <button
              onClick={handleClearFilters}
              className={styles.clearButton}
              disabled={loading}
              title="Clear all filters"
            >
              🗑️ Clear Filters
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <span>Applying filters...</span>
        </div>
      )}
    </div>
  );
};

export default ProductOrderFilters;
