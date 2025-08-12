import React from 'react';
import styles from '../index.module.css';

const UserFilters = ({ 
  searchTerm, 
  onSearchChange, 
  roleFilter, 
  onRoleChange, 
  userCount, 
  filteredCount 
}) => {
  return (
    <div className={styles.filterControls}>
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          name="search"
          value={searchTerm}
          onChange={onSearchChange}
          className={styles.searchInput}
        />
      </div>
      
      <div className={styles.roleFilter}>
        <select
          name="role"
          value={roleFilter}
          onChange={onRoleChange}
          className={styles.filterSelect}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
      </div>
      
      <div className={styles.filterInfo}>
        Showing {filteredCount} of {userCount} users
        {searchTerm && ` (filtered by "${searchTerm}")`}
      </div>
    </div>
  );
};

export default UserFilters;
