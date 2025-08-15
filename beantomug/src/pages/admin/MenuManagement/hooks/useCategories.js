import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/dishes/categories', getApiConfig());
      
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

  // Create new category
  const createCategory = useCallback(async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/dishes/categories', categoryData, getApiConfig());
      
      if (response.data.success) {
        // Refresh categories after creation
        await fetchCategories();
        return { success: true, category: response.data.category };
      } else {
        setError(response.data.error || 'Failed to create category');
        return { success: false, error: response.data.error || 'Failed to create category' };
      }
    } catch (err) {
      console.error('Error creating category:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create category. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  // Update existing category
  const updateCategory = useCallback(async (categoryId, categoryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`/dishes/categories/${categoryId}`, categoryData, getApiConfig());
      
      if (response.data.success) {
        // Refresh categories after update
        await fetchCategories();
        return { success: true, category: response.data.category };
      } else {
        setError(response.data.error || 'Failed to update category');
        return { success: false, error: response.data.error || 'Failed to update category' };
      }
    } catch (err) {
      console.error('Error updating category:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update category. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  // Delete category
  const deleteCategory = useCallback(async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.delete(`/dishes/categories/${categoryId}`, getApiConfig());
      
      if (response.data.success) {
        // Refresh categories after deletion
        await fetchCategories();
        return { success: true };
      } else {
        setError(response.data.error || 'Failed to delete category');
        return { success: false, error: response.data.error || 'Failed to delete category' };
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete category. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

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
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    
    // Computed
    totalCategories: categories.length
  };
};

export default useCategories;
