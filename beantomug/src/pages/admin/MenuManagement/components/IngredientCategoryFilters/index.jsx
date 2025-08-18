import React, { useState, useEffect } from 'react';
import styles from './ingredientCategoryFilters.module.css';

const IngredientCategoryFilters = ({ 
  currentFilters, 
  onFiltersChange, 
  onResetFilters,
  optionGroups = [],
  loading = false,
  totalCount = 0,
  filteredCount = 0,
  physicalCount = 0,
  averageIngredients = 0
}) => {
  const [localFilters, setLocalFilters] = useState(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (sortBy) => {
    const newSortOrder = localFilters.sortBy === sortBy && localFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...localFilters, sortBy, sortOrder: newSortOrder };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = localFilters.search || localFilters.type_option_group;

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filter & Search Categories</h3>
        <div className={styles.statsContainer}>
          <span className={styles.stat}>Total: {totalCount}</span>
          <span className={styles.stat}>Showing: {filteredCount}</span>
          <span className={styles.stat}>Physical: {physicalCount}</span>
          <span className={styles.stat}>Avg Ingredients: {averageIngredients.toFixed(1)}</span>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Search</label>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by category name..."
            className={styles.searchInput}
            disabled={loading}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Option Group</label>
          <select
            value={localFilters.type_option_group}
            onChange={(e) => handleFilterChange('type_option_group', e.target.value)}
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

      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Sort by:</span>
        <div className={styles.sortButtons}>
          {[
            { key: 'category_name', label: 'Name' },
            { key: 'type_name', label: 'Type' },
            { key: 'type_option_group', label: 'Option Group' },
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
            {localFilters.type_option_group && ` • Group: ${localFilters.type_option_group}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default IngredientCategoryFilters;

