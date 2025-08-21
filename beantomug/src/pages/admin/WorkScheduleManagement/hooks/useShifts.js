import { useState, useEffect, useCallback } from 'react';
import useApiBase from './useApiBase';

const useShifts = () => {
  const [shifts, setShifts] = useState([]);
  
  // Get API functions from useApiBase (these are stable)
  const { loading, error, get, post, put, delete: del } = useApiBase();

  // Fetch all shifts
  const fetchShifts = useCallback(async () => {
    try {
      const response = await get('/work-schedule/shifts');
      setShifts(response.data.shifts || []);
    } catch (err) {
      setShifts([]);
      // Error is handled by useApiBase
    }
  }, []); // No dependencies - get is stable

  // Create new shift
  const createShift = useCallback(async (shiftData) => {
    try {
      const response = await post('/work-schedule/shifts', shiftData);
      await fetchShifts(); // Refresh list
      return response.data.shift;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - post and fetchShifts are stable

  // Update existing shift
  const updateShift = useCallback(async (shiftId, shiftData) => {
    try {
      const response = await put(`/work-schedule/shifts/${shiftId}`, shiftData);
      await fetchShifts(); // Refresh list
      return response.data.shift;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - put and fetchShifts are stable

  // Delete shift
  const deleteShift = useCallback(async (shiftId) => {
    try {
      await del(`/work-schedule/shifts/${shiftId}`);
      await fetchShifts(); // Refresh list
      return true;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - del and fetchShifts are stable

  // Get shift by ID
  const getShift = useCallback(async (shiftId) => {
    try {
      const response = await get(`/work-schedule/shifts/${shiftId}`);
      return response.data.shift;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - get is stable

  // Initial data fetch
  useEffect(() => {
    fetchShifts();
  }, []); // No dependencies - fetchShifts is stable

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
