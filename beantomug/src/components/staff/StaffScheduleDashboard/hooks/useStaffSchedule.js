import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useStaffSchedule = (userId) => {
  const [mySchedules, setMySchedules] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch my personal schedules
  const fetchMySchedules = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const apiConfig = getApiConfig(); // Get fresh config inside the function
      const response = await axios.get(
        `/work-schedule/schedules?user_id=${userId}`,
        apiConfig
      );
      setMySchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Error fetching my schedules:', err);
      setError(err.response?.data?.message || 'Failed to fetch your schedules');
      setMySchedules([]);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Remove apiConfig from dependencies

  // Fetch available shifts that can be claimed
  const fetchAvailableShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simple API call - backend automatically applies admin's planning settings
      const response = await axios.get('/work-schedule/shifts/available', getApiConfig());
      setAvailableShifts(response.data.available_shifts || []);
      console.log('Fetched available shifts:', response.data.available_shifts?.length || 0, 'shifts');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch available shifts');
      setAvailableShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Claim an available shift
  const claimShift = async (shiftId, date, notes = '') => {
    if (!userId) throw new Error('User ID is required');
    
    setLoading(true);
    setError(null);
    try {
      const apiConfig = getApiConfig();
      const response = await axios.post(
        '/work-schedule/schedules',
        {
          user_id: userId,
          shift_id: shiftId,
          schedule_date: date,
          notes: notes || 'Self-assigned shift'
        },
        apiConfig
      );
      return response.data.schedule;
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to claim shift';
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Release a claimed shift back to available pool
  const releaseShift = async (scheduleId) => {
    setLoading(true);
    setError(null);
    try {
      const apiConfig = getApiConfig();
      await axios.delete(
        `/work-schedule/schedules/${scheduleId}`,
        apiConfig
      );
      return true;
    } catch (err) {
      console.error('Error releasing shift:', err);
      const errorMessage = err.response?.data?.message || 'Failed to release shift';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Request shift swap (future feature)
  const requestShiftSwap = async (scheduleId, targetUserId, message = '') => {
    setLoading(true);
    setError(null);
    try {
      const apiConfig = getApiConfig();
      const response = await axios.post(
        '/work-schedule/shift-swaps',
        {
          from_schedule_id: scheduleId,
          target_user_id: targetUserId,
          message
        },
        apiConfig
      );
      return response.data.swap_request;
    } catch (err) {
      console.error('Error requesting shift swap:', err);
      const errorMessage = err.response?.data?.message || 'Failed to request shift swap';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get shift history for reports
  const fetchShiftHistory = useCallback(async (startDate, endDate) => {
    if (!userId) return [];
    
    setLoading(true);
    setError(null);
    try {
      const apiConfig = getApiConfig();
      const params = new URLSearchParams();
      params.append('user_id', userId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await axios.get(
        `/work-schedule/schedules?${params}`,
        apiConfig
      );
      return response.data.schedules || [];
    } catch (err) {
      console.error('Error fetching shift history:', err);
      setError(err.response?.data?.message || 'Failed to fetch shift history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]); // Remove apiConfig from dependencies

  // Initial data load
  useEffect(() => {
    if (userId) {
      fetchMySchedules();
      fetchAvailableShifts();
    }
  }, [userId, fetchMySchedules, fetchAvailableShifts]);

  return {
    // Data
    mySchedules,
    availableShifts,
    loading,
    error,
    
    // Actions
    fetchMySchedules,
    fetchAvailableShifts,
    claimShift,
    releaseShift,
    requestShiftSwap,
    fetchShiftHistory,
    
    // Computed values
    upcomingShifts: mySchedules.filter(schedule => 
      new Date(schedule.schedule_date) >= new Date()
    ),
    pastShifts: mySchedules.filter(schedule => 
      new Date(schedule.schedule_date) < new Date()
    ),
    todaysShifts: mySchedules.filter(schedule => 
      new Date(schedule.schedule_date).toDateString() === new Date().toDateString()
    )
  };
};

export default useStaffSchedule;
