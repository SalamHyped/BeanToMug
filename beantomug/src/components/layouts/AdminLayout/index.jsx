import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import styles from './adminLayout.module.css';

// Static navigation items - better for tree-shaking
const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "🏠" },
  { to: "/admin/tasks", label: "Task Management", icon: "✅" },
  { to: "/admin/orders", label: "Orders", icon: "📋" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/menu", label: "Menu Management", icon: "📝" },
  { to: "/admin/gallery", label: "Gallery", icon: "📷" }
];

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={styles.layout}>
      <Sidebar 
        navItems={ADMIN_NAV_ITEMS}
        title="Admin Panel"
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={handleToggleSidebar}
      />
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 