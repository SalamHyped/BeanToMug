import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:8801/dishes/categories', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setCategories(response.data.categories);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get category by ID
  const getCategoryById = useCallback((categoryId) => {
    return categories.find(category => category.category_id === categoryId);
  }, [categories]);

  // Get category name by ID
  const getCategoryName = useCallback((categoryId) => {
    const category = getCategoryById(categoryId);
    return category ? category.category_name : 'Unknown';
  }, [getCategoryById]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    // State
    categories,
    loading,
    error,
    
    // Actions
    fetchCategories,
    getCategoryById,
    getCategoryName,
    clearError,
    
    // Computed
    totalCategories: categories.length
  };
};

export default useCategories;
