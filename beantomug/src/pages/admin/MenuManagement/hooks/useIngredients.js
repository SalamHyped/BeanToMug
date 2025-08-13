import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const useIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:8801/dishes/ingredients', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setIngredients(response.data.ingredients);
      } else {
        setError('Failed to fetch ingredients');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Group ingredients by category for better organization
  const groupedIngredients = useMemo(() => {
    return ingredients.reduce((acc, ingredient) => {
      const category = ingredient.category_name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    }, {});
  }, [ingredients]);

  // Get ingredient by ID
  const getIngredientById = useCallback((ingredientId) => {
    return ingredients.find(ingredient => ingredient.ingredient_id === ingredientId);
  }, [ingredients]);

  // Get ingredient name by ID
  const getIngredientName = useCallback((ingredientId) => {
    const ingredient = getIngredientById(ingredientId);
    return ingredient ? ingredient.ingredient_name : 'Unknown';
  }, [getIngredientById]);

  // Get ingredients by category
  const getIngredientsByCategory = useCallback((categoryName) => {
    return groupedIngredients[categoryName] || [];
  }, [groupedIngredients]);

  
  // NEW: Get types available within a specific category
  const getTypesByCategory = useCallback((categoryName) => {
    const categoryIngredients = groupedIngredients[categoryName] || [];
    const types = [...new Set(categoryIngredients.map(ing => ing.type_name))];
    return types.filter(type => type); // Filter out null/undefined types
  }, [groupedIngredients]);

  // NEW: Get ingredients by type name
  const getIngredientsByType = useCallback((typeName) => {
    return ingredients.filter(ing => ing.type_name === typeName);
  }, [ingredients]);

  // NEW: Get ingredients by category AND type
  const getIngredientsByCategoryAndType = useCallback((categoryName, typeName) => {
    const categoryIngredients = groupedIngredients[categoryName] || [];
    return categoryIngredients.filter(ing => ing.type_name === typeName);
  }, [groupedIngredients]);

  // Get all category names
  const categoryNames = useMemo(() => {
    return Object.keys(groupedIngredients);
  }, [groupedIngredients]);

  // Filter ingredients by search term
  const searchIngredients = useCallback((searchTerm) => {
    if (!searchTerm) return ingredients;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return ingredients.filter(ingredient => 
      ingredient.ingredient_name.toLowerCase().includes(lowerSearchTerm) ||
      ingredient.category_name?.toLowerCase().includes(lowerSearchTerm) ||
      ingredient.type_name?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [ingredients]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Initial fetch
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return {
    // State
    ingredients,
    loading,
    error,
    
    // Actions
    fetchIngredients,
    getIngredientById,
    getIngredientName,
    getIngredientsByCategory,
    getIngredientsByType,
    getIngredientsByCategoryAndType,
    getTypesByCategory,
    searchIngredients,
    clearError,
    
    // Computed
    totalIngredients: ingredients.length,
    groupedIngredients,
    categoryNames,
    
    // Active ingredients only
    activeIngredients: ingredients.filter(ing => ing.status === 1)
  };
};

export default useIngredients;
