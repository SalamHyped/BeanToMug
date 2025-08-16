import { useState, useEffect, useCallback } from 'react';
import useDishes from './useDishes';
import useIngredients from './useIngredients';

/**
 * Custom hook for managing dish editing functionality
 * Leverages existing useDishes and useIngredients hooks to avoid duplication
 */
const useDishEditor = (dishId = null) => {
  const [editingDish, setEditingDish] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Use existing hooks for data management
  const { fetchDishForEdit, updateDish } = useDishes();
  const ingredientsHook = useIngredients();
  
  // Extract what we need from ingredients hook
  const {
    selectedIngredients,
    setSelectedIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    clearIngredients,
    getValidIngredients,
    ingredientTypes
  } = ingredientsHook;

  // Initialize edit mode when dishId is provided
  useEffect(() => {
    if (dishId) {
      startEditing(dishId);
    } else {
      resetEditor();
    }
  }, [dishId]);



  // Start editing a dish
  const startEditing = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    setIsEditMode(true);
    
    try {
      const result = await fetchDishForEdit(id);
      
      if (result.success) {
        const dish = result.dish;
        setEditingDish(dish);
        
        // Populate ingredients
        clearIngredients();
        if (dish.ingredients && dish.ingredients.length > 0) {
          // Transform backend ingredients to frontend format
          const transformedIngredients = dish.ingredients.map(ing => ({
            ingredient_id: ing.ingredient_id.toString(),
            quantity_required: ing.quantity_required,
            type_id: ing.type_id,
            type_name: ing.type_name,
            // Populate category and type from backend data
            category: ing.category_name || '',
            type: ing.type_name || ''
          }));
          
          // Set ingredients directly
          setSelectedIngredients(transformedIngredients);
        }
        
        console.log('🍽️ Loaded dish for editing:', dish);
      } else {
        setError(result.error || 'Failed to load dish for editing');
      }
    } catch (err) {
      console.error('Error starting dish edit:', err);
      setError('Failed to load dish for editing');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDishForEdit, clearIngredients, setSelectedIngredients]);

  // Save changes to the dish
  const saveDish = useCallback(async (formData, optionTypes = []) => {
    if (!editingDish) {
      setError('No dish being edited');
      return { success: false, error: 'No dish being edited' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const dishData = {
        ...formData,
        price: parseFloat(formData.price),
        ingredients: getValidIngredients(),
        optionTypes: optionTypes.filter(opt => opt.type_id)
      };

      console.log('💾 Saving dish:', dishData);

      const result = await updateDish(editingDish.item_id, dishData);

      if (result.success) {
        console.log('✅ Dish updated successfully');
        // Don't reset here - let parent component handle it
      } else {
        setError(result.error || 'Failed to update dish');
      }

      return result;
    } catch (err) {
      console.error('Error saving dish:', err);
      const errorMessage = 'Failed to save dish. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [editingDish, getValidIngredients, updateDish]);

  // Reset editor state
  const resetEditor = useCallback(() => {
    setEditingDish(null);
    setIsEditMode(false);
    setError(null);
    setIsLoading(false);
    clearIngredients();
  }, [clearIngredients]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    resetEditor();
  }, [resetEditor]);

  // Helper to check if an ingredient type is physical
  const isIngredientTypePhysical = useCallback((typeId) => {
    const type = ingredientTypes.find(t => t.type_id === typeId);
    return type ? type.is_physical : false;
  }, [ingredientTypes]);

  return {
    // State
    editingDish,
    isLoading,
    error,
    isEditMode,
    
    // Ingredient management (passed through)
    selectedIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    clearIngredients,
    getValidIngredients,
    
    // Actions
    startEditing,
    saveDish,
    cancelEditing,
    resetEditor,
    
    // Helpers
    isIngredientTypePhysical,
    
    // Setters
    setError
  };
};

export default useDishEditor;
