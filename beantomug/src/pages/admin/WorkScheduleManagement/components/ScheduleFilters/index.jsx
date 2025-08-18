import React from 'react';
import styles from './scheduleFilters.module.css';

const ScheduleFilters = ({ filters, shifts = [], onFilterChange, scheduleCount = 0 }) => {
  const handleFilterUpdate = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleDateRangeChange = (type, value) => {
    onFilterChange({ [type]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      user_id: '',
      shift_id: '',
      status: 'all',
      date_from: '',
      date_to: '',
      sortBy: 'schedule_date',
      sortOrder: 'asc'
    });
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>🔍 Schedule Filters</h3>
        <div className={styles.scheduleCount}>
          <span className={styles.count}>{scheduleCount}</span>
          <span className={styles.label}>schedules found</span>
        </div>
      </div>

      <div className={styles.filtersGrid}>
        {/* Search Input */}
        <div className={styles.filterGroup}>
          <label htmlFor="search" className={styles.filterLabel}>
            Search Staff
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by staff name..."
            value={filters.search || ''}
            onChange={(e) => handleFilterUpdate('search', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {/* Shift Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="shift" className={styles.filterLabel}>
            Shift
          </label>
          <select
            id="shift"
            value={filters.shift_id || ''}
            onChange={(e) => handleFilterUpdate('shift_id', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Shifts</option>
            {shifts.map(shift => (
              <option key={shift.shift_id} value={shift.shift_id}>
                {shift.shift_name} ({shift.start_time} - {shift.end_time})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="status" className={styles.filterLabel}>
            Status
          </label>
          <select
            id="status"
            value={filters.status || 'all'}
            onChange={(e) => handleFilterUpdate('status', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">📅 Scheduled</option>
            <option value="completed">✅ Completed</option>
            <option value="absent">❌ Absent</option>
            <option value="cancelled">🚫 Cancelled</option>
          </select>
        </div>

        {/* Date From */}
        <div className={styles.filterGroup}>
          <label htmlFor="dateFrom" className={styles.filterLabel}>
            From Date
          </label>
          <input
            id="dateFrom"
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleDateRangeChange('date_from', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {/* Date To */}
        <div className={styles.filterGroup}>
          <label htmlFor="dateTo" className={styles.filterLabel}>
            To Date
          </label>
          <input
            id="dateTo"
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleDateRangeChange('date_to', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {/* Sort By */}
        <div className={styles.filterGroup}>
          <label htmlFor="sortBy" className={styles.filterLabel}>
            Sort By
          </label>
          <select
            id="sortBy"
            value={filters.sortBy || 'schedule_date'}
            onChange={(e) => handleFilterUpdate('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="schedule_date">Date</option>
            <option value="username">Staff Name</option>
            <option value="shift_name">Shift</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className={styles.filterGroup}>
          <label htmlFor="sortOrder" className={styles.filterLabel}>
            Order
          </label>
          <select
            id="sortOrder"
            value={filters.sortOrder || 'asc'}
            onChange={(e) => handleFilterUpdate('sortOrder', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="asc">↑ Ascending</option>
            <option value="desc">↓ Descending</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>&nbsp;</label>
          <button
            onClick={clearFilters}
            className={styles.clearButton}
            type="button"
          >
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className={styles.quickFilters}>
        <span className={styles.quickFiltersLabel}>Quick filters:</span>
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onFilterChange({ date_from: today, date_to: today });
          }}
          className={styles.quickFilterButton}
        >
          Today
        </button>
        <button
          onClick={() => {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            onFilterChange({ 
              date_from: weekStart.toISOString().split('T')[0],
              date_to: weekEnd.toISOString().split('T')[0]
            });
          }}
          className={styles.quickFilterButton}
        >
          This Week
        </button>
        <button
          onClick={() => {
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            onFilterChange({ 
              date_from: monthStart.toISOString().split('T')[0],
              date_to: monthEnd.toISOString().split('T')[0]
            });
          }}
          className={styles.quickFilterButton}
        >
          This Month
        </button>
      </div>
    </div>
  );
};

export default ScheduleFilters;
