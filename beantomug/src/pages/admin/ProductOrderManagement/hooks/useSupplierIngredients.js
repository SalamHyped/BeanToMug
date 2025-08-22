import { useState, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useSupplierIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch ingredients for a specific supplier
  const fetchSupplierIngredients = useCallback(async (supplierId) => {
    if (!supplierId) {
      setIngredients([]);
      setSupplier(null);
      return { success: true, ingredients: [], supplier: null };
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${getApiConfig().baseURL}/product-orders/supplier/${supplierId}/ingredients`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setIngredients(response.data.ingredients || []);
        setSupplier(response.data.supplier || null);
        return { 
          success: true, 
          ingredients: response.data.ingredients || [], 
          supplier: response.data.supplier || null 
        };
      } else {
        const errorMsg = 'Failed to fetch supplier ingredients';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error fetching supplier ingredients:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch supplier ingredients. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get ingredient by ID from current list
  const getIngredientById = useCallback((ingredientId) => {
    return ingredients.find(ingredient => ingredient.ingredient_id === parseInt(ingredientId));
  }, [ingredients]);

  // Get low stock ingredients
  const getLowStockIngredients = useCallback(() => {
    return ingredients.filter(ingredient => ingredient.is_low_stock);
  }, [ingredients]);

  // Get ingredients needing reorder
  const getIngredientsNeedingReorder = useCallback(() => {
    return ingredients.filter(ingredient => ingredient.suggested_order_quantity > 0);
  }, [ingredients]);

  // Calculate suggested order items for low stock ingredients
  const getSuggestedOrderItems = useCallback(() => {
    return ingredients
      .filter(ingredient => ingredient.suggested_order_quantity > 0)
      .map(ingredient => ({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        quantity_ordered: ingredient.suggested_order_quantity,
        unit_cost: ingredient.price,
        unit: ingredient.unit,
        total_cost: ingredient.suggested_order_quantity * ingredient.price
      }));
  }, [ingredients]);

  // Reset state
  const resetState = useCallback(() => {
    setIngredients([]);
    setSupplier(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    ingredients,
    supplier,
    loading,
    error,
    
    // Actions
    fetchSupplierIngredients,
    getIngredientById,
    getLowStockIngredients,
    getIngredientsNeedingReorder,
    getSuggestedOrderItems,
    clearError,
    resetState,
    
    // Computed
    totalIngredients: ingredients.length,
    lowStockCount: ingredients.filter(ing => ing.is_low_stock).length,
    availableIngredients: ingredients.filter(ing => ing.status)
  };
};

export default useSupplierIngredients;
