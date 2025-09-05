import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import socketService from '../services/socketService';
import { getApiConfig } from '../utils/config';

export const useTaskManagement = (userRole = 'staff') => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);

  // Fetch tasks based on user role
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = userRole === 'admin' ? '/tasks' : '/tasks/my-tasks';
      const response = await axios.get(`${getApiConfig().baseURL}${endpoint}`, {
        withCredentials: true
      });
      
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Fetch staff users (admin only)
  const fetchStaffUsers = useCallback(async () => {
    if (userRole !== 'admin') {
      setStaffUsers([]);
      return;
    }

    try {
      const response = await axios.get(`${getApiConfig().baseURL}/admin/users`, {
        withCredentials: true
      });
      
      // Filter for staff users only
      const staff = response.data.filter(user => user.role === 'staff');
      setStaffUsers(staff);
    } catch (error) {
      console.error('Error fetching staff users:', error);
      // Don't set error for staff users fetch failure
    }
  }, [userRole]);

  // Create task (admin only)
  const createTask = useCallback(async (taskData) => {
    if (userRole !== 'admin') {
      throw new Error('Only admins can create tasks');
    }

    try {
      setError(null);
      
      const response = await axios.post(`${getApiConfig().baseURL}/tasks`, taskData, {
        withCredentials: true
      });
      
      if (response.data.message) {
        await fetchTasks(); // Refresh tasks
        return { success: true, data: response.data };
      }
      
      throw new Error('Failed to create task');
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userRole, fetchTasks]);

  // Update task
  const updateTask = useCallback(async (taskId, taskData) => {
    try {
      setError(null);
      
      // Find the current task to validate status transition
      const currentTask = tasks.find(task => task.task_id === taskId);
      
      // Validate status transition if status is being changed
      if (taskData.status && currentTask) {
        const allowedTransitions = {
          'pending': ['pending', 'in_progress', 'cancelled'],
          'in_progress': ['pending', 'in_progress', 'completed', 'cancelled'],
          'completed': ['completed'], // Cannot change from completed
          'cancelled': ['cancelled']  // Cannot change from cancelled
        };
        
        const currentStatus = currentTask.status;
        const newStatus = taskData.status;
        
        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
          console.error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
          throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
      }
      
      const response = await axios.put(`${getApiConfig().baseURL}/tasks/${taskId}`, taskData, {
        withCredentials: true
      });
      
      if (response.data.message) {
        await fetchTasks(); // Refresh tasks
        return { success: true, data: response.data };
      }
      
      throw new Error('Failed to update task');
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tasks, fetchTasks]);

  // Delete task (admin only)
  const deleteTask = useCallback(async (taskId) => {
    if (userRole !== 'admin') {
      throw new Error('Only admins can delete tasks');
    }

    try {
      setError(null);
      
      const response = await axios.delete(`${getApiConfig().baseURL}/tasks/${taskId}`, {
        withCredentials: true
      });
      
      if (response.data.message) {
        await fetchTasks(); // Refresh tasks
        return { success: true, data: response.data };
      }
      
      throw new Error('Failed to delete task');
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userRole, fetchTasks]);

  // WebSocket handlers
  const handleNewTask = useCallback((taskData) => {
    console.log(`${userRole} TaskManagement: Received new task:`, taskData);
    
    setTasks(prev => [{
      task_id: taskData.taskId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'pending',
      due_date: taskData.dueDate,
      estimated_hours: taskData.estimated_hours,
      assigned_by_name: taskData.assignedBy,
      assignments: taskData.assignments || [],
      created_at: taskData.createdAt
    }, ...prev]);
  }, [userRole]);

  const handleTaskUpdate = useCallback((taskData) => {
    setTasks(prev => prev.map(task => 
      task.task_id === taskData.taskId 
        ? { 
            ...task, 
            title: taskData.title,
            status: taskData.status,
            priority: taskData.priority
          }
        : task
    ));
  }, []);

  // Initialize
  useEffect(() => {
    fetchTasks();
    fetchStaffUsers();
  }, [fetchTasks, fetchStaffUsers]);

  // WebSocket listeners
  useEffect(() => {
    if (socketService.isConnected) {
      console.log(`${userRole} TaskManagement: Setting up WebSocket listeners`);
      
      socketService.on('newTask', handleNewTask);
      socketService.on('taskUpdate', handleTaskUpdate);

      return () => {
        console.log(`${userRole} TaskManagement: Cleaning up WebSocket listeners`);
        socketService.off('newTask', handleNewTask);
        socketService.off('taskUpdate', handleTaskUpdate);
      };
    }
  }, [userRole, handleNewTask, handleTaskUpdate]);



  return {
    // Data
    tasks,
    staffUsers,
    loading,
    error,
    
    // Actions
    createTask: userRole === 'admin' ? createTask : null,
    updateTask,
    deleteTask: userRole === 'admin' ? deleteTask : null,
    refreshTasks: fetchTasks,
    refreshStaffUsers: fetchStaffUsers,
    
    // Permissions
    canCreate: userRole === 'admin',
    canEdit: userRole === 'admin',
    canDelete: userRole === 'admin',
    canFilter: true
  };
};
