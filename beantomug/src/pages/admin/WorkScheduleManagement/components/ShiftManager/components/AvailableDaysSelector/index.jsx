import React from 'react';
import styles from './availableDaysSelector.module.css';

const AvailableDaysSelector = ({ 
  selectedDays = [], 
  onChange, 
  error 
}) => {
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayToggle = (day) => {
    const isSelected = selectedDays.includes(day);
    let newDays;
    
    if (isSelected) {
      newDays = selectedDays.filter(d => d !== day);
    } else {
      newDays = [...selectedDays, day];
    }
    
    onChange(newDays);
  };

  const setPreset = (preset) => {
    switch (preset) {
      case 'weekdays':
        onChange(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        break;
      case 'weekends':
        onChange(['Saturday', 'Sunday']);
        break;
      case 'all':
        onChange(allDays);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Available Days *
      </label>
      <div className={styles.daysContainer}>
        {allDays.map(day => (
          <label key={day} className={styles.dayLabel}>
            <input
              type="checkbox"
              checked={selectedDays.includes(day)}
              onChange={() => handleDayToggle(day)}
              className={styles.dayCheckbox}
            />
            <span className={styles.dayText}>{day.slice(0, 3)}</span>
          </label>
        ))}
      </div>
      {error && (
        <span className={styles.errorText}>{error}</span>
      )}
      <div className={styles.presetsContainer}>
        <button 
          type="button" 
          onClick={() => setPreset('weekdays')}
          className={styles.presetButton}
        >
          Weekdays
        </button>
        <button 
          type="button" 
          onClick={() => setPreset('weekends')}
          className={styles.presetButton}
        >
          Weekends
        </button>
        <button 
          type="button" 
          onClick={() => setPreset('all')}
          className={styles.presetButton}
        >
          All Days
        </button>
      </div>
    </div>
  );
};

export default AvailableDaysSelector;
