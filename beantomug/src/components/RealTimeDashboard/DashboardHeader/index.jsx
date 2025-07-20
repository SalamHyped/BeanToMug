import React from 'react';
import styles from './dashboardHeader.module.css';

const DashboardHeader = ({ connectionStatus }) => {
    return (
        <div className={styles.header}>
            <h2>Real-Time Dashboard</h2>
            <div className={`${styles.status} ${styles[connectionStatus]}`}>
                {connectionStatus === 'connected' ? '🟢 Live' : '🔴 Offline'}
            </div>
        </div>
    );
};

export default DashboardHeader; 