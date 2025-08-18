import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const API_BASE_URL = 'http://localhost:8801/work-schedule';

const useShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use the existing API config
  const apiConfig = getApiConfig();

  // Fetch all shifts
  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/shifts`, apiConfig);
      setShifts(response.data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError(err.response?.data?.message || 'Failed to fetch shifts');
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new shift
  const createShift = async (shiftData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/shifts`, shiftData, apiConfig);
      await fetchShifts(); // Refresh list
      return response.data.shift;
    } catch (err) {
      console.error('Error creating shift:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create shift';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update existing shift
  const updateShift = async (shiftId, shiftData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/shifts/${shiftId}`, shiftData, apiConfig);
      await fetchShifts(); // Refresh list
      return response.data.shift;
    } catch (err) {
      console.error('Error updating shift:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update shift';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete shift
  const deleteShift = async (shiftId) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/shifts/${shiftId}`, apiConfig);
      await fetchShifts(); // Refresh list
      return true;
    } catch (err) {
      console.error('Error deleting shift:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete shift';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get shift by ID
  const getShift = async (shiftId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/shifts/${shiftId}`, apiConfig);
      return response.data.shift;
    } catch (err) {
      console.error('Error fetching shift:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch shift';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return {
    // Data
    shifts,
    loading,
    error,
    
    // Actions
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    getShift,
    
    // Computed values
    activeShifts: shifts.filter(s => s.is_active),
    inactiveShifts: shifts.filter(s => !s.is_active),
    shiftsCount: shifts.length
  };
};

export default useShifts;
