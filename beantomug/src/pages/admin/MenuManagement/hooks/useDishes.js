import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useDishes = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all dishes
  const fetchDishes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:8801/dishes', {
        withCredentials: true
      });
      
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

  // Create new dish
  const createDish = async (dishData) => {
    try {
      setError(null);
      
      const response = await axios.post('http://localhost:8801/dishes', dishData, {
        withCredentials: true
      });

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
      
      const response = await axios.put(`http://localhost:8801/dishes/${dishId}`, dishData, {
        withCredentials: true
      });

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
      
      const response = await axios.patch(`http://localhost:8801/dishes/${dishId}/status`, {
        status: !currentStatus
      }, {
        withCredentials: true
      });

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
      
      const response = await axios.delete(`http://localhost:8801/dishes/${dishId}`, {
        withCredentials: true
      });

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
    
    // Computed
    totalDishes: dishes.length,
    activeDishes: dishes.filter(dish => dish.status).length,
    inactiveDishes: dishes.filter(dish => !dish.status).length
  };
};

export default useDishes;
