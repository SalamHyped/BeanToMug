import React, { useState } from 'react';
import styles from './myScheduleView.module.css';

const MyScheduleView = ({ 
  schedules = [], 
  loading, 
  error, 
  onReleaseShift, 
  onShiftReleased,
  userRole = 'staff'
}) => {
  const [releaseLoading, setReleaseLoading] = useState(false);

  // Group schedules by date
  const groupedSchedules = schedules.reduce((groups, schedule) => {
    const date = new Date(schedule.schedule_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  // Handle shift release
  const handleReleaseShift = async (schedule) => {
    const confirmMessage = `Are you sure you want to release your ${schedule.shift_name} shift on ${new Date(schedule.schedule_date).toLocaleDateString()}?`;
    
    if (window.confirm(confirmMessage)) {
      setReleaseLoading(true);
      try {
        await onReleaseShift(schedule.schedule_id);
        await onShiftReleased();
      } catch (err) {
        console.error('Error releasing shift:', err);
      } finally {
        setReleaseLoading(false);
      }
    }
  };

  // Format time for display
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusStyles = {
      scheduled: { class: styles.statusScheduled, text: '📅 Scheduled' },
      completed: { class: styles.statusCompleted, text: '✅ Completed' },
      absent: { class: styles.statusAbsent, text: '❌ Absent' },
      cancelled: { class: styles.statusCancelled, text: '🚫 Cancelled' }
    };
    return statusStyles[status] || { class: styles.statusScheduled, text: '📅 Scheduled' };
  };

  // Check if shift can be released (not in the past and not completed/absent)
  const canReleaseShift = (schedule) => {
    const scheduleDate = new Date(schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return scheduleDate >= today && 
           schedule.status === 'scheduled' &&
           userRole === 'staff';
  };

  const isToday = (dateString) => {
    return new Date(dateString).toDateString() === new Date().toDateString();
  };

  const isPast = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📋 My Schedule</h3>
        <div className={styles.summary}>
          <span>Total shifts: {schedules.length}</span>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your schedule...</p>
        </div>
      )}

    

      {!loading && schedules.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📅</div>
          <h4>No Shifts Scheduled</h4>
          <p>You don't have any shifts scheduled yet.</p>
          <p>Check the "Available Shifts" tab to claim some!</p>
        </div>
      )}

      {!loading && schedules.length > 0 && (
        <div className={styles.scheduleList}>
          {sortedDates.map(dateStr => {
            const daySchedules = groupedSchedules[dateStr];
            const date = new Date(dateStr);
            
            return (
              <div 
                key={dateStr} 
                className={`${styles.dayGroup} ${isToday(dateStr) ? styles.today : ''} ${isPast(dateStr) ? styles.past : ''}`}
              >
                <div className={styles.dayHeader}>
                  <h4 className={styles.dayTitle}>
                    {isToday(dateStr) && <span className={styles.todayBadge}>TODAY</span>}
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className={styles.shiftsCount}>
                    {daySchedules.length} shift{daySchedules.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.shiftsGrid}>
                  {daySchedules.map(schedule => {
                    const statusBadge = getStatusBadge(schedule.status);
                    
                    return (
                      <div key={schedule.schedule_id} className={styles.shiftCard}>
                        <div className={styles.shiftHeader}>
                          <h5 className={styles.shiftName}>
                            🕐 {schedule.shift_name}
                          </h5>
                          <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </div>

                        <div className={styles.shiftDetails}>
                          <div className={styles.timeInfo}>
                            <span className={styles.timeRange}>
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </span>
                            {schedule.is_overnight && (
                              <span className={styles.overnightBadge}>🌙 Overnight</span>
                            )}
                          </div>

                          {schedule.notes && (
                            <div className={styles.notes}>
                              <small>📝 {schedule.notes}</small>
                            </div>
                          )}
                        </div>

                        {canReleaseShift(schedule) && (
                          <div className={styles.shiftActions}>
                            <button
                              onClick={() => handleReleaseShift(schedule)}
                              className={styles.releaseButton}
                              disabled={releaseLoading}
                            >
                              🔄 Release Shift
                            </button>
                          </div>
                        )}

                        {schedule.status === 'completed' && (
                          <div className={styles.completedInfo}>
                            <small>✅ Completed on {new Date(schedule.completed_at).toLocaleDateString()}</small>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyScheduleView;
