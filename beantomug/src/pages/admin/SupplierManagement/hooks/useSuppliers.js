import { useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';
import { useCrudOperations } from '../../MenuManagement/hooks/useSharedHookUtils';

const useSuppliers = (filters = {}) => {
  // Use shared CRUD operations for basic functionality
  const {
    data: suppliers,
    loading,
    error,
    clearError,
    fetchItems: fetchSuppliers,
    createItem: createSupplier,
    updateItem: updateSupplier,
    deleteItem: deleteSupplier,
    toggleItemStatus: toggleSupplierStatus
  } = useCrudOperations('/suppliers', { 
    itemKey: 'supplier',
    onSuccess: (operation, result) => {
      console.log(`Supplier ${operation} successful:`, result);
    }
  });

  // Client-side filtering and sorting
  const filteredSuppliers = useMemo(() => {
    if (!suppliers.length) return [];
    
    return suppliers.filter(supplier => {
      // Search filter - search by name, phone, or email
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchFields = [
          supplier.supplier_name || '',
          supplier.phone_number || '',
          supplier.email || ''
        ];
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchTerm)
        );
        
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'active' && !supplier.status) return false;
        if (filters.status === 'inactive' && supplier.status) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sorting logic
      if (!filters.sortBy || filters.sortBy === 'supplier_name') {
        const aVal = (a.supplier_name || '').toLowerCase();
        const bVal = (b.supplier_name || '').toLowerCase();
        return filters.sortOrder === 'asc' ? 
          aVal.localeCompare(bVal) : 
          bVal.localeCompare(aVal);
      }
      
      if (filters.sortBy === 'phone_number') {
        const aVal = a.phone_number || '';
        const bVal = b.phone_number || '';
        return filters.sortOrder === 'asc' ? 
          aVal.localeCompare(bVal) : 
          bVal.localeCompare(aVal);
      }
      
      if (filters.sortBy === 'email') {
        const aVal = (a.email || '').toLowerCase();
        const bVal = (b.email || '').toLowerCase();
        return filters.sortOrder === 'asc' ? 
          aVal.localeCompare(bVal) : 
          bVal.localeCompare(aVal);
      }
      
      if (filters.sortBy === 'created_at') {
        const aVal = new Date(a.created_at || 0);
        const bVal = new Date(b.created_at || 0);
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (filters.sortBy === 'ingredient_count') {
        const aVal = a.ingredient_count || 0;
        const bVal = b.ingredient_count || 0;
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, [suppliers, filters]);

  // Supplier-specific utility functions
  const getSupplierById = useCallback((supplierId) => {
    return suppliers.find(supplier => supplier.supplier_id === supplierId);
  }, [suppliers]);

  const getSupplierName = useCallback((supplierId) => {
    const supplier = getSupplierById(supplierId);
    return supplier ? supplier.supplier_name : 'Unknown';
  }, [getSupplierById]);

  // Fetch single supplier with full details for editing
  const fetchSupplierForEdit = useCallback(async (supplierId) => {
    try {
      const response = await axios.get(`${getApiConfig().baseURL}/suppliers/${supplierId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        return { success: true, supplier: response.data.data.supplier };
      } else {
        return { success: false, error: 'Failed to fetch supplier details' };
      }
    } catch (err) {
      console.error('Error fetching supplier for edit:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch supplier details. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Toggle supplier status with custom endpoint
  const toggleSupplierStatusCustom = useCallback(async (supplierId, currentStatus) => {
    try {
      const response = await axios.put(
        `${getApiConfig().baseURL}/suppliers/${supplierId}/toggle-status`, 
        {}, 
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh suppliers list
        await fetchSuppliers();
        return { success: true };
      } else {
        return { success: false, error: 'Failed to toggle supplier status' };
      }
    } catch (err) {
      console.error('Error toggling supplier status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to toggle supplier status. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, [fetchSuppliers]);

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    // State (from shared hook)
    suppliers,
    loading,
    error,
    
    // Actions (from shared hook + custom)
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus: toggleSupplierStatusCustom,
    fetchSupplierForEdit,
    getSupplierById,
    getSupplierName,
    clearError,
    
    // Computed - Filtered data
    filteredSuppliers,
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(supplier => supplier.status).length,
    inactiveSuppliers: suppliers.filter(supplier => !supplier.status).length,
    
    // Filtered counts
    filteredCount: filteredSuppliers.length,
    filteredActiveCount: filteredSuppliers.filter(supplier => supplier.status).length,
    filteredInactiveCount: filteredSuppliers.filter(supplier => !supplier.status).length
  };
};

export default useSuppliers;
