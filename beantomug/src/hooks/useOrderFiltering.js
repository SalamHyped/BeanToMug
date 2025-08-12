import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Calendar, Filter } from 'lucide-react';

/**
 * Custom hook for order filtering functionality
 * @param {Array} orders - Array of orders to filter
 * @param {Object} options - Configuration options
 * @returns {Object} Filtering state and functions
 */
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

    // Get time range based on filter
    const getTimeRange = useCallback((filter) => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        switch (filter) {
            case 'today':
                return {
                    startDate: startOfDay.toISOString(),
                    endDate: endOfDay.toISOString()
                };
            case 'yesterday':
                const yesterday = new Date(startOfDay);
                yesterday.setDate(yesterday.getDate() - 1);
                const endOfYesterday = new Date(yesterday);
                endOfYesterday.setHours(23, 59, 59);
                return {
                    startDate: yesterday.toISOString(),
                    endDate: endOfYesterday.toISOString()
                };
            case 'week':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                return {
                    startDate: startOfWeek.toISOString(),
                    endDate: endOfDay.toISOString()
                };
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfDay.toISOString()
                };
            case 'custom':
                if (customTimeRange.startDate && customTimeRange.endDate) {
                    const start = new Date(customTimeRange.startDate);
                    const end = new Date(customTimeRange.endDate);
                    
                    // Add time if specified
                    if (customTimeRange.startTime) {
                        const [hours, minutes] = customTimeRange.startTime.split(':');
                        start.setHours(parseInt(hours), parseInt(minutes), 0);
                    }
                    if (customTimeRange.endTime) {
                        const [hours, minutes] = customTimeRange.endTime.split(':');
                        end.setHours(parseInt(hours), parseInt(minutes), 59);
                    }
                    
                    return {
                        startDate: start.toISOString(),
                        endDate: end.toISOString()
                    };
                }
                return null;
            default:
                return null;
        }
    }, [customTimeRange]);

    // Filter orders based on time and search
    const filteredOrders = useMemo(() => {
        let filtered = orders;

        // Apply time filter
        if (enableTimeFilter && timeFilter !== 'all') {
            const timeRange = getTimeRange(timeFilter);
            if (timeRange) {
                filtered = filtered.filter(order => {
                    const orderDate = new Date(order.created_at);
                    return orderDate >= new Date(timeRange.startDate) && 
                           orderDate <= new Date(timeRange.endDate);
                });
            }
        }

        // Apply search filter
        if (enableSearch && debouncedSearchTerm.trim()) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(order => {
                return order.order_id.toString().includes(searchLower) ||
                       order.items?.some(item => 
                           item.item_name?.toLowerCase().includes(searchLower)
                       ) ||
                       order.status?.toLowerCase().includes(searchLower) ||
                       order.order_type?.toLowerCase().includes(searchLower);
            });
        }

        return filtered;
    }, [orders, timeFilter, debouncedSearchTerm, getTimeRange, enableTimeFilter, enableSearch]);

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

    // Get API request parameters for backend filtering
    const getApiParams = useCallback(() => {
        const params = {};
        
        if (timeFilter !== 'all') {
            const timeRange = getTimeRange(timeFilter);
            if (timeRange) {
                params.startDate = timeRange.startDate.split('T')[0]; // Date only
                params.endDate = timeRange.endDate.split('T')[0]; // Date only
            }
        }
        
        if (debouncedSearchTerm.trim()) {
            params.searchTerm = debouncedSearchTerm;
        }
        
        return params;
    }, [timeFilter, debouncedSearchTerm, getTimeRange]);

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
