import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; 
import { getApiConfig } from '../../../../utils/config';

const useIngredients = () => {
  const [groupedIngredients, setGroupedIngredients] = useState({});
  const [ingredientTypes, setIngredientTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all ingredients (now pre-grouped from backend)
  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/dishes/ingredients', getApiConfig());
      
      if (response.data.success) {
        setGroupedIngredients(response.data.groupedIngredients);
        setIngredientTypes(response.data.ingredientTypes || []);
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

  // Get ingredient by ID (search through all groups)
  const getIngredientById = useCallback((ingredientId) => {
    for (const category in groupedIngredients) {
      for (const type in groupedIngredients[category]) {
        const ingredient = groupedIngredients[category][type].find(ing => ing.ingredient_id === ingredientId);
        if (ingredient) return ingredient;
      }
    }
    return null;
  }, [groupedIngredients]);

  // Get ingredient name by ID
  const getIngredientName = useCallback((ingredientId) => {
    const ingredient = getIngredientById(ingredientId);
    return ingredient ? ingredient.ingredient_name : 'Unknown';
  }, [getIngredientById]);

  // Get ingredients by category
  const getIngredientsByCategory = useCallback((categoryName) => {
    if (!groupedIngredients[categoryName]) return [];
    
    // Flatten all types within the category
    const allIngredients = [];
    for (const type in groupedIngredients[categoryName]) {
      allIngredients.push(...groupedIngredients[categoryName][type]);
    }
    return allIngredients;
  }, [groupedIngredients]);

  // Get types available within a specific category
  const getTypesByCategory = useCallback((categoryName) => {
    if (!groupedIngredients[categoryName]) return [];
    return Object.keys(groupedIngredients[categoryName]);
  }, [groupedIngredients]);

  // Get ingredients by type name (search through all categories)
  const getIngredientsByType = useCallback((typeName) => {
    const allIngredients = [];
    for (const category in groupedIngredients) {
      if (groupedIngredients[category][typeName]) {
        allIngredients.push(...groupedIngredients[category][typeName]);
      }
    }
    return allIngredients;
  }, [groupedIngredients]);

  // Get ingredients by category AND type
  const getIngredientsByCategoryAndType = useCallback((categoryName, typeName) => {
    if (!groupedIngredients[categoryName] || !groupedIngredients[categoryName][typeName]) {
      return [];
    }
    return groupedIngredients[categoryName][typeName];
  }, [groupedIngredients]);

  // Get all category names
  const categoryNames = useMemo(() => {
    return Object.keys(groupedIngredients);
  }, [groupedIngredients]);

  // Get all ingredients (flattened for search)
  const allIngredients = useMemo(() => {
    const ingredients = [];
    for (const category in groupedIngredients) {
      for (const type in groupedIngredients[category]) {
        ingredients.push(...groupedIngredients[category][type]);
      }
    }
    return ingredients;
  }, [groupedIngredients]);

  // Filter ingredients by search term
  const searchIngredients = useCallback((searchTerm) => {
    if (!searchTerm) return allIngredients;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allIngredients.filter(ingredient => 
      ingredient.ingredient_name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allIngredients]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Ingredient selection management for forms
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const addIngredient = useCallback(() => {
    const newIngredient = {
      ingredient_id: '',
      quantity_required: '',
      category: '',
      type: '',
      type_id: '',
      unit: ''
    };
    setSelectedIngredients(prev => [...prev, newIngredient]);
  }, []);

  const updateIngredient = useCallback((index, field, value) => {
    setSelectedIngredients(prev => {
      const updated = prev.map((ing, i) => {
        if (i === index) {
          const newIng = { ...ing, [field]: value };
          
          // Reset dependent fields when category or type changes
          if (field === 'category') {
            newIng.type = '';
            newIng.type_id = '';
            newIng.ingredient_id = '';
          } else if (field === 'type') {
            newIng.type_id = '';
            newIng.ingredient_id = '';
            // Find type_id from the grouped ingredients data
            if (newIng.category && groupedIngredients[newIng.category] && groupedIngredients[newIng.category][value]) {
              const firstIngredient = groupedIngredients[newIng.category][value][0];
              if (firstIngredient) {
                newIng.type_id = firstIngredient.type_id;
              }
            }
          } else if (field === 'ingredient_id') {
            // When ingredient is selected, lock the type and category
            // Don't allow changes to type or category after ingredient selection
            newIng.type = ing.type; // Keep existing type
            newIng.type_id = ing.type_id; // Keep existing type_id
            newIng.category = ing.category; // Keep existing category
          }
          
          return newIng;
        }
        return ing;
      });
      return updated;
    });
  }, [groupedIngredients]);

  const removeIngredient = useCallback((index) => {
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearIngredients = useCallback(() => {
    setSelectedIngredients([]);
  }, []);

  const getValidIngredients = useCallback(() => {
    return selectedIngredients
      .filter(ing => ing.ingredient_id) // Only require ingredient_id
      .map(ing => {
        const baseIngredient = {
          ingredient_id: parseInt(ing.ingredient_id)
        };
        
        // Check if this ingredient type is physical by looking at the ingredientTypes data
        const ingredientType = ingredientTypes.find(type => type.type_id === ing.type_id);
        
        // Only add quantity_required for physical ingredient types
        if (ingredientType && ingredientType.is_physical) {
          if (ing.quantity_required) {
            baseIngredient.quantity_required = parseFloat(ing.quantity_required);
          }
        }
        
        return baseIngredient;
      });
  }, [selectedIngredients, ingredientTypes]);

  // Initial fetch
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return {
    // State
    groupedIngredients,
    ingredientTypes,
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
    totalIngredients: allIngredients.length,
    categoryNames,
    
    // Active ingredients only
    activeIngredients: allIngredients.filter(ing => ing.status === 1),

    // Ingredient selection management
    selectedIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    clearIngredients,
    getValidIngredients
  };
};

export default useIngredients;
