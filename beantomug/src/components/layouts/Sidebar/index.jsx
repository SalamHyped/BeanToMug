import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './sidebar.module.css';

const Sidebar = ({ user }) => {
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/orders", label: "Orders" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/menu", label: "Menu Management" }
      ];
    }
    
    if (isStaff) {
      return [
        { to: "/staff", label: "Dashboard", end: true },
        { to: "/staff/orders", label: "Orders Queue" },
        { to: "/staff/inventory", label: "Inventory" }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  if (!navItems.length) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>{isAdmin ? 'Admin Panel' : 'Staff Panel'}</h2>
      </div>
      <nav className={styles.sidebarNav}>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink 
                to={item.to}
                end={item.end}
                className={({ isActive }) => 
                  isActive ? styles.activeLink : styles.link
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 