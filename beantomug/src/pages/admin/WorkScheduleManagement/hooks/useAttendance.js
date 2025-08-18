import { useState, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

const API_BASE_URL = 'http://localhost:8801/work-schedule';

const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use the existing API config
  const apiConfig = getApiConfig();

  // Mark attendance for a schedule
  const markAttendance = async (scheduleId, status, notes = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/schedules/${scheduleId}/attendance`, 
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
        `${API_BASE_URL}/reports/attendance?${params}`, 
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

  return {
    // State
    loading,
    error,
    
    // Actions
    markAttendance,
    getAttendanceReports
  };
};

export default useAttendance;
