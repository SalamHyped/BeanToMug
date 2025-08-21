import React, { useState } from 'react';
import styles from './staffScheduleDashboard.module.css';
import MyScheduleView from './components/MyScheduleView';
import AvailableShiftsView from './components/AvailableShiftsView';
import ShiftHistoryView from './components/ShiftHistoryView';
import useStaffSchedule from './hooks/useStaffSchedule';

const StaffScheduleDashboard = ({ userId, userRole = 'staff' }) => {
  const [activeView, setActiveView] = useState('mySchedule'); // 'mySchedule', 'available', 'history'
  
  const {
    mySchedules,
    availableShifts,
    loading,
    error,
    claimShift,
    releaseShift,
    fetchMySchedules,
    fetchAvailableShifts
  } = useStaffSchedule(userId);

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleShiftClaimed = async () => {
    // Refresh both views after claiming
    await Promise.all([
      fetchMySchedules(),
      fetchAvailableShifts()
    ]);
  };

  const handleShiftReleased = async () => {
    // Refresh both views after releasing
    await Promise.all([
      fetchMySchedules(),
      fetchAvailableShifts()
    ]);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'available':
        return (
          <AvailableShiftsView
            shifts={availableShifts}
            loading={loading}
            error={error}
            onClaimShift={claimShift}
            onShiftClaimed={handleShiftClaimed}
          />
        );
      case 'history':
        return (
          <ShiftHistoryView
            userId={userId}
            loading={loading}
            error={error}
          />
        );
      default:
        return (
          <MyScheduleView
            schedules={mySchedules}
            loading={loading}
            error={error}
            onReleaseShift={releaseShift}
            onShiftReleased={handleShiftReleased}
            userRole={userRole}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📅 My Work Schedule</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{mySchedules.length}</span>
            <span className={styles.statLabel}>My Shifts</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{availableShifts.length}</span>
            <span className={styles.statLabel}>Available</span>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.navigation}>
        <button
          onClick={() => handleViewChange('mySchedule')}
          className={`${styles.navButton} ${activeView === 'mySchedule' ? styles.active : ''}`}
        >
          📋 My Schedule
        </button>
        <button
          onClick={() => handleViewChange('available')}
          className={`${styles.navButton} ${activeView === 'available' ? styles.active : ''}`}
        >
          🆕 Available Shifts
          {availableShifts.length > 0 && (
            <span className={styles.badge}>{availableShifts.length}</span>
          )}
        </button>
        <button
          onClick={() => handleViewChange('history')}
          className={`${styles.navButton} ${activeView === 'history' ? styles.active : ''}`}
        >
          📊 History
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default StaffScheduleDashboard;
