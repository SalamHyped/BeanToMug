import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './staffLayout.module.css';

const StaffLayout = () => {
  return (
    <div className={styles.staffContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Staff Panel</h2>
        </div>
        <nav className={styles.sidebarNav}>
          <ul>
            <li>
              <NavLink 
                to="" 
                end
                className={({ isActive }) => 
                  isActive ? styles.activeLink : styles.link
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="orders" 
                className={({ isActive }) => 
                  isActive ? styles.activeLink : styles.link
                }
              >
                Orders Queue
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="inventory" 
                className={({ isActive }) => 
                  isActive ? styles.activeLink : styles.link
                }
              >
                Inventory
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout; 