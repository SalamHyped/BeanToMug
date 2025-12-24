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
  FaSignOutAlt,
  FaUserCog,
  FaPlus,
  FaLeaf,
  FaTags,
  FaFolder,
  FaExchangeAlt,
  FaCogs,
  FaCalendarAlt,
  FaTruck,
  FaShoppingCart

} from 'react-icons/fa';
import { RiMenuAddFill } from "react-icons/ri";


// Static navigation items - better for tree-shaking
const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: FaHome },
  { to: "/admin/task-management", label: "Task Management", icon: FaTasks },
  { 
    to: "/admin/orders", 
    label: "Menu Management", 
    icon: FaUtensils,
    subItems: [
      { to: "/admin/orders/queue", label: "Order Queue", icon: FaClock },
      { to: "/admin/menuManagement/menuSettings", label: "Menu Settings", icon: RiMenuAddFill },
      { to: "/admin/menuManagement/ingredients", label: "Ingredients", icon: FaLeaf },
      { 
        to: "/admin/menuManagement/configuration", 
        label: "Configuration", 
        icon: FaCogs,
        subItems: [
          { to: "/admin/menuManagement/ingredient-types", label: "Ingredient Types", icon: FaTags },
          { to: "/admin/menuManagement/ingredient-categories", label: "Ingredient Categories", icon: FaFolder },
          { to: "/admin/menuManagement/ingredient-effects", label: "Effects", icon: FaExchangeAlt }
        ]
      }
    ]
  },
  { to: "/admin/users", label: "Users Management", icon: FaUsers },
  { to: "/admin/work-schedule", label: "Work Schedule", icon: FaCalendarAlt },
  { to: "/admin/suppliers", label: "Supplier Management", icon: FaTruck },
  { to: "/admin/product-orders", label: "Product Orders", icon: FaShoppingCart },
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