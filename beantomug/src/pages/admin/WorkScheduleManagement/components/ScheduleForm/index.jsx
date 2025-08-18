import React, { useState, useEffect } from 'react';
import styles from './scheduleForm.module.css';
import { useSchedules } from '../../hooks';

const ScheduleForm = ({ scheduleId, shifts = [], onSubmit, onCancel, selectedDate }) => {
  const { users, createSchedule, updateSchedule, getSchedule, checkAvailability } = useSchedules();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);

  const [formData, setFormData] = useState({
    user_id: '',
    shift_id: '',
    schedule_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Load schedule data for editing
  useEffect(() => {
    if (scheduleId) {
      loadScheduleData();
    }
  }, [scheduleId]);

  // Update date when selectedDate changes
  useEffect(() => {
    if (selectedDate && !scheduleId) {
      setFormData(prev => ({
        ...prev,
        schedule_date: selectedDate.toISOString().split('T')[0]
      }));
    }
  }, [selectedDate, scheduleId]);

  // Check availability when shift and date are selected
  useEffect(() => {
    if (formData.shift_id && formData.schedule_date) {
      loadAvailability();
    }
  }, [formData.shift_id, formData.schedule_date]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const schedule = await getSchedule(scheduleId);
      setFormData({
        user_id: schedule.user_id,
        shift_id: schedule.shift_id,
        schedule_date: schedule.schedule_date,
        notes: schedule.notes || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const availabilityData = await checkAvailability(formData.shift_id, formData.schedule_date);
      setAvailability(availabilityData);
    } catch (err) {
      console.error('Error checking availability:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.user_id) {
      newErrors.user_id = 'Please select a staff member';
    }

    if (!formData.shift_id) {
      newErrors.shift_id = 'Please select a shift';
    }

    if (!formData.schedule_date) {
      newErrors.schedule_date = 'Please select a date';
    } else {
      // Validate date is not too far in the past or future
      const selectedDate = new Date(formData.schedule_date);
      const today = new Date();
      const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < -7) {
        newErrors.schedule_date = 'Cannot schedule more than 7 days in the past';
      } else if (daysDiff > 90) {
        newErrors.schedule_date = 'Cannot schedule more than 3 months in advance';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (scheduleId) {
        await updateSchedule(scheduleId, formData);
      } else {
        await createSchedule(formData);
      }

      onSubmit();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedShift = shifts.find(shift => shift.shift_id === parseInt(formData.shift_id));
  const selectedUser = users.find(user => user.id === parseInt(formData.user_id));

  if (loading && scheduleId) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>
          {scheduleId ? '✏️ Edit Schedule' : '➕ Add New Schedule'}
        </h2>
        <button onClick={onCancel} className={styles.closeButton}>
          ✕
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Staff Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="user_id" className={styles.label}>
            Staff Member *
          </label>
          <select
            id="user_id"
            value={formData.user_id}
            onChange={(e) => handleInputChange('user_id', e.target.value)}
            className={`${styles.select} ${errors.user_id ? styles.hasError : ''}`}
          >
            <option value="">Select a staff member</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} - {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
          {errors.user_id && <span className={styles.errorText}>{errors.user_id}</span>}
        </div>

        {/* Shift Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="shift_id" className={styles.label}>
            Shift *
          </label>
          <select
            id="shift_id"
            value={formData.shift_id}
            onChange={(e) => handleInputChange('shift_id', e.target.value)}
            className={`${styles.select} ${errors.shift_id ? styles.hasError : ''}`}
          >
            <option value="">Select a shift</option>
            {shifts.filter(shift => shift.is_active).map(shift => (
              <option key={shift.shift_id} value={shift.shift_id}>
                {shift.shift_name} ({shift.start_time} - {shift.end_time})
                {shift.is_overnight ? ' - Overnight' : ''}
              </option>
            ))}
          </select>
          {errors.shift_id && <span className={styles.errorText}>{errors.shift_id}</span>}
        </div>

        {/* Date Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="schedule_date" className={styles.label}>
            Date *
          </label>
          <input
            id="schedule_date"
            type="date"
            value={formData.schedule_date}
            onChange={(e) => handleInputChange('schedule_date', e.target.value)}
            className={`${styles.input} ${errors.schedule_date ? styles.hasError : ''}`}
          />
          {errors.schedule_date && <span className={styles.errorText}>{errors.schedule_date}</span>}
        </div>

        {/* Notes */}
        <div className={styles.formGroup}>
          <label htmlFor="notes" className={styles.label}>
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any notes about this schedule..."
            className={styles.textarea}
            rows={3}
          />
        </div>

        {/* Schedule Preview */}
        {selectedShift && selectedUser && formData.schedule_date && (
          <div className={styles.preview}>
            <h4>📋 Schedule Preview</h4>
            <div className={styles.previewDetails}>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>Staff:</span>
                <span className={styles.previewValue}>{selectedUser.username}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>Shift:</span>
                <span className={styles.previewValue}>
                  {selectedShift.shift_name} ({selectedShift.start_time} - {selectedShift.end_time})
                </span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>Date:</span>
                <span className={styles.previewValue}>
                  {new Date(formData.schedule_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Availability Info */}
        {availability && (
          <div className={styles.availability}>
            <h4>👥 Staffing Information</h4>
            <div className={styles.availabilityGrid}>
              <div className={styles.availabilityItem}>
                <span className={styles.availabilityLabel}>Current Staff:</span>
                <span className={styles.availabilityValue}>
                  {availability.staffing_status.current}
                </span>
              </div>
              <div className={styles.availabilityItem}>
                <span className={styles.availabilityLabel}>Minimum Required:</span>
                <span className={styles.availabilityValue}>
                  {availability.staffing_status.minimum}
                </span>
              </div>
              <div className={styles.availabilityItem}>
                <span className={styles.availabilityLabel}>Maximum Allowed:</span>
                <span className={styles.availabilityValue}>
                  {availability.staffing_status.maximum}
                </span>
              </div>
              <div className={styles.availabilityItem}>
                <span className={styles.availabilityLabel}>Slots Available:</span>
                <span className={`${styles.availabilityValue} ${
                  availability.staffing_status.slots_available > 0 ? styles.available : styles.full
                }`}>
                  {availability.staffing_status.slots_available}
                </span>
              </div>
            </div>
            
            {availability.staffing_status.below_minimum && (
              <div className={styles.warning}>
                ⚠️ This shift is currently below minimum staffing requirements
              </div>
            )}
            
            {availability.staffing_status.slots_available === 0 && (
              <div className={styles.error}>
                ❌ This shift is at maximum capacity
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (availability && availability.staffing_status.slots_available === 0)}
            className={styles.submitButton}
          >
            {loading ? (
              <>
                <div className={styles.buttonSpinner}></div>
                {scheduleId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              scheduleId ? '💾 Update Schedule' : '➕ Create Schedule'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleForm;
