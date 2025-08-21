import React, { useState, useEffect } from 'react';
import styles from './staffPlanningModal.module.css';

const StaffPlanningModal = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [planningStartDate, setPlanningStartDate] = useState('');
  const [excludedDates, setExcludedDates] = useState('');

  useEffect(() => {
    if (currentSettings) {
      setPlanningStartDate(currentSettings.start_date || '');
      setExcludedDates(currentSettings.exclude_dates || '');
    }
  }, [currentSettings]);

  const handleSave = () => {
    const settings = {
      start_date: planningStartDate,
      exclude_dates: excludedDates
    };
    onSave(settings);
    onClose();
  };

  const generateQuickExclusions = (type) => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (type === 'sundays' && date.getDay() === 0) {
        dates.push(date.toISOString().split('T')[0]);
      } else if (type === 'weekends' && (date.getDay() === 0 || date.getDay() === 6)) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    setExcludedDates(dates.join(','));
  };

  const getDefaultStartDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>👥 Configure Staff Planning</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.section}>
            <h3>📅 Planning Period</h3>
            <p className={styles.description}>
              Set when the 7-day planning window starts for staff to see available shifts.
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="startDate">Start Date:</label>
              <input
                id="startDate"
                type="date"
                value={planningStartDate}
                onChange={(e) => setPlanningStartDate(e.target.value)}
                className={styles.dateInput}
              />
              <button 
                type="button"
                onClick={() => setPlanningStartDate(getDefaultStartDate())}
                className={styles.quickButton}
              >
                Tomorrow
              </button>
            </div>

            <div className={styles.info}>
              <strong>Result:</strong> Staff will see available shifts from{' '}
              {planningStartDate || getDefaultStartDate()} to{' '}
              {(() => {
                const start = new Date(planningStartDate || getDefaultStartDate());
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return end.toISOString().split('T')[0];
              })()}
            </div>
          </div>

          <div className={styles.section}>
            <h3>🚫 Days Off</h3>
            <p className={styles.description}>
              Exclude specific dates from staff scheduling (holidays, maintenance, etc.)
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="excludedDates">Excluded Dates:</label>
              <input
                id="excludedDates"
                type="text"
                value={excludedDates}
                onChange={(e) => setExcludedDates(e.target.value)}
                placeholder="2024-08-25,2024-08-26,2024-09-01"
                className={styles.textInput}
              />
              <div className={styles.inputHelp}>
                Format: YYYY-MM-DD,YYYY-MM-DD (comma-separated)
              </div>
            </div>

            <div className={styles.quickActions}>
              <span>Quick presets:</span>
              <button 
                type="button"
                onClick={() => generateQuickExclusions('sundays')}
                className={styles.quickButton}
              >
                All Sundays
              </button>
              <button 
                type="button"
                onClick={() => generateQuickExclusions('weekends')}
                className={styles.quickButton}
              >
                All Weekends
              </button>
              <button 
                type="button"
                onClick={() => setExcludedDates('')}
                className={styles.quickButton}
              >
                Clear
              </button>
            </div>
          </div>

          <div className={styles.previewSection}>
            <h3>👀 Preview</h3>
            <div className={styles.preview}>
              {excludedDates && (
                <div>
                  <strong>Staff will NOT see shifts on:</strong>
                  <div className={styles.excludedList}>
                    {excludedDates.split(',').map(date => (
                      <span key={date} className={styles.excludedDate}>
                        {date.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <strong>Planning window:</strong> {planningStartDate || getDefaultStartDate()} + 6 days
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className={styles.saveButton}
          >
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffPlanningModal;
