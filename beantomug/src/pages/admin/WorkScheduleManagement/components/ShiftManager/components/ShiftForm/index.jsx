import React, { useState, useEffect } from 'react';
import styles from './shiftForm.module.css';
import AvailableDaysSelector from '../AvailableDaysSelector';

const ShiftForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingShift = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
    is_overnight: false,
    min_staff: 1,
    max_staff: 5,
    break_minutes: 30,
    is_active: true,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    start_date: '',
    end_date: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Load editing data
  useEffect(() => {
    if (editingShift) {
      const availableDays = editingShift.available_days 
        ? editingShift.available_days.split(',') 
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      setFormData({
        shift_name: editingShift.shift_name,
        start_time: editingShift.start_time,
        end_time: editingShift.end_time,
        is_overnight: Boolean(editingShift.is_overnight),
        min_staff: editingShift.min_staff,
        max_staff: editingShift.max_staff,
        break_minutes: editingShift.break_minutes,
        is_active: Boolean(editingShift.is_active),
        available_days: availableDays,
        start_date: editingShift.start_date || '',
        end_date: editingShift.end_date || ''
      });
    } else {
      resetForm();
    }
  }, [editingShift]);

  const resetForm = () => {
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      is_overnight: false,
      min_staff: 1,
      max_staff: 5,
      break_minutes: 30,
      is_active: true,
      available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      start_date: '',
      end_date: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleAvailableDaysChange = (days) => {
    handleInputChange('available_days', days);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.shift_name.trim()) {
      errors.shift_name = 'Shift name is required';
    }

    if (!formData.start_time) {
      errors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      errors.end_time = 'End time is required';
    }

    if (formData.min_staff < 1) {
      errors.min_staff = 'Minimum staff must be at least 1';
    }

    if (formData.max_staff < formData.min_staff) {
      errors.max_staff = 'Maximum staff must be greater than or equal to minimum staff';
    }

    if (formData.break_minutes < 0) {
      errors.break_minutes = 'Break minutes cannot be negative';
    }

    // Available days validation
    if (!formData.available_days || formData.available_days.length === 0) {
      errors.available_days = 'At least one day must be selected';
    }

    // Date range validation
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        errors.end_date = 'End date must be after start date';
      }
    }

    // Time validation for non-overnight shifts
    if (!formData.is_overnight && formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        errors.end_time = 'End time must be after start time for non-overnight shifts';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Format data for backend
    const submitData = {
      ...formData,
      // Convert available_days array to comma-separated string for MySQL SET
      available_days: formData.available_days.join(','),
      // Convert empty strings to null for date fields
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };

    await onSubmit(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formModal}>
        <div className={styles.formHeader}>
          <h3>{editingShift ? '✏️ Edit Shift' : '➕ Add New Shift'}</h3>
          <button onClick={handleClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Shift Name */}
          <div className={styles.formGroup}>
            <label htmlFor="shift_name" className={styles.label}>
              Shift Name *
            </label>
            <input
              id="shift_name"
              type="text"
              value={formData.shift_name}
              onChange={(e) => handleInputChange('shift_name', e.target.value)}
              className={`${styles.input} ${formErrors.shift_name ? styles.hasError : ''}`}
              placeholder="e.g., Morning Shift"
            />
            {formErrors.shift_name && (
              <span className={styles.errorText}>{formErrors.shift_name}</span>
            )}
          </div>

          {/* Time Settings */}
          <div className={styles.timeRow}>
            <div className={styles.formGroup}>
              <label htmlFor="start_time" className={styles.label}>
                Start Time *
              </label>
              <input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={`${styles.input} ${formErrors.start_time ? styles.hasError : ''}`}
              />
              {formErrors.start_time && (
                <span className={styles.errorText}>{formErrors.start_time}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="end_time" className={styles.label}>
                End Time *
              </label>
              <input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className={`${styles.input} ${formErrors.end_time ? styles.hasError : ''}`}
              />
              {formErrors.end_time && (
                <span className={styles.errorText}>{formErrors.end_time}</span>
              )}
            </div>
          </div>

          {/* Overnight Checkbox */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_overnight}
                onChange={(e) => handleInputChange('is_overnight', e.target.checked)}
                className={styles.checkbox}
              />
              🌙 Overnight Shift (crosses midnight)
            </label>
          </div>

          {/* Available Days */}
          <div className={styles.formGroup}>
            <AvailableDaysSelector
              selectedDays={formData.available_days}
              onChange={handleAvailableDaysChange}
              error={formErrors.available_days}
            />
          </div>

          {/* Date Range (Optional) */}
          <div className={styles.dateRangeRow}>
            <div className={styles.formGroup}>
              <label htmlFor="start_date" className={styles.label}>
                Available From (Optional)
              </label>
              <input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={`${styles.input} ${formErrors.start_date ? styles.hasError : ''}`}
              />
              {formErrors.start_date && (
                <span className={styles.errorText}>{formErrors.start_date}</span>
              )}
              <small className={styles.helpText}>When this shift becomes available</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="end_date" className={styles.label}>
                Available Until (Optional)
              </label>
              <input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={`${styles.input} ${formErrors.end_date ? styles.hasError : ''}`}
              />
              {formErrors.end_date && (
                <span className={styles.errorText}>{formErrors.end_date}</span>
              )}
              <small className={styles.helpText}>When this shift stops being available</small>
            </div>
          </div>

          {/* Staffing Settings */}
          <div className={styles.staffingRow}>
            <div className={styles.formGroup}>
              <label htmlFor="min_staff" className={styles.label}>
                Minimum Staff *
              </label>
              <input
                id="min_staff"
                type="number"
                min="1"
                value={formData.min_staff}
                onChange={(e) => handleInputChange('min_staff', parseInt(e.target.value))}
                className={`${styles.input} ${formErrors.min_staff ? styles.hasError : ''}`}
              />
              {formErrors.min_staff && (
                <span className={styles.errorText}>{formErrors.min_staff}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="max_staff" className={styles.label}>
                Maximum Staff *
              </label>
              <input
                id="max_staff"
                type="number"
                min="1"
                value={formData.max_staff}
                onChange={(e) => handleInputChange('max_staff', parseInt(e.target.value))}
                className={`${styles.input} ${formErrors.max_staff ? styles.hasError : ''}`}
              />
              {formErrors.max_staff && (
                <span className={styles.errorText}>{formErrors.max_staff}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="break_minutes" className={styles.label}>
                Break Minutes
              </label>
              <input
                id="break_minutes"
                type="number"
                min="0"
                value={formData.break_minutes}
                onChange={(e) => handleInputChange('break_minutes', parseInt(e.target.value))}
                className={`${styles.input} ${formErrors.break_minutes ? styles.hasError : ''}`}
              />
              {formErrors.break_minutes && (
                <span className={styles.errorText}>{formErrors.break_minutes}</span>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className={styles.checkbox}
              />
              ✅ Active (available for scheduling)
            </label>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingShift ? 'Update Shift' : 'Create Shift')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftForm;
