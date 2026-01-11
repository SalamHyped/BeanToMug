import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Calendar, Filter } from 'lucide-react';

/**
 * Custom hook for order filtering functionality
 * @param {Array} orders - Array of orders to filter
 * @param {Object} options - Configuration options
 * @returns {Object} Filtering state and functions
 */
// Helper to format a Date object as YYYY-MM-DD HH:MM:SS (local time)
function formatDateToMySQL(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return (
        date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + ' ' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds())
    );
}

// Helper to convert local datetime string to UTC datetime string for MySQL
// Input: 'YYYY-MM-DD HH:MM:SS' (local time)
// Output: 'YYYY-MM-DD HH:MM:SS' (UTC time)
// Helper to get timezone offset in format '+02:00' or '-05:00'
function getTimezoneOffset() {
    const now = new Date();
    // getTimezoneOffset returns offset in minutes, negative for ahead of UTC
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    return `${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
}

export const useOrderFiltering = (orders = [], options = {}) => {
    const {
        enableTimeFilter = true,
        enableSearch = true,
        enableCustomRange = true,
        debounceDelay = 300,
        defaultTimeFilter = 'all'
    } = options;

    // Time filtering states
    const [timeFilter, setTimeFilter] = useState(defaultTimeFilter);
    const [customTimeRange, setCustomTimeRange] = useState({
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
    });
    
    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Time filter options
    const timeFilterOptions = useMemo(() => [
        { value: 'all', label: 'All Time', icon: Clock },
        { value: 'today', label: 'Today', icon: Calendar },
        { value: 'yesterday', label: 'Yesterday', icon: Calendar },
        { value: 'week', label: 'This Week', icon: Calendar },
        { value: 'month', label: 'This Month', icon: Calendar },
        ...(enableCustomRange ? [{ value: 'custom', label: 'Custom Range', icon: Filter }] : [])
    ], [enableCustomRange]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, debounceDelay);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceDelay]);

    // Get time range for custom filter
    const getTimeRange = useCallback((filter) => {
        if (filter !== 'custom') {
            return null;
        }
        

        // ALLOW open-ended range (just start or just end)
        if (customTimeRange.startDate || customTimeRange.endDate) {
            let start = null;
            let end = null;

            // Parse dates in local time (not UTC)
            if (customTimeRange.startDate) {
                const [year, month, day] = customTimeRange.startDate.split('-').map(Number);
                start = new Date(year, month - 1, day);
                
                // Add time if specified
                if (customTimeRange.startTime && customTimeRange.startTime.trim()) {
                    const [hours, minutes] = customTimeRange.startTime.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        start.setHours(hours, minutes, 0, 0);
                    } else {
                        start.setHours(0, 0, 0, 0);
                    }
                } else {
                    start.setHours(0, 0, 0, 0);
                }
            } else {
                // Default to very early date if no start date
                start = new Date(1990, 0, 1, 0, 0, 0);
            }

            if (customTimeRange.endDate) {
                const [year, month, day] = customTimeRange.endDate.split('-').map(Number);
                end = new Date(year, month - 1, day);
                
                // Add time if specified
                if (customTimeRange.endTime && customTimeRange.endTime.trim()) {
                    const [hours, minutes] = customTimeRange.endTime.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        end.setHours(hours, minutes, 59, 999);
                    } else {
                        end.setHours(23, 59, 59, 999);
                    }
                } else {
                    end.setHours(23, 59, 59, 999);
                }
            } else {
                // If no end date provided - set to far future (open-ended range)
                end = new Date(2099, 11, 31, 23, 59, 59);
            }

            return {
                startDate: formatDateToMySQL(start),
                endDate: formatDateToMySQL(end)
            };
        }
        return null;
    }, [customTimeRange]);

    // Since filtering is done by the backend, filteredOrders is just the input orders.
    const filteredOrders = orders;

    // Clear filters function
    const clearFilters = useCallback(() => {
        setTimeFilter(defaultTimeFilter);
        setSearchTerm('');
        setCustomTimeRange({
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: ''
        });
    }, [defaultTimeFilter]);

    // Update custom time range
    const updateCustomTimeRange = useCallback((field, value) => {
        setCustomTimeRange(prev => ({ ...prev, [field]: value }));
    }, []);

    // Get filter statistics
    const filterStats = useMemo(() => ({
        total: orders.length,
        filtered: filteredOrders.length,
        hasActiveFilters: timeFilter !== 'all' || searchTerm.trim(),
        activeTimeFilter: timeFilterOptions.find(opt => opt.value === timeFilter)?.label
    }), [orders.length, filteredOrders.length, timeFilter, searchTerm, timeFilterOptions]);

    // Get API parameters for backend fetching
    const getApiParams = useCallback(() => {
        const params = {};

        if (enableSearch && debouncedSearchTerm.trim()) {
            params.searchTerm = debouncedSearchTerm.trim();
        }

        if (enableTimeFilter) {
            params.dateFilter = timeFilter;
            if (timeFilter === 'custom') {
                const timeRange = getTimeRange('custom');
                if (timeRange) {
                    // Check if times are included
                    const hasStartTime = customTimeRange.startTime && customTimeRange.startTime.trim();
                    const hasEndTime = customTimeRange.endTime && customTimeRange.endTime.trim();
                    
                    if (hasStartTime || hasEndTime) {
                        // Send local time directly - backend will handle conversion
                        // This ensures comparison happens in user's timezone context
                        params.startDate = timeRange.startDate;
                        // Only send endDate if user actually provided an end date
                        if (customTimeRange.endDate && customTimeRange.endDate.trim()) {
                            params.endDate = timeRange.endDate;
                        }
                        params.timezone = getTimezoneOffset();
                    } else {
                        // Date-only - send date part only (YYYY-MM-DD format)
                        // No time conversion needed for date-only comparison
                        params.startDate = timeRange.startDate.split(' ')[0]; // Extract date part
                        params.endDate = timeRange.endDate.split(' ')[0]; // Extract date part
                        // No timezone needed for date-only
                    }
                }
            }
        }

        // Always include the timezone
        if (!params.timezone) {
            params.timezone = getTimezoneOffset();
        }

        return params;
    }, [timeFilter, debouncedSearchTerm, getTimeRange, enableTimeFilter, enableSearch]);

    return {
        // State
        timeFilter,
        setTimeFilter,
        customTimeRange,
        setCustomTimeRange,
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        
        // Options
        timeFilterOptions,
        
        // Computed values
        filteredOrders,
        filterStats,
        
        // Functions
        clearFilters,
        updateCustomTimeRange,
        getTimeRange,
        getApiParams,
        
        // Configuration
        enableTimeFilter,
        enableSearch,
        enableCustomRange
    };
};

export default useOrderFiltering;
