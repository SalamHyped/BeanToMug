import React, { useState, useEffect } from 'react';
import styles from './attendancePanel.module.css';
import { useAttendance, useSchedules } from '../../hooks';

const AttendancePanel = ({ onBack }) => {
  const { 
    attendanceData,
    loading, 
    error, 
    markAttendance,
    fetchTodaysAttendance,
    fetchAttendanceByDateRange,
    getAttendanceReports
  } = useAttendance();

  const { users } = useSchedules();

  const [view, setView] = useState('today'); // 'today', 'dateRange', 'reports'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    user_id: 'all',
    shift_id: 'all',
    status: 'all'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [attendanceReports, setAttendanceReports] = useState(null);

  // Load today's attendance on mount
  useEffect(() => {
    if (view === 'today') {
      fetchTodaysAttendance();
    }
  }, [view, fetchTodaysAttendance]);

  // Handle attendance marking
  const handleMarkAttendance = async (scheduleId, status, notes = '') => {
    setSubmitLoading(true);
    try {
      await markAttendance(scheduleId, status, notes);
      // Refresh current view
      if (view === 'today') {
        await fetchTodaysAttendance();
      } else if (view === 'dateRange') {
        await fetchAttendanceByDateRange(startDate, endDate, filters);
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle date range search
  const handleDateRangeSearch = async () => {
    if (startDate && endDate) {
      await fetchAttendanceByDateRange(startDate, endDate, filters);
    }
  };

  // Handle reports generation
  const handleGenerateReports = async () => {
    try {
      const reportFilters = {
        start_date: startDate,
        end_date: endDate,
        ...filters
      };
      const reports = await getAttendanceReports(reportFilters);
      setAttendanceReports(reports);
    } catch (err) {
      console.error('Error generating reports:', err);
    }
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusStyles = {
      scheduled: { class: styles.statusScheduled, text: '📅 Scheduled' },
      completed: { class: styles.statusCompleted, text: '✅ Present' },
      absent: { class: styles.statusAbsent, text: '❌ Absent' },
      cancelled: { class: styles.statusCancelled, text: '🚫 Cancelled' }
    };
    return statusStyles[status] || { class: styles.statusScheduled, text: '📅 Scheduled' };
  };

  // Format time for display
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group schedules by shift
  const groupedSchedules = attendanceData.reduce((groups, schedule) => {
    const shiftName = schedule.shift_name || 'Unknown Shift';
    if (!groups[shiftName]) {
      groups[shiftName] = [];
    }
    groups[shiftName].push(schedule);
    return groups;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Calendar
        </button>
        <h2>📊 Attendance Management</h2>
      </div>

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* View Tabs */}
      <div className={styles.viewTabs}>
        <button 
          onClick={() => setView('today')}
          className={`${styles.tab} ${view === 'today' ? styles.activeTab : ''}`}
        >
          📅 Today's Attendance
        </button>
        <button 
          onClick={() => setView('dateRange')}
          className={`${styles.tab} ${view === 'dateRange' ? styles.activeTab : ''}`}
        >
          📊 Date Range View
        </button>
        <button 
          onClick={() => setView('reports')}
          className={`${styles.tab} ${view === 'reports' ? styles.activeTab : ''}`}
        >
          📈 Reports
        </button>
      </div>

      <div className={styles.content}>
        {/* Views will be rendered here */}
        {view === 'today' && (
          <div className={styles.todayView}>
            <div className={styles.dateHeader}>
              <h3>📅 Today's Attendance - {new Date().toLocaleDateString()}</h3>
              <button 
                onClick={fetchTodaysAttendance} 
                className={styles.refreshButton}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>

            {loading && (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading today's attendance...</p>
              </div>
            )}

            {!loading && attendanceData.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <h4>No Schedules Today</h4>
                <p>There are no scheduled shifts for today.</p>
              </div>
            )}

            {!loading && attendanceData.length > 0 && (
              <div className={styles.shiftsContainer}>
                {Object.entries(groupedSchedules).map(([shiftName, schedules]) => (
                  <div key={shiftName} className={styles.shiftGroup}>
                    <h4 className={styles.shiftTitle}>
                      🕐 {shiftName} ({schedules.length} staff)
                    </h4>
                    
                    <div className={styles.attendanceGrid}>
                      {schedules.map(schedule => {
                        const statusBadge = getStatusBadge(schedule.status);
                        const user = users.find(u => u.id === schedule.user_id);
                        
                        return (
                          <div key={schedule.schedule_id} className={styles.attendanceCard}>
                            <div className={styles.userInfo}>
                              <h5 className={styles.userName}>
                                👤 {user?.name || 'Unknown User'}
                              </h5>
                              <p className={styles.userEmail}>{user?.email}</p>
                            </div>

                            <div className={styles.scheduleInfo}>
                              <span className={styles.timeRange}>
                                🕐 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                              <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                                {statusBadge.text}
                              </span>
                            </div>

                            {schedule.notes && (
                              <div className={styles.notes}>
                                <small>📝 {schedule.notes}</small>
                              </div>
                            )}

                            <div className={styles.attendanceActions}>
                              {schedule.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={() => handleMarkAttendance(schedule.schedule_id, 'completed')}
                                    className={styles.presentButton}
                                    disabled={submitLoading}
                                  >
                                    ✅ Mark Present
                                  </button>
                                  <button
                                    onClick={() => handleMarkAttendance(schedule.schedule_id, 'absent')}
                                    className={styles.absentButton}
                                    disabled={submitLoading}
                                  >
                                    ❌ Mark Absent
                                  </button>
                                </>
                              )}
                              
                              {(schedule.status === 'completed' || schedule.status === 'absent') && (
                                <button
                                  onClick={() => handleMarkAttendance(schedule.schedule_id, 'scheduled')}
                                  className={styles.undoButton}
                                  disabled={submitLoading}
                                >
                                  🔄 Reset Status
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other views */}
        {view !== 'today' && (
          <div className={styles.placeholder}>
            <h3>🚧 {view === 'dateRange' ? 'Date Range View' : 'Reports'} Coming Soon</h3>
            <p>This view is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePanel;