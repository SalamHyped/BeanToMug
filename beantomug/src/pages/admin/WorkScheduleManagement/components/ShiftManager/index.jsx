import React from 'react';
import styles from './shiftManager.module.css';

const ShiftManager = ({ onBack }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Calendar
        </button>
        <h2>⚙️ Shift Management</h2>
      </div>
      
      <div className={styles.content}>
        <div className={styles.comingSoon}>
          <div className={styles.icon}>🚧</div>
          <h3>Coming Soon</h3>
          <p>Shift management functionality will be available in the next update.</p>
          <p>This will include:</p>
          <ul>
            <li>Create and edit shift templates</li>
            <li>Set minimum and maximum staff requirements</li>
            <li>Configure shift times and break periods</li>
            <li>Manage overnight shifts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShiftManager;
