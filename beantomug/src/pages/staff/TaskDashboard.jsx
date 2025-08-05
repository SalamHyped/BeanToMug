import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../../services/socketService';
import styles from './TaskDashboard.module.css';

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchMyTasks();
  }, []);

  // WebSocket listeners for real-time task updates
  useEffect(() => {
    if (socketService.isConnected) {
      console.log('Staff TaskDashboard: Setting up WebSocket listeners');
      
      // Listen for new tasks assigned to this staff member
      socketService.on('newTask', handleNewTask);
      
      // Listen for task updates
      socketService.on('taskUpdate', handleTaskUpdate);

      return () => {
        console.log('Staff TaskDashboard: Cleaning up WebSocket listeners');
        socketService.off('newTask', handleNewTask);
        socketService.off('taskUpdate', handleTaskUpdate);
      };
    } else {
      console.log('Staff TaskDashboard: Socket not connected, cannot set up listeners');
    }
  }, []);

  const handleNewTask = (taskData) => {
    console.log('Staff TaskDashboard: Received new task:', taskData);
    
    // For now, add the task and let the backend filter it
    // The backend should only send tasks assigned to this user
    setTasks(prev => [{
      task_id: taskData.taskId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'pending',
      due_date: taskData.dueDate,
      estimated_hours: taskData.estimated_hours,
      assigned_by_name: taskData.assignedBy,
      all_assignments: taskData.assignments || [],
      created_at: taskData.createdAt
    }, ...prev]);
  };

  const handleTaskUpdate = (taskData) => {
    console.log('Staff TaskDashboard: Received task update:', taskData);
    
    // Update specific task in the list
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
  };

  const fetchMyTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8801/tasks/my-tasks', {
        withCredentials: true
      });
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.task_id === taskId);
      
      // Optimistic update - update UI immediately
      setTasks(prev => prev.map(t => 
        t.task_id === taskId 
          ? { ...t, status: newStatus }
          : t
      ));
      
      // Send update to backend
      await axios.put(`http://localhost:8801/tasks/${taskId}`, {
        ...task,
        status: newStatus
      }, {
        withCredentials: true
      });
      
      // No need to fetch all tasks again - WebSocket will handle updates
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on error
      setTasks(prev => prev.map(t => 
        t.task_id === taskId 
          ? { ...t, status: task.status } // Revert to original status
          : t
      ));
    }
  };

  const handleAddComment = async (taskId) => {
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`http://localhost:8801/tasks/${taskId}/comments`, {
        comment: newComment
      }, {
        withCredentials: true
      });
      setNewComment('');
      fetchTaskDetails(taskId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`http://localhost:8801/tasks/${taskId}`, {
        withCredentials: true
      });
      setSelectedTask(response.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'pending': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading your tasks...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>My Tasks</h1>
        <p>Manage your assigned tasks and track progress</p>
      </div>

      <div className={styles.tasksContainer}>
        <div className={styles.tasksGrid}>
          {tasks.map(task => (
            <div key={task.task_id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.title}</h3>
                <div className={styles.taskBadges}>
                  <span 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
              
              <p className={styles.taskDescription}>{task.description}</p>
              
              <div className={styles.taskDetails}>
                <p><strong>Assigned by:</strong> {task.assigned_by_name}</p>
                <p><strong>Team:</strong></p>
                <div className={styles.assignmentsList}>
                  {task.all_assignments.map((username, index) => (
                    <span 
                      key={index}
                      className={styles.assignmentBadge}
                    >
                      {username}
                    </span>
                  ))}
                </div>
                {task.due_date && (
                  <p><strong>Due:</strong> {new Date(task.due_date).toLocaleDateString()}</p>
                )}
                {task.estimated_hours && (
                  <p><strong>Estimated:</strong> {task.estimated_hours}h</p>
                )}
              </div>
              
              <div className={styles.taskActions}>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.task_id, e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button 
                  className={styles.viewButton}
                  onClick={() => fetchTaskDetails(task.task_id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className={styles.emptyState}>
            <h3>No tasks assigned</h3>
            <p>You don't have any tasks assigned to you at the moment.</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedTask.title}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedTask(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.taskInfo}>
              <p><strong>Description:</strong> {selectedTask.description}</p>
              <p><strong>Status:</strong> 
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(selectedTask.status) }}
                >
                  {selectedTask.status}
                </span>
              </p>
              <p><strong>Priority:</strong> 
                <span 
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                >
                  {selectedTask.priority}
                </span>
              </p>
              <p><strong>Assigned by:</strong> {selectedTask.assigned_by_name}</p>
              <p><strong>Team:</strong></p>
              <div className={styles.assignmentsList}>
                {selectedTask.assignments.map((username, index) => (
                  <span 
                    key={index}
                    className={styles.assignmentBadge}
                  >
                    {username}
                  </span>
                ))}
              </div>
              {selectedTask.due_date && (
                <p><strong>Due date:</strong> {new Date(selectedTask.due_date).toLocaleString()}</p>
              )}
              {selectedTask.estimated_hours && (
                <p><strong>Estimated hours:</strong> {selectedTask.estimated_hours}h</p>
              )}
            </div>

            <div className={styles.commentsSection}>
              <h3>Comments</h3>
              <div className={styles.commentsList}>
                {selectedTask.comments && selectedTask.comments.map(comment => (
                  <div key={comment.comment_id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <strong>{comment.user_name}</strong>
                      <span>{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p>{comment.comment}</p>
                  </div>
                ))}
              </div>
              
              <div className={styles.addComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={styles.commentInput}
                />
                <button 
                  onClick={() => handleAddComment(selectedTask.task_id)}
                  className={styles.addCommentButton}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard; 