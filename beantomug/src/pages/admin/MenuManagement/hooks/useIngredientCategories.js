import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';
import { useCrudOperations } from './useSharedHookUtils';

const useIngredientCategories = (filters = {}) => {
  // Use shared CRUD operations for basic functionality
  const {
    data: categories,
    loading,
    error,
    clearError,
    createItem: createCategory,
    updateItem: updateCategory,
    deleteItem: deleteCategory
  } = useCrudOperations('/ingredient-categories', { 
    itemKey: 'category',
    onSuccess: (operation, result) => {
      console.log(`Ingredient category ${operation} successful:`, result);
    }
  });

  // Additional state for ingredient categories management
  const [availableTypes, setAvailableTypes] = useState([]);

  // Client-side filtering and sorting
  const filteredCategories = useMemo(() => {
    if (!categories.length) return [];
    
    return categories.filter(category => {
      // Search filter
      if (filters.search && 
          !category.category_name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(category.type_name || '').toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type_id && category.type_id !== parseInt(filters.type_id)) {
        return false;
      }
      
      // Option group filter
      if (filters.option_group && category.type_option_group !== filters.option_group) {
        return false;
      }
      
      // Physical/Non-physical filter
      if (filters.is_physical !== undefined && filters.is_physical !== 'all') {
        const isPhysicalBool = filters.is_physical === 'true' || filters.is_physical === true;
        if (category.type_is_physical !== isPhysicalBool) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sorting logic
      const sortBy = filters.sortBy || 'category_name';
      const sortOrder = filters.sortOrder || 'asc';
      
      let aVal, bVal;
      
      switch (sortBy) {
        case 'type_name':
          aVal = (a.type_name || '').toLowerCase();
          bVal = (b.type_name || '').toLowerCase();
          break;
        case 'type_option_group':
          aVal = (a.type_option_group || '').toLowerCase();
          bVal = (b.type_option_group || '').toLowerCase();
          break;
        case 'ingredient_count':
          aVal = a.ingredient_count || 0;
          bVal = b.ingredient_count || 0;
          break;
        default: // category_name
          aVal = (a.category_name || '').toLowerCase();
          bVal = (b.category_name || '').toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }, [categories, filters]);

  // Fetch ingredient categories with server-side filtering
  const fetchCategories = useCallback(async (filtersToApply = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add server-side filters
      if (filtersToApply.search) params.append('search', filtersToApply.search);
      if (filtersToApply.type_id) params.append('type_id', filtersToApply.type_id);
      if (filtersToApply.sort_by) params.append('sort_by', filtersToApply.sort_by);
      if (filtersToApply.sort_order) params.append('sort_order', filtersToApply.sort_order);

      const url = `/ingredient-categories${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url, getApiConfig());
      
      if (response.data.success) {
        // Use the shared hook's setData method
        categories.splice(0, categories.length, ...response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching ingredient categories:', err);
    }
  }, [categories]);

  // Get category by ID
  const getCategoryById = useCallback((categoryId) => {
    return categories.find(category => category.category_id === categoryId);
  }, [categories]);

  // Get category name by ID
  const getCategoryName = useCallback((categoryId) => {
    const category = getCategoryById(categoryId);
    return category ? category.category_name : 'Unknown';
  }, [getCategoryById]);

  // Fetch available types (types without categories assigned)
  const fetchAvailableTypes = useCallback(async () => {
    try {
      const response = await axios.get('/ingredient-categories/available-types', getApiConfig());
      if (response.data.success) {
        setAvailableTypes(response.data.availableTypes);
      }
    } catch (err) {
      console.error('Error fetching available types:', err);
    }
  }, []);

  // Create new ingredient category with validation
  const createIngredientCategory = useCallback(async (categoryData) => {
    const result = await createCategory(categoryData);
    if (result.success) {
      // Refresh available types after creating a new category
      await fetchAvailableTypes();
    }
    return result;
  }, [createCategory, fetchAvailableTypes]);

  // Update ingredient category with validation
  const updateIngredientCategory = useCallback(async (categoryId, categoryData) => {
    const result = await updateCategory(categoryId, categoryData);
    if (result.success) {
      // Refresh available types in case type assignment changed
      await fetchAvailableTypes();
    }
    return result;
  }, [updateCategory, fetchAvailableTypes]);

  // Delete ingredient category with confirmation
  const deleteIngredientCategory = useCallback(async (categoryId) => {
    const category = getCategoryById(categoryId);
    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    if (category.ingredient_count > 0) {
      return { 
        success: false, 
        error: `Cannot delete "${category.category_name}" as it has ${category.ingredient_count} ingredients assigned to its type.`
      };
    }

    const result = await deleteCategory(categoryId);
    if (result.success) {
      // Refresh available types after deletion
      await fetchAvailableTypes();
    }
    return result;
  }, [deleteCategory, getCategoryById, fetchAvailableTypes]);

  // Get categories by type
  const getCategoriesByType = useCallback((typeId) => {
    return categories.filter(category => category.type_id === typeId);
  }, [categories]);

  // Get categories by option group
  const getCategoriesByOptionGroup = useCallback((optionGroup) => {
    return categories.filter(category => category.type_option_group === optionGroup);
  }, [categories]);

  // Check if a type can be assigned to a category
  const canAssignType = useCallback((typeId) => {
    // A type can be assigned if it's in available types or already assigned to current category
    return availableTypes.some(type => type.type_id === typeId);
  }, [availableTypes]);

  // Get type info for dropdown
  const getTypeOptions = useCallback(() => {
    return availableTypes.map(type => ({
      value: type.type_id,
      label: `${type.type_name} (${type.option_group})`,
      optionGroup: type.option_group,
      isPhysical: type.is_physical
    }));
  }, [availableTypes]);

  // Computed values
  const uniqueOptionGroups = useMemo(() => {
    const groups = [...new Set(categories.map(cat => cat.type_option_group).filter(Boolean))];
    return groups.sort();
  }, [categories]);

  const physicalCategories = useMemo(() => {
    return categories.filter(cat => cat.type_is_physical);
  }, [categories]);

  const nonPhysicalCategories = useMemo(() => {
    return categories.filter(cat => !cat.type_is_physical);
  }, [categories]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
    fetchAvailableTypes();
  }, []);

  return {
    // State
    categories,
    loading,
    error,
    availableTypes,
    
    // Actions
    fetchCategories,
    createIngredientCategory,
    updateIngredientCategory,
    deleteIngredientCategory,
    fetchAvailableTypes,
    clearError,
    
    // Utility functions
    getCategoryById,
    getCategoryName,
    getCategoriesByType,
    getCategoriesByOptionGroup,
    canAssignType,
    getTypeOptions,
    
    // Computed values
    filteredCategories,
    totalCategories: categories.length,
    uniqueOptionGroups,
    physicalCategories: physicalCategories.length,
    nonPhysicalCategories: nonPhysicalCategories.length,
    
    // Filtered counts
    filteredCount: filteredCategories.length,
    filteredPhysicalCount: filteredCategories.filter(cat => cat.type_is_physical).length,
    filteredNonPhysicalCount: filteredCategories.filter(cat => !cat.type_is_physical).length,
    
    // Statistics
    averageIngredientsPerCategory: categories.length > 0 
      ? (categories.reduce((sum, cat) => sum + (cat.ingredient_count || 0), 0) / categories.length).toFixed(1)
      : 0,
    categoriesWithIngredients: categories.filter(cat => (cat.ingredient_count || 0) > 0).length,
    categoriesWithoutIngredients: categories.filter(cat => (cat.ingredient_count || 0) === 0).length,
    availableTypesCount: availableTypes.length
  };
};

export default useIngredientCategories;

