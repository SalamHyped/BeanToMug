import React, { useState, useEffect } from 'react';
import styles from './index.module.css';
import { 
  UserForm, 
  UsersTable, 
  UserFilters, 
  useUsers, 
  useUserFilters 
} from './components';

const UsersManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeactivated, setShowDeactivated] = useState(false);
  
  // Custom hooks for logic separation
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    addUser, 
    deleteUser, 
    reactivateUser,
    clearError 
  } = useUsers();
  
  const { 
    searchTerm, 
    roleFilter, 
    filteredUsers, 
    handleSearchChange, 
    handleRoleChange 
  } = useUserFilters(users);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers(showDeactivated ? 'true' : 'false');
  }, [showDeactivated, fetchUsers]);

  const handleAddUser = async (userData) => {
    const result = await addUser(userData);
    if (result.success) {
      setShowAddForm(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    await deleteUser(userId);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading users...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Users Management</h1>
        <div className={styles.headerControls}>
          <div className={styles.dropdownContainer}>
            <button className={styles.dropdownButton}>
              Orders Management ▼
            </button>
            <div className={styles.dropdownMenu}>
              <a href="/admin/orders/queue" className={styles.dropdownItem}>
                📋 Order Queue
              </a>
              <a href="/admin/orders/history" className={styles.dropdownItem}>
                📚 Order History
              </a>
              <a href="/admin/orders/analytics" className={styles.dropdownItem}>
                📊 Analytics
              </a>
              <div className={styles.dropdownDivider}></div>
              <a href="/admin/orders/settings" className={styles.dropdownItem}>
                ⚙️ Settings
              </a>
            </div>
          </div>
          <button 
            className={`${styles.toggleButton} ${showDeactivated ? styles.active : ''}`}
            onClick={() => setShowDeactivated(!showDeactivated)}
          >
            {showDeactivated ? 'Hide Deactivated' : 'Show Deactivated'}
          </button>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add New User'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Filter Controls */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleChange={handleRoleChange}
        userCount={users.length}
        filteredCount={filteredUsers.length}
      />

      {showAddForm && (
        <UserForm
          onSubmit={handleAddUser}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className={styles.usersList}>
        <h3>
          {showDeactivated ? 'All Users (Including Deactivated)' : 'Active Users Only'}
          <span className={styles.userCount}> ({filteredUsers.length})</span>
        </h3>
        {filteredUsers.length === 0 ? (
          <p className={styles.noUsers}>
            {users.length === 0 ? 'No users found' : 'No users match your filters'}
          </p>
        ) : (
                      <UsersTable
              users={filteredUsers}
              onDelete={handleDeleteUser}
              onReactivate={reactivateUser}
            />
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
