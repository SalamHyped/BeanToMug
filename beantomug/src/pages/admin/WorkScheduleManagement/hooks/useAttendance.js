import { useState, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);

  // Use the existing API config
  const apiConfig = getApiConfig();

  // Mark attendance for a schedule
  const markAttendance = async (scheduleId, status, notes = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `/work-schedule/schedules/${scheduleId}/attendance`, 
        { status, notes }, 
        apiConfig
      );
      return response.data.schedule;
    } catch (err) {
      console.error('Error marking attendance:', err);
      const errorMessage = err.response?.data?.message || 'Failed to mark attendance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get attendance reports
  const getAttendanceReports = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(
        `/work-schedule/reports/attendance?${params}`, 
        apiConfig
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching attendance reports:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch attendance reports';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's attendance
  const fetchTodaysAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `/work-schedule/schedules?date=${today}`, 
        apiConfig
      );
      setAttendanceData(response.data.schedules || []);
      return response.data.schedules || [];
    } catch (err) {
      console.error('Error fetching today\'s attendance:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch attendance data';
      setError(errorMessage);
      setAttendanceData([]);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch attendance for date range
  const fetchAttendanceByDateRange = useCallback(async (startDate, endDate, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(
        `/work-schedule/schedules?${params}`, 
        apiConfig
      );
      setAttendanceData(response.data.schedules || []);
      return response.data.schedules || [];
    } catch (err) {
      console.error('Error fetching attendance:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch attendance data';
      setError(errorMessage);
      setAttendanceData([]);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

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
