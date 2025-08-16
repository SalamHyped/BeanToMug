import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import NotificationToast from '../../controls/NotificationToast';
import styles from './adminLayout.module.css';
import { 
  FaHome, 
  FaTasks, 
  FaUsers, 
  FaUtensils, 
  FaBoxes, 
  FaImages,
  FaClock,
  FaChartBar,
  FaSignOutAlt,
  FaUserCog,
  FaPlus,
  FaLeaf

} from 'react-icons/fa';
import { RiMenuAddFill } from "react-icons/ri";


// Static navigation items - better for tree-shaking
const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: FaHome },
  { to: "/admin/tasks", label: "Task Management", icon: FaTasks },
  { 
    to: "/admin/orders", 
    label: "Menu Management", 
    icon: FaUtensils,
    subItems: [
      { to: "/admin/orders/queue", label: "Order Queue", icon: FaClock },
      { to: "/admin/orders/analytics", label: "Analytics", icon: FaChartBar },
      { to: "/admin/menuManagement/menuSettings", label: "Menu Settings", icon: RiMenuAddFill },
      { to: "/admin/menuManagement/ingredients", label: "Ingredients", icon: FaLeaf }
    ]
  },
  { to: "/admin/users", label: "Users Management", icon: FaUsers },
  { to: "/admin/inventory", label: "Inventory", icon: FaBoxes },
  { to: "/admin/gallery", label: "Gallery", icon: FaImages },
  { to: "/admin/profile", label: "Profile", icon: FaUserCog }
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
        logoutIcon={FaSignOutAlt}
      />
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <Outlet context={{ isSidebarCollapsed }} />
      </main>
      <NotificationToast />
    </div>
  );
};

export default AdminLayout; 