import { useState, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useSupplierEditor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supplier, setSupplier] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch supplier for editing
  const fetchSupplier = useCallback(async (supplierId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${getApiConfig().baseURL}/suppliers/${supplierId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setSupplier(response.data.supplier);
        return { success: true, supplier: response.data.supplier };
      } else {
        const errorMsg = 'Failed to fetch supplier details';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error fetching supplier:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch supplier details. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new supplier
  const createSupplier = useCallback(async (supplierData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${getApiConfig().baseURL}/suppliers`, supplierData, {
        withCredentials: true
      });

      if (response.data.success) {
        return { success: true, supplier: response.data };
      } else {
        const errorMsg = response.data.message || 'Failed to create supplier';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error creating supplier:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create supplier. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing supplier
  const updateSupplier = useCallback(async (supplierId, supplierData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`${getApiConfig().baseURL}/suppliers/${supplierId}`, supplierData, {
        withCredentials: true
      });

      if (response.data.success) {
        return { success: true, supplier: response.data };
      } else {
        const errorMsg = response.data.message || 'Failed to update supplier';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error updating supplier:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update supplier. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setSupplier(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    supplier,
    loading,
    error,
    
    // Actions
    fetchSupplier,
    createSupplier,
    updateSupplier,
    clearError,
    resetState
  };
};

export default useSupplierEditor;
