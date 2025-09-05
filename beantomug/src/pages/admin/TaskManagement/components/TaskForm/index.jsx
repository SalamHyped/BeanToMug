import React, { useState, useEffect } from 'react';
import { useStaffUsers } from '../../hooks/useStaffUsers';
import styles from './index.module.css';

const TaskForm = ({ mode, task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    assignments: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const { staffUsers, loading: staffLoading } = useStaffUsers();

  // Filter out already selected staff
  const availableStaff = staffUsers.filter(user => 
    !formData.assignments.includes(user.id.toString())
  );

  const selectedStaff = staffUsers.filter(user => formData.assignments.includes(user.id.toString()));

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || `User ${user.id}`;
  };

  useEffect(() => {
    if (mode === 'edit' && task) {
      console.log('TaskForm edit mode - task data:', task);
      console.log('TaskForm edit mode - assignments:', task.assignments);
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours || '',
        assignments: task.assignments?.map(a => {
          // Handle both object format (with user_id) and string format (username)
          if (typeof a === 'object' && a.user_id) {
            return a.user_id.toString();
          } else if (typeof a === 'string') {
            // If it's a string (username), we need to find the user_id
            const user = staffUsers.find(u => u.username === a);
            return user ? user.id.toString() : '';
          }
          return '';
        }).filter(id => id) || []
      });
    }
  }, [mode, task, staffUsers]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAssignmentChange = (userId, checked) => {
    setFormData(prev => ({
      ...prev,
      assignments: checked
        ? [...prev.assignments, userId]
        : prev.assignments.filter(id => id !== userId)
    }));
  };

  const handleAddStaff = () => {
    if (selectedStaffId && !formData.assignments.includes(selectedStaffId)) {
      setFormData(prev => ({
        ...prev,
        assignments: [...prev.assignments, selectedStaffId]
      }));
      setSelectedStaffId(''); // Reset dropdown
    }
  };

  const handleRemoveStaff = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.filter(id => id !== userId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.assignments.length === 0) {
      newErrors.assignments = 'At least one staff member must be assigned';
    }

    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      newErrors.due_date = 'Due date cannot be in the past';
    }

    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours <= 0)) {
      newErrors.estimated_hours = 'Estimated hours must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        ...formData,
        assignments: formData.assignments.map(id => parseInt(id)),
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{mode === 'create' ? 'Create New Task' : 'Edit Task'}</h2>
        <p>{mode === 'create' ? 'Assign a new task to your team members' : 'Update task details and assignments'}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label htmlFor="title">Task Title *</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={errors.title ? styles.inputError : ''}
            placeholder="Enter task title"
            disabled={isSubmitting}
          />
          {errors.title && <span className={styles.errorText}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            placeholder="Describe the task in detail"
            rows={4}
            disabled={isSubmitting}
          />
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        </div>

        {/* Priority and Due Date Row */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="due_date">Due Date</label>
            <input
              type="date"
              id="due_date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className={errors.due_date ? styles.inputError : ''}
              disabled={isSubmitting}
            />
            {errors.due_date && <span className={styles.errorText}>{errors.due_date}</span>}
          </div>
        </div>

        {/* Estimated Hours */}
        <div className={styles.formGroup}>
          <label htmlFor="estimated_hours">Estimated Hours</label>
          <input
            type="number"
            id="estimated_hours"
            value={formData.estimated_hours}
            onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
            className={errors.estimated_hours ? styles.inputError : ''}
            placeholder="e.g., 2.5"
            min="0"
            step="0.5"
            disabled={isSubmitting}
          />
          {errors.estimated_hours && <span className={styles.errorText}>{errors.estimated_hours}</span>}
        </div>

        {/* Staff Assignments */}
        <div className={styles.formGroup}>
          <label>Assign to Staff Members *</label>
          
          {staffLoading ? (
            <div className={styles.loading}>Loading staff members...</div>
          ) : (
            <div className={styles.assignmentsContainer}>
              {/* Add Staff Dropdown */}
              <div className={styles.addStaffSection}>
                <div className={styles.staffFieldContainer}>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className={styles.staffSelect}
                    disabled={isSubmitting}
                  >
                    <option value="">Select staff member to add...</option>
                    {availableStaff.map(user => (
                      <option key={user.id} value={user.id}>
                        {getDisplayName(user)} ({user.role})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddStaff}
                    className={styles.addButton}
                    disabled={!selectedStaffId || isSubmitting}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Staff */}
              {selectedStaff.length > 0 && (
                <div className={styles.selectedAssignments}>
                  <h4>Assigned Staff ({selectedStaff.length}):</h4>
                  <div className={styles.selectedList}>
                    {selectedStaff.map(user => (
                      <div key={user.id} className={styles.selectedBadge}>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {getDisplayName(user)}
                          </span>
                          <span className={styles.userRole}>{user.role}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(user.id.toString())}
                          className={styles.removeSelected}
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {staffUsers.length > 0 && (
                <div className={styles.quickActions}>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = staffUsers.map(u => u.id.toString());
                      setFormData(prev => ({ ...prev, assignments: allIds }));
                    }}
                    className={styles.quickButton}
                    disabled={isSubmitting}
                  >
                    Select All Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, assignments: [] }))}
                    className={styles.quickButton}
                    disabled={isSubmitting}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
          {errors.assignments && <span className={styles.errorText}>{errors.assignments}</span>}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Task' : 'Update Task')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
