import React, { useState, useEffect, useRef } from 'react';
import styles from './index.module.css';

const SupplierFilters = ({ onFiltersChange, currentFilters, loading }) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'supplier_name',
    sortOrder: 'asc',
    ...currentFilters
  });
  
  const searchTimeoutRef = useRef(null);

  // Update local filters when parent filters change
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...currentFilters
    }));
  }, [currentFilters]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    
    // Debounce search input, apply others immediately
    if (field === 'search') {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        onFiltersChange(newFilters);
      }, 300);
    } else {
      onFiltersChange(newFilters);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      sortBy: 'supplier_name',
      sortOrder: 'asc'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = localFilters.search || localFilters.status !== 'all';

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="search" className={styles.filterLabel}>
            🔍 Search Suppliers
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, phone, or email..."
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
            disabled={loading}
          />
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
            <option value="all">All Suppliers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
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
            <option value="supplier_name">Name</option>
            <option value="phone_number">Phone</option>
            <option value="email">Email</option>
            <option value="created_at">Date Added</option>
            <option value="ingredient_count">Ingredient Count</option>
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

export default SupplierFilters;
