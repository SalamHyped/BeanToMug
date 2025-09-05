import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../../../utils/config';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${getApiConfig().baseURL}/tasks`, {
        withCredentials: true
      });
      
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      setError(null);
      
      const response = await axios.post(`${getApiConfig().baseURL}/tasks`, taskData, {
        withCredentials: true
      });
      
      if (response.data.message) {
        // Refresh tasks after successful creation
        await fetchTasks();
        return { success: true, data: response.data };
      }
      
      throw new Error('Failed to create task');
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchTasks]);

  const updateTask = useCallback(async (taskId, taskData) => {
    try {
      setError(null);
      
      const response = await axios.put(`${getApiConfig().baseURL}/tasks/${taskId}`, taskData, {
        withCredentials: true
      });
      
      if (response.data.message) {
        // Refresh tasks after successful update
        await fetchTasks();
        return { success: true, data: response.data };
      }
      
      throw new Error('Failed to update task');
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      setError(null);
      
      const response = await axios.delete(`${getApiConfig().baseURL}/tasks/${taskId}`, {
        withCredentials: true
      });
      
      if (response.data.message) {
        // Refresh tasks after successful deletion
        await fetchTasks();
        return { success: true, data: response.data };
      }
      
      throw new Error('Failed to delete task');
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchTasks]);

  const refreshTasks = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks
  };
};
