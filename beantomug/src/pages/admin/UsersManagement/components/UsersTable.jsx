import React from 'react';
import styles from '../index.module.css';

const UsersTable = ({ users, onDelete, onReactivate }) => {
  if (users.length === 0) {
    return (
      <p className={styles.noUsers}>No users found</p>
    );
  }

  return (
    <div className={styles.usersTable}>
      <div className={styles.tableHeader}>
        <div className={styles.headerCell}>Username</div>
        <div className={styles.headerCell}>Email</div>
        <div className={styles.headerCell}>Name</div>
        <div className={styles.headerCell}>Role</div>
        <div className={styles.headerCell}>Status</div>
        <div className={styles.headerCell}>Phone</div>
        <div className={styles.headerCell}>Actions</div>
      </div>
      
      {users.map(user => (
        <div key={user.id} className={styles.tableRow}>
          <div className={styles.cell}>{user.username}</div>
          <div className={styles.cell}>{user.email}</div>
          <div className={styles.cell}>
            {user.first_name || user.last_name 
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : 'N/A'
            }
          </div>
          <div className={styles.cell}>
            <span className={`${styles.role} ${styles[user.role]}`}>
              {user.role}
            </span>
          </div>
          <div className={styles.cell}>
            <span className={`${styles.status} ${styles[user.status ? 'active' : 'deactivated']}`}>
              {user.status ? 'active' : 'deactivated'}
            </span>
          </div>
          <div className={styles.cell}>
            {user.phone_number || 'N/A'}
          </div>
          <div className={styles.cell}>
            <div className={styles.actionButtons}>
              {!user.status ? (
                <button
                  className={styles.reactivateButton}
                  onClick={() => onReactivate(user.id)}
                >
                  Reactivate
                </button>
              ) : (
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(user.id)}
                  disabled={user.role === 'admin'}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UsersTable;
