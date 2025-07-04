import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../../context/UserContext/UserContext';
import classes from './sidebar.module.css';

const Sidebar = ({ navItems, title, isCollapsed = false, onToggleCollapse }) => {
  const { user, logout } = useUser();

  const handleToggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!navItems || navItems.length === 0) return null;

  return (
    <aside className={`${classes.sidebar} ${isCollapsed ? classes.collapsed : ''}`}>
      {/* Logo Section */}
      <div className={classes.logoContainer}>
        <h2 className={classes.title}>{title}</h2>
      </div>

      {/* Toggle Button */}
      <button 
        className={classes.toggleButton} 
        onClick={handleToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span className={classes.toggleIcon}>☰</span>
      </button>

      {/* Profile Section */}
      <div className={classes.profileContainer}>
        <div className={classes.avatarContainer}>
          <img 
            src="/default-avatar.png" 
            alt="Profile" 
            className={classes.avatar}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzIDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxMyAxMiAxNFoiIGZpbGw9IiM5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo=';
            }}
          />
        </div>
        <div className={classes.profileInfo}>
          <p className={classes.userName}>{user?.username || 'User'}</p>
          <p className={classes.userEmail}>{user?.email || ''}</p>
          <p className={classes.userRole}>{user?.role === 'admin' ? 'Administrator' : 'Staff Member'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={classes.navigation}>
        <ul className={classes.navList}>
          {navItems.map((item) => (
            <li key={item.to} className={classes.navItem}>
              <NavLink 
                to={item.to}
                className={({ isActive }) => 
                  `${classes.navLink} ${isActive ? classes.active : ''}`
                }
                end={item.to === "/staff" || item.to === "/admin"}
              >
                <span className={classes.navIcon}>{item.icon}</span>
                <span className={classes.navLabel}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className={classes.logoutSection}>
        <button 
          onClick={handleLogout}
          className={classes.logoutButton}
        >
          <span className={classes.logoutIcon}>🚪</span>
          <span className={classes.logoutText}>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 