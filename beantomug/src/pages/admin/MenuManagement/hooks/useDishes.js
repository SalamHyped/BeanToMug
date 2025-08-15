import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useDishes = (filters = {}) => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all dishes
  const fetchDishes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/dishes', getApiConfig());
      
      if (response.data.success) {
        setDishes(response.data.dishes);
      } else {
        setError('Failed to fetch dishes');
      }
    } catch (err) {
      console.error('Error fetching dishes:', err);
      setError('Failed to fetch dishes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efficient filtering using useMemo to prevent recalculation
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
      // Sorting
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

  // Create new dish
  const createDish = async (dishData) => {
    try {
      setError(null);
      
      const response = await axios.post('/dishes', dishData, getApiConfig());

      if (response.data.success) {
        // Refresh the dishes list
        await fetchDishes();
        return { success: true, dish_id: response.data.dish_id };
      } else {
        setError('Failed to create dish');
        return { success: false, error: 'Failed to create dish' };
      }
    } catch (err) {
      console.error('Error creating dish:', err);
      setError('Failed to create dish. Please try again.');
      return { success: false, error: 'Failed to create dish' };
    }
  };

  // Update dish
  const updateDish = async (dishId, dishData) => {
    try {
      setError(null);
      
      const response = await axios.put(`/dishes/${dishId}`, dishData, getApiConfig());

      if (response.data.success) {
        // Refresh the dishes list
        await fetchDishes();
        return { success: true };
      } else {
        setError('Failed to update dish');
        return { success: false, error: 'Failed to update dish' };
      }
    } catch (err) {
      console.error('Error updating dish:', err);
      setError('Failed to update dish. Please try again.');
      return { success: false, error: 'Failed to update dish' };
    }
  };

  // Toggle dish status (activate/deactivate)
  const toggleDishStatus = async (dishId, currentStatus) => {
    try {
      setError(null);
      
      const response = await axios.patch(`/dishes/${dishId}/status`, {
        status: !currentStatus
      }, getApiConfig());

      if (response.data.success) {
        // Update local state immediately for better UX
        setDishes(prevDishes => 
          prevDishes.map(dish => 
            dish.item_id === dishId 
              ? { ...dish, status: !currentStatus }
              : dish
          )
        );
        return { success: true };
      } else {
        setError('Failed to update dish status');
        return { success: false, error: 'Failed to update dish status' };
      }
    } catch (err) {
      console.error('Error updating dish status:', err);
      setError('Failed to update dish status. Please try again.');
      return { success: false, error: 'Failed to update dish status' };
    }
  };

  // Delete dish
  const deleteDish = async (dishId) => {
    try {
      setError(null);
      
      const response = await axios.delete(`/dishes/${dishId}`, getApiConfig());

      if (response.data.success) {
        // Remove from local state
        setDishes(prevDishes => prevDishes.filter(dish => dish.item_id !== dishId));
        return { success: true };
      } else {
        setError('Failed to delete dish');
        return { success: false, error: 'Failed to delete dish' };
      }
    } catch (err) {
      console.error('Error deleting dish:', err);
      setError('Failed to delete dish. Please try again.');
      return { success: false, error: 'Failed to delete dish' };
    }
  };

  // Get dish by ID
  const getDishById = useCallback((dishId) => {
    return dishes.find(dish => dish.item_id === dishId);
  }, [dishes]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Initial fetch
  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  return {
    // State
    dishes,
    loading,
    error,
    
    // Actions
    fetchDishes,
    createDish,
    updateDish,
    toggleDishStatus,
    deleteDish,
    getDishById,
    clearError,
    
    // Computed - Now based on filtered dishes
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
