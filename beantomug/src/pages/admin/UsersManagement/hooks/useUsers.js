import { useState, useCallback } from 'react';
import axios from 'axios';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (includeDeactivated = 'false') => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8801/admin/users?includeDeactivated=${includeDeactivated}`, {
        withCredentials: true
      });
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData) => {
    try {
      const response = await axios.post('http://localhost:8801/admin/users', userData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUsers(prevUsers => [...prevUsers, response.data.user]);
        setError(null);
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add user';
      setError(errorMessage);
      console.error('Error adding user:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteUser = useCallback(async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`http://localhost:8801/admin/users/${userId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          // User deleted successfully
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
          setError(null);
          return { success: true };
        } else if (response.data.action === 'deactivate') {
          // User should be deactivated instead of deleted
          const choice = await handleUserDeactivation(response.data, userId);
          return choice;
        }
        
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to delete user';
        setError(errorMessage);
        console.error('Error deleting user:', err);
        return { success: false, error: errorMessage };
      }
    }
    return { success: false, cancelled: true };
  }, []);

  const handleUserDeactivation = async (data, userId) => {
    let message = '';
    
    if (data.userRole === 'staff') {
      message = `Staff users cannot be deleted.\n\n` +
        `This user will be deactivated instead.\n\n` +
        `Continue with deactivation?`;
    } else if (data.userRole === 'customer') {
      message = `Customer has ${data.dataSummary.orderCount} existing order(s).\n\n` +
        `This customer will be deactivated instead of deleted.\n\n` +
        `Continue with deactivation?`;
    }
    
    const choice = window.confirm(message) ? 'deactivate' : 'cancel';
    
    if (choice === 'deactivate') {
      try {
        await axios.post(`http://localhost:8801/admin/users/${userId}/deactivate`, {}, {
          withCredentials: true
        });
        
        // Update user status in the list
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: false }
            : user
        ));
        
        setError(null);
        return { success: true, action: 'deactivated' };
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to deactivate user';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    }
    
    return { success: false, cancelled: true };
  };

  const reactivateUser = useCallback(async (userId) => {
    try {
      await axios.post(`http://localhost:8801/admin/users/${userId}/reactivate`, {}, {
        withCredentials: true
      });
      
              // Update user status in the list
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: true }
            : user
        ));
      
      setError(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reactivate user';
      setError(errorMessage);
      console.error('Error reactivating user:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    deleteUser,
    reactivateUser,
    clearError
  };
};
