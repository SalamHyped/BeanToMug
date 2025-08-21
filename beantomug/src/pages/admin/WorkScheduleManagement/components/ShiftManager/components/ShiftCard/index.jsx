import React from 'react';
import styles from './shiftCard.module.css';

const ShiftCard = ({ 
  shift, 
  isActive = true,
  onEdit, 
  onToggleActive, 
  onDelete 
}) => {
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
    <div className={`${styles.shiftCard} ${!isActive ? styles.inactive : ''}`}>
      <div className={styles.shiftHeader}>
        <h4 className={styles.shiftName}>{shift.shift_name}</h4>
        <div className={styles.shiftActions}>
          <button
            onClick={() => onEdit(shift)}
            className={styles.editButton}
            title="Edit Shift"
          >
            ✏️
          </button>
          <button
            onClick={() => onToggleActive(shift)}
            className={styles.toggleButton}
            title={isActive ? "Deactivate Shift" : "Activate Shift"}
          >
            {isActive ? '🔒' : '🔓'}
          </button>
          <button
            onClick={() => onDelete(shift)}
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
        
        <div className={styles.availabilityInfo}>
          <div className={styles.availableDays}>
            📅 {shift.available_days || 'Every day'}
          </div>
          {(shift.start_date || shift.end_date) && (
            <div className={styles.dateRange}>
              🗓️ {shift.start_date && new Date(shift.start_date).toLocaleDateString()} 
              {shift.start_date && shift.end_date && ' → '}
              {shift.end_date && new Date(shift.end_date).toLocaleDateString()}
            </div>
          )}
          {shift.deactivated_at && (
            <div className={styles.deactivatedInfo}>
              🔒 Deactivated: {new Date(shift.deactivated_at).toLocaleString()}
              {shift.deactivated_reason && (
                <small> ({shift.deactivated_reason})</small>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftCard;
