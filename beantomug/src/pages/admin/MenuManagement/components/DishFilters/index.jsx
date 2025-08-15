import React, { useState, useEffect } from 'react';
import { useCategories } from '../../hooks';
import styles from './index.module.css';

const DishFilters = ({ onFiltersChange, currentFilters }) => {
  const { categories } = useCategories();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'all',
    priceRange: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  useEffect(() => {
    // Initialize filters from props if provided
    if (currentFilters) {
      setFilters(prev => ({ ...prev, ...currentFilters }));
    }
  }, [currentFilters]);

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      category: '',
      status: 'all',
      priceRange: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filters & Sorting</h3>
        <button 
          onClick={clearFilters}
          className={styles.clearFiltersBtn}
        >
          Clear All
        </button>
      </div>

      <div className={styles.filtersGrid}>
        {/* Search Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="search">Search Dishes</label>
          <input
            type="text"
            id="search"
            placeholder="Search by dish name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
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
          >
            <option value="all">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="priceRange">Price Range</label>
          <select
            id="priceRange"
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className={styles.selectInput}
          >
            <option value="all">All Prices</option>
            <option value="0-5">$0 - $5</option>
            <option value="5-10">$5 - $10</option>
            <option value="10-15">$10 - $15</option>
            <option value="15-20">$15 - $20</option>
            <option value="20+">$20+</option>
          </select>
        </div>

        {/* Sort By */}
        <div className={styles.filterGroup}>
          <label htmlFor="sortBy">Sort By</label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.selectInput}
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
                onClick={() => handleFilterChange('search', '')}
                className={styles.removeFilterBtn}
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
              >
                ×
              </button>
            </span>
          )}
          {filters.priceRange !== 'all' && (
            <span className={styles.filterTag}>
              Price: {filters.priceRange}
              <button 
                onClick={() => handleFilterChange('priceRange', 'all')}
                className={styles.removeFilterBtn}
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
