import React, { useState } from 'react';
import styles from './shiftManager.module.css';
import { useShifts } from '../../hooks';

const ShiftManager = ({ onBack }) => {
  const { 
    shifts, 
    loading, 
    error, 
    createShift, 
    updateShift, 
    deleteShift,
    activeShifts,
    inactiveShifts
  } = useShifts();

  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
    is_overnight: false,
    min_staff: 1,
    max_staff: 5,
    break_minutes: 30,
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Reset form
  const resetForm = () => {
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      is_overnight: false,
      min_staff: 1,
      max_staff: 5,
      break_minutes: 30,
      is_active: true
    });
    setFormErrors({});
    setEditingShift(null);
    setShowForm(false);
  };

  // Handle form input changes
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

  // Validate form
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

    // Time validation for non-overnight shifts
    if (!formData.is_overnight && formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        errors.end_time = 'End time must be after start time for non-overnight shifts';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    
    try {
      if (editingShift) {
        await updateShift(editingShift.shift_id, formData);
      } else {
        await createShift(formData);
      }
      resetForm();
    } catch (err) {
      // Error is already handled in the hook
      console.error('Form submission error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle edit shift
  const handleEdit = (shift) => {
    setFormData({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      is_overnight: Boolean(shift.is_overnight),
      min_staff: shift.min_staff,
      max_staff: shift.max_staff,
      break_minutes: shift.break_minutes,
      is_active: Boolean(shift.is_active)
    });
    setEditingShift(shift);
    setShowForm(true);
  };

  // Handle delete shift
  const handleDelete = async (shift) => {
    if (window.confirm(`Are you sure you want to delete the "${shift.shift_name}" shift? This action cannot be undone.`)) {
      try {
        await deleteShift(shift.shift_id);
      } catch (err) {
        // Error is already handled in the hook
        console.error('Delete error:', err);
      }
    }
  };

  // Toggle shift active status
  const handleToggleActive = async (shift) => {
    try {
      await updateShift(shift.shift_id, {
        ...shift,
        is_active: !shift.is_active
      });
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  // Format time for display
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate shift duration
  const calculateDuration = (startTime, endTime, isOvernight) => {
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    if (isOvernight && end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Calendar
        </button>
        <h2>⚙️ Shift Management</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className={styles.addButton}
          disabled={loading}
        >
          ➕ Add New Shift
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Shift Form */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h3>{editingShift ? '✏️ Edit Shift' : '➕ Add New Shift'}</h3>
              <button onClick={resetForm} className={styles.closeButton}>
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
                  onClick={resetForm}
                  className={styles.cancelButton}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : (editingShift ? 'Update Shift' : 'Create Shift')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shifts List */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading shifts...</p>
          </div>
        )}

        {!loading && shifts.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚙️</div>
            <h3>No Shifts Created</h3>
            <p>Create your first shift template to start scheduling staff.</p>
            <button 
              onClick={() => setShowForm(true)} 
              className={styles.addButton}
            >
              ➕ Add New Shift
            </button>
          </div>
        )}

        {!loading && shifts.length > 0 && (
          <div className={styles.shiftsSection}>
            {/* Active Shifts */}
            {activeShifts.length > 0 && (
              <div className={styles.shiftsGroup}>
                <h3 className={styles.groupTitle}>✅ Active Shifts ({activeShifts.length})</h3>
                <div className={styles.shiftsGrid}>
                  {activeShifts.map(shift => (
                    <div key={shift.shift_id} className={styles.shiftCard}>
                      <div className={styles.shiftHeader}>
                        <h4 className={styles.shiftName}>{shift.shift_name}</h4>
                        <div className={styles.shiftActions}>
                          <button
                            onClick={() => handleEdit(shift)}
                            className={styles.editButton}
                            title="Edit Shift"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleActive(shift)}
                            className={styles.toggleButton}
                            title="Deactivate Shift"
                          >
                            🔒
                          </button>
                          <button
                            onClick={() => handleDelete(shift)}
                            className={styles.deleteButton}
                            title="Delete Shift"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.shiftDetails}>
                        <div className={styles.shiftInfo}>
                          <span className={styles.timeRange}>
                            🕐 {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            {shift.is_overnight && <span className={styles.overnightBadge}>🌙 Overnight</span>}
                          </span>
                          <span className={styles.duration}>
                            ⏱️ {calculateDuration(shift.start_time, shift.end_time, shift.is_overnight)}
                          </span>
                        </div>
                        
                        <div className={styles.staffingInfo}>
                          <span className={styles.staffing}>
                            👥 {shift.min_staff} - {shift.max_staff} staff
                          </span>
                          {shift.break_minutes > 0 && (
                            <span className={styles.break}>
                              ☕ {shift.break_minutes}min break
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Shifts */}
            {inactiveShifts.length > 0 && (
              <div className={styles.shiftsGroup}>
                <h3 className={styles.groupTitle}>🔒 Inactive Shifts ({inactiveShifts.length})</h3>
                <div className={styles.shiftsGrid}>
                  {inactiveShifts.map(shift => (
                    <div key={shift.shift_id} className={`${styles.shiftCard} ${styles.inactive}`}>
                      <div className={styles.shiftHeader}>
                        <h4 className={styles.shiftName}>{shift.shift_name}</h4>
                        <div className={styles.shiftActions}>
                          <button
                            onClick={() => handleEdit(shift)}
                            className={styles.editButton}
                            title="Edit Shift"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleActive(shift)}
                            className={styles.toggleButton}
                            title="Activate Shift"
                          >
                            🔓
                          </button>
                          <button
                            onClick={() => handleDelete(shift)}
                            className={styles.deleteButton}
                            title="Delete Shift"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.shiftDetails}>
                        <div className={styles.shiftInfo}>
                          <span className={styles.timeRange}>
                            🕐 {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            {shift.is_overnight && <span className={styles.overnightBadge}>🌙 Overnight</span>}
                          </span>
                          <span className={styles.duration}>
                            ⏱️ {calculateDuration(shift.start_time, shift.end_time, shift.is_overnight)}
                          </span>
                        </div>
                        
                        <div className={styles.staffingInfo}>
                          <span className={styles.staffing}>
                            👥 {shift.min_staff} - {shift.max_staff} staff
                          </span>
                          {shift.break_minutes > 0 && (
                            <span className={styles.break}>
                              ☕ {shift.break_minutes}min break
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftManager;