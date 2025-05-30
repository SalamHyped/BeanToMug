import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../../context/UserContext/UserContext';
import classes from './sidebar.module.css';

const Sidebar = ({ user, isCollapsed = false, onToggleCollapse }) => {
  const { logout } = useUser();

  const handleToggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { to: "/admin", label: "Dashboard", icon: "🏠" },
        { to: "/admin/orders", label: "Orders", icon: "📋" },
        { to: "/admin/users", label: "Users", icon: "👥" },
        { to: "/admin/menu", label: "Menu Management", icon: "📝" }
      ];
    }
    
    if (isStaff) {
      return [
        { to: "/staff", label: "Dashboard", icon: "🏠", end: true },
        { to: "/staff/orders", label: "Orders Queue", icon: "📋" },
        { to: "/staff/inventory", label: "Inventory", icon: "📦" }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  if (!navItems.length) return null;

  return (
    <aside className={`${classes.sidebar} ${isCollapsed ? classes.active : ''}`}>
      {/* Logo Section */}
      <div className={classes.logoContainer}>
        <h2 className={classes.title}>
          {isAdmin ? 'Admin Panel' : 'Staff Panel'}
        </h2>
      </div>

      {/* Burger Menu */}
      <div className={classes.burgerContainer} onClick={handleToggleSidebar}>
        <div className={classes.burgerTrigger}></div>
        <div className={classes.burgerMenu}></div>
      </div>

      {/* Profile Section */}
      <div className={classes.profileContainer}>
        <img 
          src="/default-avatar.png" 
          alt="Profile" 
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzIDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxMyAxMiAxNFoiIGZpbGw9IiM5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo=';
          }}
        />
        <div className={classes.profileContents}>
          <p className={classes.name}>{user?.username || 'User'}</p>
          <p className={classes.email}>{user?.email || ''}</p>
          </div>
          
        
      </div>

      {/* Navigation */}
      <nav className={`${classes.contentsContainer} ${isCollapsed ? classes.active : ''}`}>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink 
                to={item.to}
             
                className={({ isActive }) => 
                  isActive ? classes.active : ''
                }
              >
                <span className={classes.icon}>{item.icon}</span>
                <p className={classes.label}>{item.label}</p>
              </NavLink>
            </li>
          ))}
          
          {/* Logout Button */}
          <li>
            <button 
              onClick={handleLogout}
              className={classes.logoutButton}
            >
              <span className={classes.icon}>🚪</span>
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 