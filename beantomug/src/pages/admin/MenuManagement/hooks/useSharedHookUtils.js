import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

/**
 * Shared utilities for menu management hooks
 * Reduces redundancy across useDishes, useCategories, useIngredients, etc.
 */

/**
 * Generic API state management hook
 * @param {any} initialData - Initial state value
 * @returns {Object} - { data, loading, error, setData, setLoading, setError, clearError }
 */
export const useApiState = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    setData,
    setLoading,
    setError,
    clearError
  };
};

/**
 * Generic API call wrapper with consistent error handling
 * @param {Function} apiCall - The API call function
 * @param {Object} options - { setLoading, setError, successMessage, errorMessage }
 * @returns {Function} - Wrapped API call function
 */
export const useApiCall = (apiCall, { setLoading, setError, successMessage, errorMessage } = {}) => {
  return useCallback(async (...args) => {
    try {
      if (setLoading) setLoading(true);
      if (setError) setError(null);

      const result = await apiCall(...args);
      
      if (successMessage && result.success) {
        console.log(successMessage, result);
      }
      
      return result;
    } catch (err) {
      console.error('API call error:', err);
      const message = err.response?.data?.message || errorMessage || 'Operation failed';
      if (setError) setError(message);
      return { success: false, error: message };
    } finally {
      if (setLoading) setLoading(false);
    }
  }, [apiCall, setLoading, setError, successMessage, errorMessage]);
};

/**
 * Generic CRUD operations hook
 * @param {string} endpoint - Base API endpoint (e.g., '/dishes', '/categories')
 * @param {Object} options - { itemKey, onSuccess }
 * @returns {Object} - CRUD functions
 */
