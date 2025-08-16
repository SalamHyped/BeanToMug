import { useEffect, useCallback } from 'react';
import { useCrudOperations } from './useSharedHookUtils';

const useCategories = () => {
  // Use shared CRUD operations - eliminates 100+ lines of boilerplate
  const {
    data: categories,
    loading,
    error,
    clearError,
    fetchItems: fetchCategories,
    createItem: createCategory,
    updateItem: updateCategory,
    deleteItem: deleteCategory
  } = useCrudOperations('/dishes/categories', { 
    itemKey: 'category',
    onSuccess: (operation, result) => {
      console.log(`Category ${operation} successful:`, result);
    }
  });

  // Category-specific utility functions
  const getCategoryById = useCallback((categoryId) => {
    return categories.find(category => category.category_id === categoryId);
  }, [categories]);

  const getCategoryName = useCallback((categoryId) => {
    const category = getCategoryById(categoryId);
    return category ? category.category_name : 'Unknown';
  }, [getCategoryById]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    // State (from shared hook)
    categories,
    loading,
    error,
    
    // Actions (from shared hook)
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    
    // Category-specific utilities
    getCategoryById,
    getCategoryName,
    
    // Computed
    totalCategories: categories.length
  };
};

export default useCategories;
