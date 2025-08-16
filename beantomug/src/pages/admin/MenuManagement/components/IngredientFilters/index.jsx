import React, { useState, useEffect } from 'react';
import styles from './ingredientFilters.module.css';

const IngredientFilters = ({ 
  currentFilters, 
  onFiltersChange, 
  loading, 
  categoryNames = [],
  typeNames = [],
  totalCount = 0,
  activeCount = 0,
  inactiveCount = 0,
  lowStockCount = 0
}) => {
  const [localFilters, setLocalFilters] = useState(currentFilters);

  // Update local filters when current filters change (e.g., from reset)
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle sort changes
  const handleSortChange = (sortBy) => {
    const newSortOrder = localFilters.sortBy === sortBy && localFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...localFilters, sortBy, sortOrder: newSortOrder };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = localFilters.search || 
                          localFilters.category || 
                          localFilters.type || 
                          localFilters.status !== 'all';

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filter & Search Ingredients</h3>
        <div className={styles.statsContainer}>
          <span className={styles.stat}>Total: {totalCount}</span>
          <span className={styles.stat}>Active: {activeCount}</span>
          <span className={styles.stat}>Inactive: {inactiveCount}</span>
          <span className={styles.stat}>Low Stock: {lowStockCount}</span>
        </div>
      </div>

      <div className={styles.filtersRow}>
        {/* Search Input */}
        <div className={styles.filterGroup}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name or brand..."
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>

        {/* Category Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            disabled={loading}
          >
            <option value="">All Categories</option>
            {categoryNames.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={localFilters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            disabled={loading}
          >
            <option value="">All Types</option>
            {typeNames.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>

        {/* Items per page */}
        <div className={styles.filterGroup}>
          <label htmlFor="limit">Per Page</label>
          <select
            id="limit"
            value={localFilters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Sort by:</span>
        <div className={styles.sortButtons}>
          {[
            { key: 'ingredient_name', label: 'Name' },
            { key: 'price', label: 'Price' },
            { key: 'brand', label: 'Brand' },
            { key: 'quantity_in_stock', label: 'Stock' },
            { key: 'expiration', label: 'Expiration' },
            { key: 'status', label: 'Status' }
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.sortButton} ${
                localFilters.sortBy === key ? styles.activeSortButton : ''
              }`}
              onClick={() => handleSortChange(key)}
              disabled={loading}
            >
              {label}
              {localFilters.sortBy === key && (
                <span className={styles.sortDirection}>
                  {localFilters.sortOrder === 'asc' ? ' ↑' : ' ↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className={styles.clearFiltersRow}>
          <button
            type="button"
            className={styles.clearFiltersButton}
            onClick={() => onFiltersChange({
              search: '',
              category: '',
              type: '',
              status: 'all',
              sortBy: 'ingredient_name',
              sortOrder: 'asc',
              page: 1,
              limit: localFilters.limit
            })}
            disabled={loading}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default IngredientFilters;
