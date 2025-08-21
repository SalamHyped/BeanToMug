import { useState, useCallback } from 'react';
import useApiBase from './useApiBase';

const useAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  
  // Get API functions from useApiBase (these are stable)
  const { loading, error, get, put } = useApiBase();

  // Mark attendance for a schedule
  const markAttendance = useCallback(async (scheduleId, status, notes = '') => {
    try {
      const response = await put(
        `/work-schedule/schedules/${scheduleId}/attendance`, 
        { status, notes }
      );
      return response.data.schedule;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - put is stable

  // Get attendance reports
  const getAttendanceReports = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await get(`/work-schedule/reports/attendance?${params}`);
      return response.data;
    } catch (err) {
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - get is stable

  // Fetch today's attendance
  const fetchTodaysAttendance = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await get(`/work-schedule/schedules?date=${today}`);
      setAttendanceData(response.data.schedules || []);
      return response.data.schedules || [];
    } catch (err) {
      setAttendanceData([]);
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - get is stable

  // Fetch attendance for date range
  const fetchAttendanceByDateRange = useCallback(async (startDate, endDate, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await get(`/work-schedule/schedules?${params}`);
      setAttendanceData(response.data.schedules || []);
      return response.data.schedules || [];
    } catch (err) {
      setAttendanceData([]);
      throw err; // Re-throw for component handling
    }
  }, []); // No dependencies - get is stable

  return {
    // State
    loading,
    error,
    attendanceData,
    
    // Actions
    markAttendance,
    getAttendanceReports,
    fetchTodaysAttendance,
    fetchAttendanceByDateRange,
    setAttendanceData
  };
};

export default useAttendance;