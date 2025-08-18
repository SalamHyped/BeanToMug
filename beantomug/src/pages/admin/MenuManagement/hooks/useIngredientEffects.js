import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';
import { useCrudOperations, useApiState } from './useSharedHookUtils';

const useIngredientEffects = () => {
  // Use shared CRUD operations for effects
  const {
    data: effects,
    loading,
    error,
    clearError,
    fetchItems: fetchEffects,
    createItem: createEffect,
    deleteItem: deleteEffect
  } = useCrudOperations('/ingredient-effects', { itemKey: 'effect' });

  // Separate state for dropdown options
  const [options, setOptions] = useState({ dishes: [], optionIngredients: [], targetIngredients: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Fetch dropdown options
  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const response = await axios.get('/ingredient-effects/options', getApiConfig());
      setOptions({
        dishes: response.data?.dishes || [],
        optionIngredients: response.data?.optionIngredients || [],
        targetIngredients: response.data?.targetIngredients || []
      });
    } catch (err) {
      console.error('Error fetching options:', err);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchEffects();
    fetchOptions();
  }, [fetchEffects, fetchOptions]);

  return {
    effects,
    options,
    loading: loading || optionsLoading,
    error,
    clearError,
    createEffect,
    deleteEffect,
    refreshData: () => {
      fetchEffects();
      fetchOptions();
    }
  };
};

export default useIngredientEffects;
