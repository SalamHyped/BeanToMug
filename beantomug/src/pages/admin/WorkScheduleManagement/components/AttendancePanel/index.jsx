import React from 'react';
import styles from './attendancePanel.module.css';

const AttendancePanel = ({ schedules = [], onMarkAttendance, onBack }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Calendar
        </button>
        <h2>✅ Attendance Management</h2>
      </div>
      
      <div className={styles.content}>
        <div className={styles.comingSoon}>
          <div className={styles.icon}>🚧</div>
          <h3>Coming Soon</h3>
          <p>Attendance management functionality will be available in the next update.</p>
          <p>This will include:</p>
          <ul>
            <li>Mark staff attendance (Present/Absent)</li>
            <li>View attendance history and reports</li>
            <li>Track late arrivals and early departures</li>
            <li>Generate attendance summaries</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttendancePanel;
