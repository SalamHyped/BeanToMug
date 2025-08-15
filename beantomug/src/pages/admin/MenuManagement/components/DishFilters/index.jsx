import React, { useState, useEffect, useCallback } from 'react';
import { useCategories } from '../../hooks';
import styles from './index.module.css';

const DishFilters = ({ onFiltersChange, currentFilters, loading = false }) => {
  const { categories } = useCategories();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [searchValue, setSearchValue] = useState(''); // Local search state for debouncing
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  useEffect(() => {
    // Initialize filters from props if provided
    if (currentFilters) {
      setFilters(prev => ({ ...prev, ...currentFilters }));
      setSearchValue(currentFilters.search || '');
    }
  }, [currentFilters]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== filters.search) {
        setIsApplyingFilters(true);
        handleFilterChange('search', searchValue);
        // Reset loading state after a short delay
        setTimeout(() => setIsApplyingFilters(false), 200);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchValue, filters.search]);

  const handleFilterChange = useCallback((name, value) => {
    setIsApplyingFilters(true);
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
    // Reset loading state after a short delay
    setTimeout(() => setIsApplyingFilters(false), 200);
  }, [filters, onFiltersChange]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const clearFilters = () => {
    setIsApplyingFilters(true);
    const defaultFilters = {
      search: '',
      category: '',
      status: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(defaultFilters);
    setSearchValue('');
    onFiltersChange(defaultFilters);
    // Reset loading state after a short delay
    setTimeout(() => setIsApplyingFilters(false), 200);
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filters & Sorting</h3>
        <div className={styles.headerActions}>
          {(loading || isApplyingFilters) && (
            <span className={styles.loadingIndicator}>
              {isApplyingFilters ? 'Applying filters...' : 'Loading...'}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className={styles.clearFiltersBtn}
            disabled={loading || isApplyingFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className={styles.filtersGrid}>
        {/* Search Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="search">Search Dishes</label>
          <input
            type="text"
            id="search"
            placeholder="Search by dish name..."
            value={searchValue}
            onChange={handleSearchChange}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>

        {/* Category Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={styles.selectInput}
            disabled={loading}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.selectInput}
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="priceRange">Price Range</label>
          <div className={styles.priceRangeInputs}>
            <input
              type="number"
              placeholder="Min"
              min="0"
              step="0.01"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className={styles.priceInput}
              disabled={loading}
            />
            <span className={styles.priceSeparator}>to</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              step="0.01"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className={styles.priceInput}
              disabled={loading}
            />
          </div>
        </div>

        {/* Sort By */}
        <div className={styles.filterGroup}>
          <label htmlFor="sortBy">Sort By</label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.selectInput}
            disabled={loading}
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="category">Category</option>
            <option value="status">Status</option>
            <option value="created_at">Date Created</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className={styles.filterGroup}>
          <label htmlFor="sortOrder">Sort Order</label>
          <select
            id="sortOrder"
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className={styles.selectInput}
            disabled={loading}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.values(filters).some(value => value !== '' && value !== 'all') && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Active Filters:</span>
          {filters.search && (
            <span className={styles.filterTag}>
              Search: "{filters.search}"
              <button 
                onClick={() => {
                  setSearchValue('');
                  handleFilterChange('search', '');
                }}
                className={styles.removeFilterBtn}
                disabled={loading}
              >
                ×
              </button>
            </span>
          )}
          {filters.category && (
            <span className={styles.filterTag}>
              Category: {categories.find(c => c.category_id === filters.category)?.category_name}
              <button 
                onClick={() => handleFilterChange('category', '')}
                className={styles.removeFilterBtn}
                disabled={loading}
              >
                ×
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className={styles.filterTag}>
              Status: {filters.status === '1' ? 'Active' : 'Inactive'}
              <button 
                onClick={() => handleFilterChange('status', 'all')}
                className={styles.removeFilterBtn}
                disabled={loading}
              >
                ×
              </button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className={styles.filterTag}>
              Price: {filters.minPrice ? `${filters.minPrice}` : '0'} - {filters.maxPrice ? `${filters.maxPrice}` : '∞'}
              <button 
                onClick={() => {
                  handleFilterChange('minPrice', '');
                  handleFilterChange('maxPrice', '');
                }}
                className={styles.removeFilterBtn}
                disabled={loading}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DishFilters;
