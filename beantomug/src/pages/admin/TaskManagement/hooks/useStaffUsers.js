import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

export const useStaffUsers = () => {
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaffUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${getApiConfig().baseURL}/admin/users`, {
        withCredentials: true
      });
      
      // Filter for staff users only
      const staff = response.data.filter(user => user.role === 'staff');
      setStaffUsers(staff);
    } catch (error) {
      console.error('Error fetching staff users:', error);
      setError(error.response?.data?.error || 'Failed to fetch staff users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffUsers();
  }, [fetchStaffUsers]);

  return {
    staffUsers,
    loading,
    error,
    refreshStaffUsers: fetchStaffUsers
  };
};
