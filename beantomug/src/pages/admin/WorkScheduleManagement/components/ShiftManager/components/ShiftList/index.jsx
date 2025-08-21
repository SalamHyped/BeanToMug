import React from 'react';
import styles from './shiftList.module.css';
import ShiftCard from '../ShiftCard';

const ShiftList = ({ 
  shifts = [], 
  loading = false, 
  onEdit, 
  onToggleActive, 
  onDelete,
  onAddNew 
}) => {
  const activeShifts = shifts.filter(shift => shift.is_active);
  const inactiveShifts = shifts.filter(shift => !shift.is_active);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading shifts...</p>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚙️</div>
        <h3>No Shifts Created</h3>
        <p>Create your first shift template to start scheduling staff.</p>
        <button 
          onClick={onAddNew} 
          className={styles.addButton}
        >
          ➕ Add New Shift
        </button>
      </div>
    );
  }

  return (
    <div className={styles.shiftsSection}>
      {/* Active Shifts */}
      {activeShifts.length > 0 && (
        <div className={styles.shiftsGroup}>
          <h3 className={styles.groupTitle}>✅ Active Shifts ({activeShifts.length})</h3>
          <div className={styles.shiftsGrid}>
            {activeShifts.map(shift => (
              <ShiftCard
                key={shift.shift_id}
                shift={shift}
                isActive={true}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Shifts */}
      {inactiveShifts.length > 0 && (
        <div className={styles.shiftsGroup}>
          <h3 className={styles.groupTitle}>🔒 Inactive Shifts ({inactiveShifts.length})</h3>
          <div className={styles.shiftsGrid}>
            {inactiveShifts.map(shift => (
              <ShiftCard
                key={shift.shift_id}
                shift={shift}
                isActive={false}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftList;
