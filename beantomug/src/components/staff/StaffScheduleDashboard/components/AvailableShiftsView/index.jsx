import React, { useState } from 'react';
import styles from './availableShiftsView.module.css';

const AvailableShiftsView = ({ 
  shifts = [], 
  loading, 
  error, 
  onClaimShift, 
  onShiftClaimed 
}) => {
  const [claimLoading, setClaimLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  // Handle shift claiming
  const handleClaimShift = async (shift) => {
    const confirmMessage = `Claim ${shift.shift_name} shift on ${new Date(shift.date).toLocaleDateString()}?`;
    
    if (window.confirm(confirmMessage)) {
      setClaimLoading(true);
      setSelectedShift(shift);
      try {
        await onClaimShift(shift.shift_id, shift.date);
        await onShiftClaimed();
      } finally {
        setClaimLoading(false);
        setSelectedShift(null);
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

  // Group shifts by date
  const groupedShifts = shifts.reduce((groups, shift) => {
    const date = new Date(shift.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(shift);
    return groups;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedShifts).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  const isToday = (dateString) => {
    return new Date(dateString).toDateString() === new Date().toDateString();
  };

  const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(dateString).toDateString() === tomorrow.toDateString();
  };

  // Get urgency level based on staffing
  const getUrgencyLevel = (currentStaff, minStaff, maxStaff) => {
    if (currentStaff < minStaff) return 'urgent';
    if (currentStaff < maxStaff * 0.7) return 'medium';
    return 'low';
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyStyles = {
      urgent: { class: styles.urgentBadge, text: '🚨 Urgent' },
      medium: { class: styles.mediumBadge, text: '⚠️ Needed' },
      low: { class: styles.lowBadge, text: '✅ Open' }
    };
    return urgencyStyles[urgency] || urgencyStyles.low;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>🆕 Available Shifts</h3>
        <div className={styles.summary}>
          <span>Total available: {shifts.length}</span>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading available shifts...</p>
        </div>
      )}



      {!loading && shifts.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <h4>No Available Shifts</h4>
          <p>All shifts are currently fully staffed.</p>
          <p>Check back later for new opportunities!</p>
        </div>
      )}

      {!loading && shifts.length > 0 && (
        <>
          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <div className={styles.actionCard}>
              <span className={styles.actionIcon}>🚨</span>
              <div className={styles.actionInfo}>
                <h4>Urgent Shifts</h4>
                <p>{shifts.filter(s => getUrgencyLevel(s.current_staff, s.min_staff, s.max_staff) === 'urgent').length} shifts need immediate attention</p>
              </div>
            </div>
            <div className={styles.actionCard}>
              <span className={styles.actionIcon}>📅</span>
              <div className={styles.actionInfo}>
                <h4>This Week</h4>
                <p>{shifts.filter(s => {
                  const shiftDate = new Date(s.date);
                  const weekEnd = new Date();
                  weekEnd.setDate(weekEnd.getDate() + 7);
                  return shiftDate <= weekEnd;
                }).length} shifts available</p>
              </div>
            </div>
          </div>

          {/* Shifts List */}
          <div className={styles.shiftsList}>
            {sortedDates.map(dateStr => {
              const dayShifts = groupedShifts[dateStr];
              const date = new Date(dateStr);
              
              return (
                <div key={dateStr} className={styles.dayGroup}>
                  <div className={styles.dayHeader}>
                    <h4 className={styles.dayTitle}>
                      {isToday(dateStr) && <span className={styles.todayBadge}>TODAY</span>}
                      {isTomorrow(dateStr) && <span className={styles.tomorrowBadge}>TOMORROW</span>}
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h4>
                    <span className={styles.shiftsCount}>
                      {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className={styles.shiftsGrid}>
                    {dayShifts.map(shift => {
                      const urgency = getUrgencyLevel(shift.current_staff, shift.min_staff, shift.max_staff);
                      const urgencyBadge = getUrgencyBadge(urgency);
                      const spotsLeft = shift.max_staff - shift.current_staff;
                      
                      return (
                        <div key={`${shift.shift_id}-${shift.date}`} className={`${styles.shiftCard} ${styles[urgency]}`}>
                          <div className={styles.shiftHeader}>
                            <h5 className={styles.shiftName}>
                              🕐 {shift.shift_name}
                            </h5>
                            <span className={`${styles.urgencyBadge} ${urgencyBadge.class}`}>
                              {urgencyBadge.text}
                            </span>
                          </div>

                          <div className={styles.shiftDetails}>
                            <div className={styles.timeInfo}>
                              <span className={styles.timeRange}>
                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                              </span>
                              {shift.is_overnight && (
                                <span className={styles.overnightBadge}>🌙 Overnight</span>
                              )}
                            </div>

                            <div className={styles.staffingInfo}>
                              <div className={styles.staffingBar}>
                                <div className={styles.staffingProgress}>
                                  <div 
                                    className={styles.staffingFill}
                                    style={{ 
                                      width: `${(shift.current_staff / shift.max_staff) * 100}%`,
                                      backgroundColor: urgency === 'urgent' ? '#ef4444' : urgency === 'medium' ? '#f59e0b' : '#10b981'
                                    }}
                                  />
                                </div>
                                <span className={styles.staffingText}>
                                  {shift.current_staff}/{shift.max_staff} staff
                                </span>
                              </div>
                              
                              <div className={styles.spotsInfo}>
                                <span className={styles.spotsLeft}>
                                  {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                                </span>
                                {shift.current_staff < shift.min_staff && (
                                  <span className={styles.needsMore}>
                                    Needs {shift.min_staff - shift.current_staff} more
                                  </span>
                                )}
                              </div>
                            </div>

                            {shift.break_minutes > 0 && (
                              <div className={styles.benefits}>
                                <span className={styles.benefit}>☕ {shift.break_minutes}min break</span>
                              </div>
                            )}
                          </div>

                          <div className={styles.shiftActions}>
                            <button
                              onClick={() => handleClaimShift(shift)}
                              className={`${styles.claimButton} ${styles[urgency]}`}
                              disabled={claimLoading && selectedShift?.shift_id === shift.shift_id}
                            >
                              {claimLoading && selectedShift?.shift_id === shift.shift_id ? (
                                <>⏳ Claiming...</>
                              ) : (
                                <>✋ Claim Shift</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AvailableShiftsView;
