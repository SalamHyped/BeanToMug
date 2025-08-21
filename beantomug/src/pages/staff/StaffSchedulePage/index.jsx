import React from 'react';
import { useUser } from '../../../context/UserContext/UserContext';
import StaffScheduleDashboard from '../../../components/staff/StaffScheduleDashboard';
import styles from './staffSchedulePage.module.css';

const StaffSchedulePage = () => {
  const { user } = useUser();

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>📅 Work Schedule</h1>
        <p>Manage your shifts, claim available slots, and view your schedule history</p>
      </div>
      
      <StaffScheduleDashboard 
        userId={user?.id} 
        userRole={user?.role || 'staff'} 
      />
    </div>
  );
};

export default StaffSchedulePage;
