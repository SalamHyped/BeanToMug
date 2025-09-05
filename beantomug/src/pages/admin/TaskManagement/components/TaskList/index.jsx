import React from 'react';
import styles from './index.module.css';

const TaskList = ({ tasks, loading, onEdit, onDelete, onStatusChange, onViewDetails, userRole = 'admin' }) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAssignments = (assignments) => {
    try {
      console.log('formatAssignments called with:', assignments);
      
      if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
        return 'Unassigned';
      }
      
      // Backend returns assignments as array of usernames (strings)
      // Filter out empty strings and join with commas
      const formatted = assignments
        .filter(a => a && typeof a === 'string' && a.trim() !== '')
        .join(', ');
      
      console.log('Final formatted assignments:', formatted);
      return formatted || 'Unassigned';
    } catch (error) {
      console.error('Error in formatAssignments:', assignments, error);
      return 'Unassigned';
    }
  };

  // Get allowed status transitions based on current status
  const getAllowedStatuses = (currentStatus) => {
    try {
      if (!currentStatus) {
        console.warn('getAllowedStatuses called with undefined/null status');
        return ['pending', 'in_progress', 'completed', 'cancelled'];
      }
      
      switch (currentStatus) {
        case 'pending':
          return ['pending', 'in_progress', 'cancelled'];
        case 'in_progress':
          return ['pending', 'in_progress', 'completed', 'cancelled'];
        case 'completed':
          return ['completed']; // Cannot change from completed
        case 'cancelled':
          return ['cancelled']; // Cannot change from cancelled
        default:
          console.warn('Unknown status:', currentStatus);
          return ['pending', 'in_progress', 'completed', 'cancelled'];
      }
    } catch (error) {
      console.error('Error in getAllowedStatuses:', currentStatus, error);
      return ['pending', 'in_progress', 'completed', 'cancelled'];
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <h3>No tasks found</h3>
        <p>Create your first task to get started with task management.</p>
      </div>
    );
  }

  return (
    <div className={styles.taskList}>
      <div className={styles.listHeader}>
        <h3>Tasks ({tasks.length})</h3>
      </div>
      
      <div className={styles.tasksGrid}>
        {tasks.map(task => {
          // Safety check for task object
          if (!task || !task.task_id) {
            console.error('Invalid task object:', task);
            return null;
          }
          
          return (
          <div key={task.task_id} className={styles.taskCard}>
            <div className={styles.taskHeader}>
              <div className={styles.taskTitle}>
                <h4>{task.title}</h4>
                <div className={styles.taskMeta}>
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
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
                      <div className={styles.taskActions}>
          <button
            onClick={() => onViewDetails && onViewDetails(task.task_id)}
            className={styles.actionButton}
            title="View details and comments"
          >
            👁️
          </button>
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => onEdit(task)}
                className={styles.actionButton}
                title="Edit task"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(task.task_id)}
                className={styles.actionButton}
                title="Delete task"
              >
                🗑️
              </button>
            </>
          )}
        </div>
            </div>

            <div className={styles.taskContent}>
              <p className={styles.taskDescription}>{task.description}</p>
              
              <div className={styles.taskDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Assigned to:</span>
                  <span className={styles.detailValue}>{formatAssignments(task.assignments)}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Due date:</span>
                  <span className={styles.detailValue}>{formatDate(task.due_date)}</span>
                </div>
                
                {task.estimated_hours && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Estimated:</span>
                    <span className={styles.detailValue}>{task.estimated_hours}h</span>
                  </div>
                )}
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created by:</span>
                  <span className={styles.detailValue}>{task.assigned_by_name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className={styles.taskFooter}>
              <div className={styles.statusActions}>
                <select
                  value={task.status || 'pending'}
                  onChange={(e) => {
                    try {
                      onStatusChange(task.task_id, e.target.value);
                    } catch (error) {
                      console.error('Error in status change:', error);
                    }
                  }}
                  className={styles.statusSelect}
                  disabled={task.status === 'completed' || task.status === 'cancelled'}
                >
                  {getAllowedStatuses(task.status).map(status => {
                    try {
                      return (
                        <option key={status} value={status}>
                          {status === 'pending' && 'Pending'}
                          {status === 'in_progress' && 'In Progress'}
                          {status === 'completed' && 'Completed'}
                          {status === 'cancelled' && 'Cancelled'}
                        </option>
                      );
                    } catch (error) {
                      console.error('Error rendering status option:', status, error);
                      return null;
                    }
                  })}
                </select>
                {(task.status === 'completed' || task.status === 'cancelled') && (
                  <span className={styles.statusLocked}>
                    🔒 Locked
                  </span>
                )}
              </div>
              
              <div className={styles.taskDate}>
                Created: {new Date(task.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;
