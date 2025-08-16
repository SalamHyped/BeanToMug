import { useState, useEffect, useCallback } from 'react';
// Removed useCrudOperations import since we need custom server-side filtering
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useIngredientsManagement = () => {
  // State management
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Management-specific state that can't be shared
  const [ingredientTypes, setIngredientTypes] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });

  // Filter state management (can't use useFilterSort because we need server-side filtering)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    status: 'all',
    sortBy: 'ingredient_name',
    sortOrder: 'asc',
    page: 1,
    limit: 20
  });

  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
  }, [filters]);

  const changePage = useCallback((page) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
  }, [filters]);

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      search: '',
      category: '',
      type: '',
      status: 'all',
      sortBy: 'ingredient_name',
      sortOrder: 'asc',
      page: 1,
      limit: 20
    };
    setFilters(defaultFilters);
  }, []);

  // Ingredient-specific fetch with filters
  const fetchIngredients = useCallback(async (filtersToUse = filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/ingredients?${params.toString()}`, getApiConfig());
      
      if (response.data.success) {
        setIngredients(response.data.ingredients);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch ingredients');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // CRUD operations
  const createIngredient = useCallback(async (ingredientData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/ingredients', ingredientData, getApiConfig());
      
      if (response.data.success) {
        await fetchIngredients();
        return { success: true, ingredient: response.data.ingredient };
      } else {
        setError(response.data.error || 'Failed to create ingredient');
        return { success: false, error: response.data.error || 'Failed to create ingredient' };
      }
    } catch (err) {
      console.error('Error creating ingredient:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create ingredient. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchIngredients]);

  const updateIngredient = useCallback(async (ingredientId, ingredientData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`/ingredients/${ingredientId}`, ingredientData, getApiConfig());
      
      if (response.data.success) {
        await fetchIngredients();
        return { success: true, ingredient: response.data.ingredient };
      } else {
        setError(response.data.error || 'Failed to update ingredient');
        return { success: false, error: response.data.error || 'Failed to update ingredient' };
      }
    } catch (err) {
      console.error('Error updating ingredient:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update ingredient. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchIngredients]);

  // Ingredient-specific operations
  const updateIngredientStatus = useCallback(async (ingredientId, status) => {
    try {
      const response = await axios.patch(`/ingredients/${ingredientId}/status`, { status }, getApiConfig());
      if (response.data.success) {
        await fetchIngredients();
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to update ingredient status');
    } catch (err) {
      console.error('Error updating ingredient status:', err);
      throw err;
    }
  }, [fetchIngredients]);

  const updateIngredientStock = useCallback(async (ingredientId, quantity_in_stock, operation = 'set') => {
    try {
      const response = await axios.patch(`/ingredients/${ingredientId}/stock`, { 
        quantity_in_stock, 
        operation 
      }, getApiConfig());
      if (response.data.success) {
        await fetchIngredients();
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to update ingredient stock');
    } catch (err) {
      console.error('Error updating ingredient stock:', err);
      throw err;
    }
  }, [fetchIngredients]);

  // Fetch helper data
  const fetchIngredientTypes = useCallback(async () => {
    try {
      const response = await axios.get('/ingredients/types/all', getApiConfig());
      if (response.data.success) {
        setIngredientTypes(response.data.types);
      }
    } catch (err) {
      console.error('Error fetching ingredient types:', err);
    }
  }, []);

  const fetchIngredientCategories = useCallback(async () => {
    try {
      const response = await axios.get('/ingredients/categories/all', getApiConfig());
      if (response.data.success) {
        setIngredientCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching ingredient categories:', err);
    }
  }, []);

  // Computed values
  const categoryNames = [...new Set(ingredientCategories.map(cat => cat.category_name))];
  const typeNames = [...new Set(ingredientTypes.map(type => type.name))];
  const activeIngredients = ingredients.filter(ing => ing.status === 1);
  const inactiveIngredients = ingredients.filter(ing => ing.status === 0);
  const lowStockIngredients = ingredients.filter(ing => 
    ing.quantity_in_stock <= ing.low_stock_threshold
  );

  // Auto-fetch when filters change
  useEffect(() => {
    fetchIngredients(filters);
  }, [filters, fetchIngredients]);

  // Initial data fetch
  useEffect(() => {
    fetchIngredientTypes();
    fetchIngredientCategories();
  }, [fetchIngredientTypes, fetchIngredientCategories]);

  return {
    // State (from shared hook + custom)
    ingredients,
    ingredientTypes,
    ingredientCategories,
    loading,
    error,
    pagination,
    filters,
    
    // Actions (from shared hook + custom)
    fetchIngredients,
    createIngredient,
    updateIngredient,
    updateIngredientStatus,
    updateIngredientStock,
    updateFilters,
    changePage,
    resetFilters,
    clearError,
    
    // Computed values
    categoryNames,
    typeNames,
    totalCount: pagination.totalCount,
    activeCount: activeIngredients.length,
    inactiveCount: inactiveIngredients.length,
    lowStockCount: lowStockIngredients.length
  };
};

export default useIngredientsManagement;