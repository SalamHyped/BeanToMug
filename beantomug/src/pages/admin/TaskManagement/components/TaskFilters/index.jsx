import React from 'react';
import styles from './index.module.css';

const TaskFilters = ({ filters, onFiltersChange, onRefresh, staffUsers = [], userRole = 'admin' }) => {

  const handleFilterChange = (field, value) => {
    onFiltersChange(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get display name with fallback
  const getDisplayName = (user) => {
    if (!user) return 'Unknown';
    
    const fullName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`.trim()
      : '';
    
    if (fullName) return fullName;
    if (user.username) return user.username;
    return `User ${user.id}`;
  };

  const clearFilters = () => {
    onFiltersChange({
      status: '',
      priority: '',
      assignedTo: '',
      search: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filter Tasks</h3>
        <div className={styles.filtersActions}>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={styles.clearButton}
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={onRefresh}
            className={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className={styles.filtersGrid}>
        {/* Search */}
        <div className={styles.filterGroup}>
          <label htmlFor="search">Search</label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by task title..."
            className={styles.filterInput}
          />
        </div>

        {/* Status */}
        <div className={styles.filterGroup}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority */}
        <div className={styles.filterGroup}>
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Assigned To - Admin only */}
        {userRole === 'admin' && (
          <div className={styles.filterGroup}>
            <label htmlFor="assignedTo">Assigned To</label>
            <select
              id="assignedTo"
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Staff</option>
              {staffUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {getDisplayName(user)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Active filters:</span>
          <div className={styles.activeFiltersList}>
            {filters.search && (
              <span className={styles.activeFilter}>
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className={styles.removeFilter}
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className={styles.activeFilter}>
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className={styles.removeFilter}
                >
                  ×
                </button>
              </span>
            )}
            {filters.priority && (
              <span className={styles.activeFilter}>
                Priority: {filters.priority}
                <button
                  onClick={() => handleFilterChange('priority', '')}
                  className={styles.removeFilter}
                >
                  ×
                </button>
              </span>
            )}
            {filters.assignedTo && (
              <span className={styles.activeFilter}>
                Assigned: {getDisplayName(staffUsers.find(u => u.id.toString() === filters.assignedTo))}
                <button
                  onClick={() => handleFilterChange('assignedTo', '')}
                  className={styles.removeFilter}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
