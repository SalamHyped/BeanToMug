import React, { useState, useEffect } from 'react';
import styles from './ingredientTypeFilters.module.css';

const IngredientTypeFilters = ({ 
  currentFilters, 
  onFiltersChange, 
  onResetFilters,
  optionGroups = [],
  loading = false,
  totalCount = 0,
  filteredCount = 0,
  physicalCount = 0,
  nonPhysicalCount = 0
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
                          localFilters.is_physical !== 'all' || 
                          localFilters.option_group;

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filter & Search Ingredient Types</h3>
        <div className={styles.statsContainer}>
          <span className={styles.stat}>Total: {totalCount}</span>
          <span className={styles.stat}>Showing: {filteredCount}</span>
          <span className={styles.stat}>Physical: {physicalCount}</span>
          <span className={styles.stat}>Non-Physical: {nonPhysicalCount}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={styles.filtersRow}>
        {/* Search Input */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Search</label>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by name or option group..."
            className={styles.searchInput}
            disabled={loading}
          />
        </div>

        {/* Physical/Non-Physical Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type</label>
          <select
            value={localFilters.is_physical}
            onChange={(e) => handleFilterChange('is_physical', e.target.value)}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="all">All Types</option>
            <option value="true">Physical Only</option>
            <option value="false">Non-Physical Only</option>
          </select>
        </div>

        {/* Option Group Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Option Group</label>
          <select
            value={localFilters.option_group}
            onChange={(e) => handleFilterChange('option_group', e.target.value)}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="">All Groups</option>
            {optionGroups.map(group => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Sort by:</span>
        <div className={styles.sortButtons}>
          {[
            { key: 'name', label: 'Name' },
            { key: 'option_group', label: 'Option Group' },
            { key: 'is_physical', label: 'Type' },
            { key: 'ingredient_count', label: 'Ingredients' }
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
            onClick={onResetFilters}
            disabled={loading}
          >
            Clear All Filters
          </button>
          <span className={styles.filterSummary}>
            {localFilters.search && `Search: "${localFilters.search}"`}
            {localFilters.is_physical !== 'all' && ` • Type: ${localFilters.is_physical === 'true' ? 'Physical' : 'Non-Physical'}`}
            {localFilters.option_group && ` • Group: ${localFilters.option_group}`}
          </span>
        </div>
      )}

      {/* Filter Info */}
      <div className={styles.filterInfo}>
        <div className={styles.filterInfoItem}>
          <strong>Physical Types:</strong> Ingredients with physical stock (e.g., Milk, Syrups)
        </div>
        <div className={styles.filterInfoItem}>
          <strong>Non-Physical Types:</strong> Configuration options (e.g., Extra Shot, No Ice)
        </div>
        <div className={styles.filterInfoItem}>
          <strong>Option Groups:</strong> How types are grouped in dish customization
        </div>
      </div>
    </div>
  );
};

export default IngredientTypeFilters;

