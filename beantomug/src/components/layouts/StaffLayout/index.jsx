import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import styles from './staffLayout.module.css';
import { 
  FaHome, 
  FaCheckSquare, 
  FaClipboardList, 
  FaReceipt, 
  FaBoxes, 
  FaImages, 
  FaUserCog,
  FaSignOutAlt,
  FaCalendarAlt
} from 'react-icons/fa';

// Static navigation items - better for tree-shaking
const STAFF_NAV_ITEMS = [
  { to: "/staff", label: "Dashboard", icon: FaHome },
  { to: "/staff/schedule", label: "Schedule", icon: FaCalendarAlt },
  { to: "/staff/tasks", label: "My Tasks", icon: FaCheckSquare },
  { to: "/staff/orders", label: "Orders Queue", icon: FaClipboardList },
  { to: "/staff/receipts", label: "Receipts", icon: FaReceipt },
  { to: "/staff/inventory", label: "Inventory", icon: FaBoxes },
  { to: "/staff/gallery", label: "Gallery", icon: FaImages },
  { to: "/staff/profile", label: "Profile", icon: FaUserCog }
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
        logoutIcon={() => <FaSignOutAlt />}
      />
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <Outlet context={{ isSidebarCollapsed }} />
      </main>
    </div>
  );
};

export default StaffLayout; 