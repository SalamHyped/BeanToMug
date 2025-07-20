import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import styles from './Dashboard.module.css';
import RealTimeDashboard from "../../components/RealTimeDashboard";

const AdminDashboard = () => {
  const { isSidebarCollapsed } = useOutletContext() || { isSidebarCollapsed: false };
  const [tasks, setTasks] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignments: [],
    priority: 'medium',
    due_date: '',
    estimated_hours: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchStaffUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8801/tasks', {
        withCredentials: true
      });
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8801/tasks/users/staff', {
        withCredentials: true
      });
      setStaffUsers(response.data);
    } catch (error) {
      console.error('Error fetching staff users:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8801/tasks', newTask, {
        withCredentials: true
      });
      setNewTask({
        title: '',
        description: '',
        assignments: [],
        priority: 'medium',
        due_date: '',
        estimated_hours: ''
      });
      setShowCreateForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.task_id === taskId);
      await axios.put(`http://localhost:8801/tasks/${taskId}`, {
        ...task,
        status: newStatus
      }, {
        withCredentials: true
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const addAssignment = () => {
    setNewTask({
      ...newTask,
      assignments: [...newTask.assignments, '']
    });
  };

  const removeAssignment = (index) => {
    const updatedAssignments = newTask.assignments.filter((_, i) => i !== index);
    setNewTask({
      ...newTask,
      assignments: updatedAssignments
    });
  };

  const updateAssignment = (index, value) => {
    const updatedAssignments = [...newTask.assignments];
    updatedAssignments[index] = value;
    setNewTask({
      ...newTask,
      assignments: updatedAssignments
    });
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
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div className={`${styles.dashboard} ${isSidebarCollapsed ? styles.dashboardCollapsed : ''}`}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Create New Task
        </button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className={styles.formGroup}>
                <label>Title:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Assignments:</label>
                <div className={styles.assignmentsContainer}>
                  {newTask.assignments.map((assignment, index) => (
                    <div key={index} className={styles.assignmentRow}>
                      <select
                        value={assignment}
                        onChange={(e) => updateAssignment(index, e.target.value)}
                        required
                      >
                        <option value="">Select Staff Member</option>
                        {staffUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAssignment}
                    className={styles.addAssignmentButton}
                  >
                    + Add Assignment
                  </button>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Priority:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Due Date:</label>
                <input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Estimated Hours:</label>
                <input
                  type="number"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value})}
                />
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Create Task
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className={styles.tasksContainer}>
        <h2>All Tasks</h2>
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
                  {task.assignments.map((username, index) => (
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Dashboard */}
      <div className={styles.realTimeSection}>
        <h2>Real-Time Monitoring</h2>
        <RealTimeDashboard />
      </div>
    </div>
  );
};

export default AdminDashboard; 