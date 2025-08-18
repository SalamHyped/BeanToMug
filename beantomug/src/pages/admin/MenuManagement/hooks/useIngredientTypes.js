import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';
import { useCrudOperations } from './useSharedHookUtils';

const useIngredientTypes = (filters = {}) => {
  // Use shared CRUD operations for basic functionality
  const {
    data: types,
    loading,
    error,
    clearError,
    fetchItems: fetchTypesBase,
    createItem: createType,
    updateItem: updateType,
    deleteItem: deleteType
  } = useCrudOperations('/ingredient-types', { 
    itemKey: 'type',
    onSuccess: (operation, result) => {
      console.log(`Ingredient type ${operation} successful:`, result);
    }
  });

  // Additional state for ingredient types management
  const [optionGroups, setOptionGroups] = useState([]);

  // Client-side filtering and sorting
  const filteredTypes = useMemo(() => {
    if (!types.length) return [];
    
    return types.filter(type => {
      // Search filter
      if (filters.search && 
          !type.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !type.option_group.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Physical/Non-physical filter
      if (filters.is_physical !== undefined && filters.is_physical !== 'all') {
        const isPhysicalBool = filters.is_physical === 'true' || filters.is_physical === true;
        if (type.is_physical !== isPhysicalBool) {
          return false;
        }
      }
      
      // Option group filter
      if (filters.option_group && type.option_group !== filters.option_group) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sorting logic
      const sortBy = filters.sortBy || 'name';
      const sortOrder = filters.sortOrder || 'asc';
      
      let aVal, bVal;
      
      switch (sortBy) {
        case 'option_group':
          aVal = a.option_group.toLowerCase();
          bVal = b.option_group.toLowerCase();
          break;
        case 'is_physical':
          aVal = a.is_physical ? 1 : 0;
          bVal = b.is_physical ? 1 : 0;
          break;
        case 'ingredient_count':
          aVal = a.ingredient_count || 0;
          bVal = b.ingredient_count || 0;
          break;
        default: // name
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }, [types, filters]);

  // Fetch ingredient types with server-side filtering
  const fetchTypes = useCallback(async (filtersToApply = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add server-side filters
      if (filtersToApply.search) params.append('search', filtersToApply.search);
      if (filtersToApply.is_physical !== undefined) params.append('is_physical', filtersToApply.is_physical);
      if (filtersToApply.sort_by) params.append('sort_by', filtersToApply.sort_by);
      if (filtersToApply.sort_order) params.append('sort_order', filtersToApply.sort_order);

      const url = `/ingredient-types${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url, getApiConfig());
      
      if (response.data.success) {
        // Use the shared hook's setData method
        types.splice(0, types.length, ...response.data.types);
      }
    } catch (err) {
      console.error('Error fetching ingredient types:', err);
    }
  }, [types]);

  // Get type by ID
  const getTypeById = useCallback((typeId) => {
    return types.find(type => type.type_id === typeId);
  }, [types]);

  // Get type name by ID
  const getTypeName = useCallback((typeId) => {
    const type = getTypeById(typeId);
    return type ? type.name : 'Unknown';
  }, [getTypeById]);

  // Fetch option groups
  const fetchOptionGroups = useCallback(async () => {
    try {
      const response = await axios.get('/ingredient-types/option-groups/all', getApiConfig());
      if (response.data.success) {
        setOptionGroups(response.data.optionGroups);
      }
    } catch (err) {
      console.error('Error fetching option groups:', err);
    }
  }, []);

  // Create new ingredient type with validation
  const createIngredientType = useCallback(async (typeData) => {
    const result = await createType(typeData);
    if (result.success) {
      // Refresh option groups after creating a new type
      await fetchOptionGroups();
    }
    return result;
  }, [createType, fetchOptionGroups]);

  // Update ingredient type with validation
  const updateIngredientType = useCallback(async (typeId, typeData) => {
    const result = await updateType(typeId, typeData);
    if (result.success) {
      // Refresh option groups in case option_group changed
      await fetchOptionGroups();
    }
    return result;
  }, [updateType, fetchOptionGroups]);

  // Check what's preventing type deletion
  const checkTypeDependencies = useCallback(async (typeId) => {
    try {
      const type = getTypeById(typeId);
      if (!type) {
        return { canDelete: false, reason: 'Type not found', dependencies: [] };
      }

      // Use dedicated dependencies endpoint (safe - doesn't delete anything)
      const response = await axios.get(`/ingredient-types/${typeId}/dependencies`, getApiConfig());
      
      if (response.data.success) {
        return {
          canDelete: response.data.canDelete,
          dependencies: response.data.dependencies,
          type: type
        };
      }

      return { canDelete: false, reason: 'Failed to check dependencies', dependencies: [] };
    } catch (err) {
      console.error('Error checking dependencies:', err);
      return { 
        canDelete: false, 
        reason: 'Error checking dependencies', 
        dependencies: [] 
      };
    }
  }, [getTypeById]);

  // Get deletion workflow steps for a type
  const getDeletionWorkflow = useCallback(async (typeId) => {
    const depCheck = await checkTypeDependencies(typeId);
    if (depCheck.canDelete) {
      return { 
        steps: [{ 
          step: 1, 
          action: 'Ready to delete', 
          description: 'No dependencies found - safe to delete',
          completed: true 
        }] 
      };
    }

    const steps = [];
    let stepNumber = 1;

    // Step for dishes
    const dishDep = depCheck.dependencies.find(dep => dep.type === 'dishes');
    if (dishDep) {
      steps.push({
        step: stepNumber++,
        action: 'Remove from dishes',
        description: dishDep.message,
        instructions: 'Edit each dish to remove this option type configuration',
        completed: false
      });
    }

    // Step for ingredients  
    const ingredientDep = depCheck.dependencies.find(dep => dep.type === 'ingredients');
    if (ingredientDep) {
      steps.push({
        step: stepNumber++,
        action: 'Handle ingredients',
        description: ingredientDep.message,
        instructions: 'Either move ingredients to different types or delete them',
        completed: false
      });
    }

    // Step for category
    const categoryDep = depCheck.dependencies.find(dep => dep.type === 'category');
    if (categoryDep) {
      steps.push({
        step: stepNumber++,
        action: 'Unlink category',
        description: categoryDep.message,
        instructions: 'Remove the category link or assign category to different type',
        completed: false
      });
    }

    // Final step
    steps.push({
      step: stepNumber,
      action: 'Delete type',
      description: `Delete "${depCheck.type?.name}" safely`,
      instructions: 'Complete all previous steps first',
      completed: false
    });

    return { steps, dependencies: depCheck.dependencies };
  }, [checkTypeDependencies]);

  // Delete ingredient type with confirmation
  const deleteIngredientType = useCallback(async (typeId) => {
    const type = getTypeById(typeId);
    if (!type) {
      return { success: false, error: 'Type not found' };
    }

    // Check dependencies first
    const depCheck = await checkTypeDependencies(typeId);
    if (!depCheck.canDelete) {
      return { 
        success: false, 
        error: `Cannot delete "${type.name}". Dependencies found: ${depCheck.dependencies.map(d => d.message).join(', ')}`,
        dependencies: depCheck.dependencies,
        workflow: await getDeletionWorkflow(typeId)
      };
    }

    const result = await deleteType(typeId);
    if (result.success) {
      // Refresh option groups after deletion
      await fetchOptionGroups();
    }
    return result;
  }, [deleteType, getTypeById, fetchOptionGroups, checkTypeDependencies, getDeletionWorkflow]);

  // Get types by option group
  const getTypesByOptionGroup = useCallback((optionGroup) => {
    return types.filter(type => type.option_group === optionGroup);
  }, [types]);

  // Get unique option groups from current types
  const currentOptionGroups = useMemo(() => {
    const groups = [...new Set(types.map(type => type.option_group))];
    return groups.sort();
  }, [types]);

  // Initial fetch
  useEffect(() => {
    fetchTypesBase();
    fetchOptionGroups();
  }, [fetchTypesBase, fetchOptionGroups]);

  return {
    // State
    types,
    loading,
    error,
    optionGroups,
    
    // Actions
    fetchTypes: fetchTypesBase,
    createIngredientType,
    updateIngredientType,
    deleteIngredientType,
    fetchOptionGroups,
    clearError,
    
    // Utility functions
    getTypeById,
    getTypeName,
    getTypesByOptionGroup,
    
    // Deletion workflow helpers
    checkTypeDependencies,
    getDeletionWorkflow,
    
    // Computed values
    filteredTypes,
    totalTypes: types.length,
    physicalTypes: types.filter(type => type.is_physical).length,
    nonPhysicalTypes: types.filter(type => !type.is_physical).length,
    currentOptionGroups,
    
    // Filtered counts
    filteredCount: filteredTypes.length,
    filteredPhysicalCount: filteredTypes.filter(type => type.is_physical).length,
    filteredNonPhysicalCount: filteredTypes.filter(type => !type.is_physical).length,
    
    // Statistics
    averageIngredientsPerType: types.length > 0 
      ? (types.reduce((sum, type) => sum + (type.ingredient_count || 0), 0) / types.length).toFixed(1)
      : 0,
    typesWithIngredients: types.filter(type => (type.ingredient_count || 0) > 0).length,
    typesWithoutIngredients: types.filter(type => (type.ingredient_count || 0) === 0).length
  };
};

export default useIngredientTypes;