export const useCrudOperations = (endpoint, { itemKey = 'item', onSuccess } = {}) => {
  const { data, loading, error, setData, setLoading, setError, clearError } = useApiState();

  // Generic fetch function
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(endpoint, getApiConfig());
      
      if (response.data.success) {
        // Handle different response structures
        const dataKey = itemKey === 'dish' ? 'dishes' : 
                       itemKey === 'category' ? 'categories' :
                       itemKey === 'ingredient' ? 'ingredients' :
                       itemKey === 'type' ? 'types' :
                       itemKey === 'effect' ? 'effects' :
                       itemKey + 's';
        setData(response.data[dataKey] || response.data?.data || []);
      } else {
        setError(`Failed to fetch ${itemKey}s`);
      }
    } catch (err) {
      console.error(`Error fetching ${itemKey}s:`, err);
      setError(`Failed to fetch ${itemKey}s. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, itemKey, setData, setLoading, setError]);

  // Generic create function
  const createItem = useCallback(async (itemData) => {
    try {
      setError(null);
      
      const response = await axios.post(endpoint, itemData, getApiConfig());
      
      if (response.data.success) {
        await fetchItems(); // Refresh list
        if (onSuccess) onSuccess('create', response.data);
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.data.message || response.data.error || `Failed to create ${itemKey}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error(`Error creating ${itemKey}:`, err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || `Failed to create ${itemKey}. Please try again.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [endpoint, itemKey, fetchItems, setError, onSuccess]);

  // Generic update function
  const updateItem = useCallback(async (id, itemData) => {
    try {
      setError(null);
      
      const response = await axios.put(`${endpoint}/${id}`, itemData, getApiConfig());
      
      if (response.data.success) {
        await fetchItems(); // Refresh list
        if (onSuccess) onSuccess('update', response.data);
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.data.message || `Failed to update ${itemKey}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error(`Error updating ${itemKey}:`, err);
      const errorMsg = err.response?.data?.message || `Failed to update ${itemKey}. Please try again.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [endpoint, itemKey, fetchItems, setError, onSuccess]);

  // Generic delete function
  const deleteItem = useCallback(async (id) => {
    try {
      setError(null);
      
      const response = await axios.delete(`${endpoint}/${id}`, getApiConfig());
      
      if (response.data.success) {
        await fetchItems(); // Refresh list
        if (onSuccess) onSuccess('delete', response.data);
        return { success: true };
      } else {
        const errorMsg = response.data.message || response.data.error || `Failed to delete ${itemKey}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error(`Error deleting ${itemKey}:`, err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || `Failed to delete ${itemKey}. Please try again.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [endpoint, itemKey, fetchItems, setError, onSuccess]);

  // Generic toggle status function
  const toggleItemStatus = useCallback(async (id, currentStatus) => {
    try {
      setError(null);
      
      const response = await axios.patch(`${endpoint}/${id}/status`, {
        status: !currentStatus
      }, getApiConfig());
      
      if (response.data.success) {
        // Update local state immediately for better UX
        setData(prevData => 
          prevData.map(item => {
            const matchesId = item[itemKey + '_id'] === id || item.id === id || item.item_id === id;
            return matchesId ? { ...item, status: !currentStatus } : item;
          })
        );
        if (onSuccess) onSuccess('toggleStatus', response.data);
        return { success: true };
      } else {
        const errorMsg = response.data.message || `Failed to update ${itemKey} status`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error(`Error updating ${itemKey} status:`, err);
      const errorMsg = err.response?.data?.message || `Failed to update ${itemKey} status. Please try again.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [endpoint, itemKey, setData, setError, onSuccess]);

  return {
    // State
    data,
    loading,
    error,
    clearError,
    
    // Actions
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleItemStatus,
    
    // Manual state setters for advanced use cases
    setData,
    setLoading,
    setError
  };
};

/**
 * Generic filtering and sorting hook
 * @param {Array} items - Array to filter
 * @param {Object} filters - Filter criteria
 * @param {Object} sortConfig - Sort configuration
 * @returns {Array} - Filtered and sorted items
 */
export const useFilterSort = (items = [], filters = {}, sortConfig = {}) => {
  return useMemo(() => {
    if (!items.length) return [];
    
    let filtered = items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchField = sortConfig.searchField || 'name';
        const searchValue = item[searchField] || '';
        if (!searchValue.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status !== undefined && filters.status !== 'all') {
        if (item.status !== parseInt(filters.status)) {
          return false;
        }
      }
      
      // Category filter
      if (filters.category) {
        const categoryField = sortConfig.categoryField || 'category_id';
        if (item[categoryField] !== parseInt(filters.category)) {
          return false;
        }
      }
      
      // Price range filter
      if (filters.minPrice || filters.maxPrice) {
        const price = parseFloat(item.price || 0);
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        
        if (price < minPrice || price > maxPrice) {
          return false;
        }
      }
      
      return true;
    });
    
    // Apply sorting
    if (sortConfig.sortBy) {
      filtered.sort((a, b) => {
        const field = sortConfig.sortBy;
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        
        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
          const aStr = aVal.toString().toLowerCase();
          const bStr = bVal.toString().toLowerCase();
          return sortConfig.sortOrder === 'asc' ? 
            aStr.localeCompare(bStr) : 
            bStr.localeCompare(aStr);
        }
      });
    }
    
    return filtered;
  }, [items, filters, sortConfig]);
};

/**
 * Selection management hook for forms
 * @param {Array} initialItems - Initial selected items
 * @returns {Object} - Selection management functions
 */
export const useSelection = (initialItems = []) => {
  const [selectedItems, setSelectedItems] = useState(initialItems);

  const addItem = useCallback((newItem) => {
    setSelectedItems(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setSelectedItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const removeItem = useCallback((index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearItems = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const getValidItems = useCallback((validationFn) => {
    return validationFn ? selectedItems.filter(validationFn) : selectedItems;
  }, [selectedItems]);

  return {
    selectedItems,
    setSelectedItems,
    addItem,
    updateItem,
    removeItem,
    clearItems,
    getValidItems
  };
};

export default {
  useApiState,
  useApiCall,
  useCrudOperations,
  useFilterSort,
  useSelection
};
