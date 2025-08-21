import React, { useState } from 'react';
import styles from './shiftManager.module.css';
import { useShifts } from '../../hooks';
import ShiftForm from './components/ShiftForm';
import ShiftList from './components/ShiftList';

const ShiftManager = ({ onBack }) => {
  const { 
    shifts, 
    loading, 
    error, 
    createShift, 
    updateShift, 
    deleteShift,
    activeShifts,
    inactiveShifts
  } = useShifts();

  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Handle form submission
  const handleFormSubmit = async (submitData) => {
    setSubmitLoading(true);
    
    try {
      if (editingShift) {
        await updateShift(editingShift.shift_id, submitData);
      } else {
        await createShift(submitData);
      }
      handleCloseForm();
    } catch (err) {
      // Error is already handled in the hook
      console.error('Form submission error:', err);
      throw err; // Re-throw so form can handle it
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseForm = () => {
    setEditingShift(null);
    setShowForm(false);
  };

  // Handle edit shift
  const handleEdit = (shift) => {
    setEditingShift(shift);
    setShowForm(true);
  };

  // Handle delete shift
  const handleDelete = async (shift) => {
    if (window.confirm(`Are you sure you want to delete the "${shift.shift_name}" shift? This action cannot be undone.`)) {
      try {
        await deleteShift(shift.shift_id);
      } catch (err) {
        // Error is already handled in the hook
        console.error('Delete error:', err);
      }
    }
  };

  // Toggle shift active status
  const handleToggleActive = async (shift) => {
    try {
      await updateShift(shift.shift_id, {
        ...shift,
        is_active: !shift.is_active
      });
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Calendar
        </button>
        <h2>⚙️ Shift Management</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className={styles.addButton}
          disabled={loading}
        >
          ➕ Add New Shift
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Shift Form */}
      <ShiftForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        editingShift={editingShift}
        loading={submitLoading}
      />

      {/* Shifts List */}
      <div className={styles.content}>
        <ShiftList
          shifts={shifts}
          loading={loading}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          onAddNew={() => setShowForm(true)}
        />
      </div>
    </div>
  );
};

export default ShiftManager;