import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './customerLayout.module.css';

const CustomerLayout = () => {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CustomerLayout; 