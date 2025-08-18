import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    user_id: '',
    shift_id: '',
    status: 'all',
    date_from: '',
    date_to: '',
    sortBy: 'schedule_date',
    sortOrder: 'asc'
  });

  // Use the existing API config
  const apiConfig = getApiConfig();

  // Fetch all schedules with filters
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/work-schedule/schedules?${params}`, apiConfig);
      setSchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.response?.data?.message || 'Failed to fetch schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Only depend on filters when they actually change

  // Fetch all shifts
  const fetchShifts = useCallback(async () => {
    try {
      const response = await axios.get('/work-schedule/shifts', apiConfig);
      setShifts(response.data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setShifts([]);
    }
  }, []);

  // Fetch users for scheduling
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/admin/users', apiConfig);
      setUsers(response.data.filter(user => user.status === 1) || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  }, []);

  // Create a new schedule
  const createSchedule = useCallback(async (scheduleData) => {
    try {
      const response = await axios.post('/work-schedule/schedules', scheduleData, apiConfig);
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      console.error('Error creating schedule:', err);
      throw err;
    }
  }, [fetchSchedules]);

  // Update an existing schedule
  const updateSchedule = useCallback(async (scheduleId, scheduleData) => {
    try {
      const response = await axios.put(`/work-schedule/schedules/${scheduleId}`, scheduleData, apiConfig);
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      console.error('Error updating schedule:', err);
      throw err;
    }
  }, [fetchSchedules]);

  // Delete a schedule
  const deleteSchedule = useCallback(async (scheduleId) => {
    try {
      await axios.delete(`/work-schedule/schedules/${scheduleId}`, apiConfig);
      await fetchSchedules(); // Refresh the list
    } catch (err) {
      console.error('Error deleting schedule:', err);
      throw err;
    }
  }, [fetchSchedules]);

  // Get a single schedule by ID
  const getSchedule = useCallback(async (scheduleId) => {
    try {
      const response = await axios.get(`/work-schedule/schedules/${scheduleId}`, apiConfig);
      return response.data.schedule;
    } catch (err) {
      console.error('Error fetching schedule:', err);
      throw err;
    }
  }, []);

  // Mark attendance for a schedule
  const markAttendance = useCallback(async (scheduleId, status, notes = '') => {
    try {
      const response = await axios.put(`/work-schedule/schedules/${scheduleId}/attendance`, {
        status,
        notes
      }, apiConfig);
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      console.error('Error marking attendance:', err);
      throw err;
    }
  }, [fetchSchedules]);

  // Check user availability for a specific date and shift
  const checkAvailability = useCallback(async (userId, shiftId, scheduleDate) => {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        shift_id: shiftId,
        schedule_date: scheduleDate
      });
      
      const response = await axios.get(`/work-schedule/schedules/availability?${params}`, apiConfig);
      const isAvailable = response.data.available;
      
      setAvailability(prev => ({
        ...prev,
        [`${userId}-${shiftId}-${scheduleDate}`]: isAvailable
      }));
      
      return isAvailable;
    } catch (err) {
      console.error('Error checking availability:', err);
      return false;
    }
  }, []);

  // Create multiple schedules at once
  const createBulkSchedules = useCallback(async (schedulesData) => {
    try {
      const response = await axios.post('/work-schedule/schedules/bulk', {
        schedules: schedulesData
      }, apiConfig);
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      console.error('Error creating bulk schedules:', err);
      throw err;
    }
  }, [fetchSchedules]);

  // Initial data fetch
  useEffect(() => {
    fetchShifts();
    fetchUsers();
  }, []); // Run once on mount

  // Fetch schedules whenever filters change (including initial load)
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]); // Only depend on the callback

  return {
    // Data
    schedules,
    shifts,
    users,
    availability,
    loading,
    error,
    filters,
    
    // Actions
    fetchSchedules,
    fetchShifts,
    fetchUsers,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    markAttendance,
    checkAvailability,
    createBulkSchedules,
    getSchedule,
    setFilters,
    
    // Computed values
    schedulesCount: schedules.length,
    activeSchedules: schedules.filter(s => s.status === 'scheduled'),
    completedSchedules: schedules.filter(s => s.status === 'completed'),
    absentSchedules: schedules.filter(s => s.status === 'absent'),
    cancelledSchedules: schedules.filter(s => s.status === 'cancelled')
  };
};

export default useSchedules;
