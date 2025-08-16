import { useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';
import { useCrudOperations } from './useSharedHookUtils';

const useDishes = (filters = {}) => {
  // Use shared CRUD operations for basic functionality
  const {
    data: dishes,
    loading,
    error,
    clearError,
    fetchItems: fetchDishes,
    createItem: createDish,
    updateItem: updateDish,
    toggleItemStatus: toggleDishStatus
  } = useCrudOperations('/dishes', { 
    itemKey: 'dish',
    onSuccess: (operation, result) => {
      console.log(`Dish ${operation} successful:`, result);
    }
  });

  // Client-side filtering and sorting using shared utility
  const filteredDishes = useMemo(() => {
    if (!dishes.length) return [];
    
    return dishes.filter(dish => {
      // Search filter
      if (filters.search && !dish.item_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category && dish.category_id !== parseInt(filters.category)) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && dish.status !== parseInt(filters.status)) {
        return false;
      }
      
      // Price range filter
      if (filters.minPrice || filters.maxPrice) {
        const price = parseFloat(dish.price);
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        
        if (price < minPrice || price > maxPrice) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sorting logic
      if (!filters.sortBy || filters.sortBy === 'name') {
        const aVal = a.item_name.toLowerCase();
        const bVal = b.item_name.toLowerCase();
        return filters.sortOrder === 'asc' ? 
          aVal.localeCompare(bVal) : 
          bVal.localeCompare(aVal);
      }
      
      if (filters.sortBy === 'price') {
        const aVal = parseFloat(a.price);
        const bVal = parseFloat(b.price);
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (filters.sortBy === 'category') {
        const aVal = a.category_name || '';
        const bVal = b.category_name || '';
        return filters.sortOrder === 'asc' ? 
          aVal.localeCompare(bVal) : 
          bVal.localeCompare(aVal);
      }
      
      if (filters.sortBy === 'status') {
        const aVal = a.status ? 1 : 0;
        const bVal = b.status ? 1 : 0;
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (filters.sortBy === 'created_at') {
        const aVal = a.item_id; // Using item_id as proxy for creation order
        const bVal = b.item_id;
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, [dishes, filters]);

  // Dish-specific utility functions
  const getDishById = useCallback((dishId) => {
    return dishes.find(dish => dish.item_id === dishId);
  }, [dishes]);

  const getDishName = useCallback((dishId) => {
    const dish = getDishById(dishId);
    return dish ? dish.item_name : 'Unknown';
  }, [getDishById]);

  // Fetch single dish with full details for editing
  const fetchDishForEdit = useCallback(async (dishId) => {
    try {
      const response = await axios.get(`${getApiConfig().baseURL}/dishes/${dishId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        return { success: true, dish: response.data.dish };
      } else {
        return { success: false, error: 'Failed to fetch dish details' };
      }
    } catch (err) {
      console.error('Error fetching dish for edit:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch dish details. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  return {
    // State (from shared hook)
    dishes,
    loading,
    error,
    
    // Actions (from shared hook + custom)
    fetchDishes,
    createDish,
    updateDish,
    toggleDishStatus,
    fetchDishForEdit,
    getDishById,
    getDishName,
    clearError,
    
    // Computed - Filtered data
    filteredDishes,
    totalDishes: dishes.length,
    activeDishes: dishes.filter(dish => dish.status).length,
    inactiveDishes: dishes.filter(dish => !dish.status).length,
    
    // Filtered counts
    filteredCount: filteredDishes.length,
    filteredActiveCount: filteredDishes.filter(dish => dish.status).length,
    filteredInactiveCount: filteredDishes.filter(dish => !dish.status).length
  };
};

export default useDishes;