import { useState, useCallback, useMemo } from 'react';

const useOptionTypes = (ingredientTypes = [], selectedIngredients = []) => {
  const [selectedOptionTypes, setSelectedOptionTypes] = useState([]);

  // Filter option types based on ingredients being added
  const relevantOptionTypes = useMemo(() => {
    if (!ingredientTypes.length || !selectedIngredients.length) {
      return ingredientTypes; // Show all if no ingredients selected
    }

    // Get unique type IDs from selected ingredients
    const ingredientTypeIds = [...new Set(selectedIngredients.map(ing => ing.type_id))];
    
    // Filter option types to only show those relevant to the ingredient types
    return ingredientTypes.filter(optionType => {
      // Show option types that match ingredient TYPE IDs directly
      return ingredientTypeIds.some(typeId => 
        optionType.type_id === typeId
      );
    });
  }, [ingredientTypes, selectedIngredients]);

  const addOptionType = useCallback(() => {
    const newOptionType = {
      type_id: '',
      is_required: false,
      is_multiple: false
    };
    setSelectedOptionTypes(prev => [...prev, newOptionType]);
  }, []);

  const updateOptionType = useCallback((index, field, value) => {
    setSelectedOptionTypes(prev => {
      const updated = prev.map((option, i) => {
        if (i === index) {
          return { ...option, [field]: value };
        }
        return option;
      });
      return updated;
    });
  }, []);

  const removeOptionType = useCallback((index) => {
    setSelectedOptionTypes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearOptionTypes = useCallback(() => {
    setSelectedOptionTypes([]);
  }, []);

  const getValidOptionTypes = useCallback(() => {
    return selectedOptionTypes
      .filter(option => option.type_id)
      .map(option => ({
        type_id: parseInt(option.type_id),
        is_required: option.is_required ? 1 : 0,
        is_multiple: option.is_multiple ? 1 : 0
      }));
  }, [selectedOptionTypes]);

  return {
    // State
    selectedOptionTypes,
    
    // Actions
    addOptionType,
    updateOptionType,
    removeOptionType,
    clearOptionTypes,
    
    // Computed
    getValidOptionTypes,
    hasValidOptions: selectedOptionTypes.some(option => option.type_id),
    
    // Filtered option types based on ingredients
    relevantOptionTypes
  };
};

export default useOptionTypes;
