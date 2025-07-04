import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import styles from './staffLayout.module.css';

// Static navigation items - better for tree-shaking
const STAFF_NAV_ITEMS = [
  { to: "/staff", label: "Dashboard", icon: "🏠" },
  { to: "/staff/tasks", label: "My Tasks", icon: "✅" },
  { to: "/staff/orders", label: "Orders Queue", icon: "📋" },
  { to: "/staff/inventory", label: "Inventory", icon: "📦" }
];

const StaffLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={styles.layout}>
      <Sidebar 
        navItems={STAFF_NAV_ITEMS}
        title="Staff Panel"
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={handleToggleSidebar}
      />
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout; 