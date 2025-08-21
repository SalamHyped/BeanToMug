import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

/**
 * Base hook for common API operations
 * Reduces redundancy across WorkSchedule hooks
 */
const useApiBase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the API config to prevent infinite loops
  const apiConfig = useMemo(() => getApiConfig(), []);

  // Generic API call wrapper
  const apiCall = useCallback(async (operation, errorMessage = 'Operation failed') => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      console.error(`Error: ${errorMessage}`, err);
      const finalErrorMessage = err.response?.data?.message || errorMessage;
      setError(finalErrorMessage);
      throw new Error(finalErrorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Common CRUD operations
  const get = useCallback((url) => {
    return apiCall(() => axios.get(url, apiConfig), `Failed to fetch from ${url}`);
  }, [apiCall, apiConfig]);

  const post = useCallback((url, data) => {
    return apiCall(() => axios.post(url, data, apiConfig), `Failed to create via ${url}`);
  }, [apiCall, apiConfig]);

  const put = useCallback((url, data) => {
    return apiCall(() => axios.put(url, data, apiConfig), `Failed to update via ${url}`);
  }, [apiCall, apiConfig]);

  const del = useCallback((url) => {
    return apiCall(() => axios.delete(url, apiConfig), `Failed to delete via ${url}`);
  }, [apiCall, apiConfig]);

  return {
    loading,
    error,
    setError,
    apiCall,
    get,
    post,
    put,
    delete: del
  };
};

export default useApiBase;