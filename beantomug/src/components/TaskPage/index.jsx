import React, { useState } from 'react';
import axios from 'axios';
import TaskList from '../../pages/admin/TaskManagement/components/TaskList';
import TaskForm from '../../pages/admin/TaskManagement/components/TaskForm';
import TaskFilters from '../../pages/admin/TaskManagement/components/TaskFilters';
import { useTaskManagement } from '../../hooks/useTaskManagement';
import styles from './index.module.css';

const TaskPage = ({ 
  userRole = 'staff', // 'admin' or 'staff'
  showCreateForm = false,
  showFilters = false,
  showEditDelete = false,
  title = 'My Tasks',
  subtitle = 'Manage your assigned tasks and track progress'
}) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showCreateFormState, setShowCreateFormState] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    search: ''
  });

  // Use unified hook for all task management
  const {
    tasks,
    staffUsers,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    canCreate,
    canEdit,
    canDelete
  } = useTaskManagement(userRole);



  // Simplified handlers using the unified hook
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleEdit = (task) => {
    if (showEditDelete && canEdit) {
      setEditingTask(task);
    }
  };

  const handleDelete = async (taskId) => {
    if (showEditDelete && canDelete) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleCreateTask = async (taskData) => {
    if (canCreate) {
      try {
        await createTask(taskData);
      } catch (error) {
        console.error('Error creating task:', error);
      }
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

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status && task.status !== filters.status) return false;
    
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) return false;
    
    // Assigned to filter
    if (filters.assignedTo) {
      // Find the user by ID to get their username
      const selectedUser = staffUsers.find(user => user.id.toString() === filters.assignedTo);
      if (!selectedUser || !task.assignments?.includes(selectedUser.username)) {
        return false;
      }
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(searchTerm);
      const descriptionMatch = task.description?.toLowerCase().includes(searchTerm);
      const statusMatch = task.status?.toLowerCase().includes(searchTerm);
      const priorityMatch = task.priority?.toLowerCase().includes(searchTerm);
      
      if (!titleMatch && !descriptionMatch && !statusMatch && !priorityMatch) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div className={styles.taskPage}>
      <div className={styles.header}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {/* Create Task Button (Admin only) */}
      {showCreateForm && canCreate && !showCreateFormState && (
        <div className={styles.createButtonSection}>
          <button
            onClick={() => setShowCreateFormState(true)}
            className={styles.createButton}
          >
            ➕ Create New Task
          </button>
        </div>
      )}

      {/* Task Creation Form (Admin only) */}
      {showCreateForm && canCreate && showCreateFormState && (
        <div className={styles.createSection}>
          <div className={styles.createFormHeader}>
            <h3>Create New Task</h3>
            <button
              onClick={() => setShowCreateFormState(false)}
              className={styles.closeButton}
            >
              ✕
            </button>
          </div>
          <TaskForm
            onSubmit={(taskData) => {
              handleCreateTask(taskData);
              setShowCreateFormState(false); // Hide form after creation
            }}
            staffUsers={staffUsers}
            isSubmitting={false}
          />
        </div>
      )}

       {/* Task Filters */}
       {showFilters && (
         <div className={styles.filtersSection}>
           <TaskFilters
             filters={filters}
             onFiltersChange={setFilters}
             staffUsers={staffUsers}
             userRole={userRole}
           />
         </div>
       )}

      {/* Task List */}
      <div className={styles.tasksContainer}>
        <TaskList 
          tasks={filteredTasks}
          loading={loading}
          onEdit={showEditDelete ? handleEdit : () => {}}
          onDelete={showEditDelete ? handleDelete : () => {}}
          onStatusChange={handleStatusChange}
          onViewDetails={fetchTaskDetails}
          userRole={userRole}
        />
      </div>

             {/* Task Edit Modal (Admin only) */}
       {editingTask && showEditDelete && canEdit && (
         <div className={styles.modal}>
           <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h2>Edit Task</h2>
               <button 
                 className={styles.closeButton}
                 onClick={() => setEditingTask(null)}
               >
                 ×
               </button>
             </div>
             <TaskForm
               mode="edit"
               task={editingTask}
               onSubmit={async (taskData) => {
                 try {
                   await updateTask(editingTask.task_id, taskData);
                   setEditingTask(null);
                 } catch (error) {
                   console.error('Error updating task:', error);
                 }
               }}
               onCancel={() => setEditingTask(null)}
               staffUsers={staffUsers}
               isSubmitting={false}
             />
           </div>
         </div>
       )}

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
                  style={{ 
                    backgroundColor: selectedTask.status === 'completed' ? '#28a745' :
                                   selectedTask.status === 'in_progress' ? '#007bff' :
                                   selectedTask.status === 'pending' ? '#ffc107' :
                                   selectedTask.status === 'cancelled' ? '#dc3545' : '#6c757d'
                  }}
                >
                  {selectedTask.status}
                </span>
              </p>
              <p><strong>Priority:</strong> 
                <span 
                  className={styles.priorityBadge}
                  style={{ 
                    backgroundColor: selectedTask.priority === 'urgent' ? '#dc3545' :
                                   selectedTask.priority === 'high' ? '#fd7e14' :
                                   selectedTask.priority === 'medium' ? '#ffc107' :
                                   selectedTask.priority === 'low' ? '#28a745' : '#6c757d'
                  }}
                >
                  {selectedTask.priority}
                </span>
              </p>
              <p><strong>Assigned by:</strong> {selectedTask.assigned_by_name}</p>
              <p><strong>Team:</strong></p>
              <div className={styles.assignmentsList}>
                {selectedTask.assignments?.map((username, index) => (
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
                {selectedTask.comments?.map(comment => (
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
                  className={styles.addCommentButton}
                  onClick={() => handleAddComment(selectedTask.task_id)}
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

export default TaskPage;
