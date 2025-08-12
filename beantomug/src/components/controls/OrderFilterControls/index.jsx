import React from 'react';
import { Filter, Search } from 'lucide-react';
import classes from './orderFilterControls.module.css';

/**
 * Reusable Order Filter Controls Component
 * @param {Object} props - Component props
 * @param {Object} props.filtering - Filtering hook result from useOrderFiltering
 * @param {Object} props.options - Additional options
 * @returns {JSX.Element} Filter controls UI
 */
const OrderFilterControls = ({ 
    filtering, 
    options = {} 
}) => {
    const {
        timeFilter,
        setTimeFilter,
        customTimeRange,
        setCustomTimeRange,
        searchTerm,
        setSearchTerm,
        timeFilterOptions,
        filterStats,
        clearFilters,
        enableTimeFilter,
        enableSearch,
        enableCustomRange
    } = filtering;

    const {
        showStats = true,
        showClearButton = true,
        className = '',
        compact = false
    } = options;

    if (!enableTimeFilter && !enableSearch) {
        return null;
    }

    return (
        <div className={`${classes.filterControls} ${compact ? classes.compact : ''} ${className}`}>
            {/* Time Filter Section */}
            {enableTimeFilter && (
                <div className={classes.filterSection}>
                    <div className={classes.filterHeader}>
                        <Filter size={16} className={classes.filterIcon} />
                        <span>Time Filter</span>
                    </div>
                    <div className={classes.timeFilterButtons}>
                        {timeFilterOptions.map((option) => {
                            const IconComponent = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    className={`${classes.timeFilterButton} ${timeFilter === option.value ? classes.active : ''}`}
                                    onClick={() => setTimeFilter(option.value)}
                                >
                                    <IconComponent size={14} />
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Custom Time Range */}
            {enableTimeFilter && enableCustomRange && timeFilter === 'custom' && (
                <div className={classes.customTimeRange}>
                    <div className={classes.dateInputs}>
                        <div className={classes.inputGroup}>
                            <label>Start Date:</label>
                            <input
                                type="date"
                                value={customTimeRange.startDate}
                                onChange={(e) => setCustomTimeRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className={classes.dateInput}
                            />
                        </div>
                        <div className={classes.inputGroup}>
                            <label>End Date:</label>
                            <input
                                type="date"
                                value={customTimeRange.endDate}
                                onChange={(e) => setCustomTimeRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className={classes.dateInput}
                            />
                        </div>
                    </div>
                    <div className={classes.timeInputs}>
                        <div className={classes.inputGroup}>
                            <label>Start Time:</label>
                            <input
                                type="time"
                                value={customTimeRange.startTime}
                                onChange={(e) => setCustomTimeRange(prev => ({ ...prev, startTime: e.target.value }))}
                                className={classes.timeInput}
                            />
                        </div>
                        <div className={classes.inputGroup}>
                            <label>End Time:</label>
                            <input
                                type="time"
                                value={customTimeRange.endTime}
                                onChange={(e) => setCustomTimeRange(prev => ({ ...prev, endTime: e.target.value }))}
                                className={classes.timeInput}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Search Section */}
            {enableSearch && (
                <div className={classes.searchSection}>
                    <div className={classes.searchInput}>
                        <Search size={16} className={classes.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search orders, items, or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={classes.searchField}
                        />
                    </div>
                </div>
            )}

            {/* Filter Statistics and Clear Button */}
            {(showStats || showClearButton) && (
                <div className={classes.filterStats}>
                    {showStats && (
                        <>
                            <span className={classes.statItem}>
                                Total: {filterStats.total}
                            </span>
                            <span className={classes.statItem}>
                                Filtered: {filterStats.filtered}
                            </span>
                            {timeFilter !== 'all' && (
                                <span className={classes.statItem}>
                                    Time Range: {filterStats.activeTimeFilter}
                                </span>
                            )}
                        </>
                    )}
                    {showClearButton && filterStats.hasActiveFilters && (
                        <button 
                            onClick={clearFilters}
                            className={classes.clearFiltersButton}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderFilterControls;
