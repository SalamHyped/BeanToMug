import React from 'react';
import styles from './myScheduleWidget.module.css';
import useStaffSchedule from '../StaffScheduleDashboard/hooks/useStaffSchedule';
import MyScheduleView from '../StaffScheduleDashboard/components/MyScheduleView';
import { Link } from 'react-router-dom';

const MyScheduleWidget = ({ userId, userRole = 'staff' }) => {
  const {
    mySchedules,
    loading,
    error,
    releaseShift,
    fetchMySchedules,
    upcomingShifts,
    todaysShifts
  } = useStaffSchedule(userId);

  const handleShiftReleased = async () => {
    await fetchMySchedules();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📅 My Schedule</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{todaysShifts.length}</span>
            <span className={styles.statLabel}>Today</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{upcomingShifts.length}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{mySchedules.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* My Schedule Content */}
      <div className={styles.content}>
        <MyScheduleView
          schedules={mySchedules}
          loading={loading}
          error={error}
          onReleaseShift={releaseShift}
          onShiftReleased={handleShiftReleased}
          userRole={userRole}
        />
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link to="/staff/schedule" className={styles.manageButton}>
          🗂️ Manage Full Schedule
        </Link>
      </div>
    </div>
  );
};

export default MyScheduleWidget;
