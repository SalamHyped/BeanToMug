import { useState, useEffect, useCallback, useMemo } from 'react';
import useApiBase from './useApiBase';

const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Get API functions from useApiBase (these are stable)
  const { loading, error, get, post, put, delete: del } = useApiBase();

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

  // Memoize filter values to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.search,
    filters.user_id,
    filters.shift_id,
    filters.status,
    filters.date_from,
    filters.date_to,
    filters.sortBy,
    filters.sortOrder
  ]);

  // Fetch all schedules with filters
  const fetchSchedules = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(memoizedFilters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await get(`/work-schedule/schedules?${params}`);
      setSchedules(response.data.schedules || []);
    } catch (err) {
      setSchedules([]);
      // Error is handled by useApiBase
    }
  }, [memoizedFilters]); // Depend on memoized filters, NOT on get function

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

  // Fetch users for scheduling
  const fetchUsers = useCallback(async () => {
    try {
      const response = await get('/admin/users');
      setUsers(response.data.filter(user => user.status === 1) || []);
    } catch (err) {
      setUsers([]);
      // Error is handled by useApiBase
    }
  }, []); // No dependencies - get is stable

  // Create a new schedule
  const createSchedule = useCallback(async (scheduleData) => {
    try {
      const response = await post('/work-schedule/schedules', scheduleData);
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - post and fetchSchedules are stable

  // Update an existing schedule
  const updateSchedule = useCallback(async (scheduleId, scheduleData) => {
    try {
      const response = await put(`/work-schedule/schedules/${scheduleId}`, scheduleData);
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - put and fetchSchedules are stable

  // Delete a schedule
  const deleteSchedule = useCallback(async (scheduleId) => {
    try {
      await del(`/work-schedule/schedules/${scheduleId}`);
      await fetchSchedules(); // Refresh the list
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - del and fetchSchedules are stable

  // Get a single schedule by ID
  const getSchedule = useCallback(async (scheduleId) => {
    try {
      const response = await get(`/work-schedule/schedules/${scheduleId}`);
      return response.data.schedule;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - get is stable

  // Mark attendance for a schedule
  const markAttendance = useCallback(async (scheduleId, status, notes = '') => {
    try {
      const response = await put(`/work-schedule/schedules/${scheduleId}/attendance`, {
        status,
        notes
      });
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - put and fetchSchedules are stable

  // Check shift availability and staffing info
  const checkAvailability = useCallback(async (shiftId, scheduleDate) => {
    try {
      const params = new URLSearchParams({
        shift_id: shiftId,
        schedule_date: scheduleDate
      });
      
      const response = await get(`/work-schedule/availability?${params}`);
      return response.data;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - get is stable

  // Create multiple schedules at once
  const createBulkSchedules = useCallback(async (schedulesData) => {
    try {
      const response = await post('/work-schedule/schedules/bulk', {
        schedules: schedulesData
      });
      await fetchSchedules(); // Refresh the list
      return response.data;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - post and fetchSchedules are stable

  // Initial data fetch
  useEffect(() => {
    fetchShifts();
    fetchUsers();
  }, []); // Run once on mount

  // Fetch schedules whenever filters change (including initial load)
  useEffect(() => {
    fetchSchedules();
  }, [memoizedFilters]); // Depend on memoized filters, not fetchSchedules function

  return {
    // Data
    schedules,
    shifts,
    users,
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
