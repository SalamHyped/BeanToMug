import React from 'react';
import classes from './toggleSwitch.module.css';

const ToggleSwitch = ({ 
  isOn, 
  onToggle, 
  leftLabel = "Processing", 
  rightLabel = "Completed",
  disabled = false 
}) => {
  return (
    <div className={classes.toggleContainer}>
      <span className={`${classes.label} ${!isOn ? classes.activeLabel : ''}`}>
        {leftLabel}
      </span>
      <button
        className={`${classes.toggleSwitch} ${isOn ? classes.on : classes.off} ${disabled ? classes.disabled : ''}`}
        onClick={onToggle}
        disabled={disabled}
        type="button"
        role="switch"
        aria-checked={isOn}
      >
        <span className={classes.slider} />
      </button>
      <span className={`${classes.label} ${isOn ? classes.activeLabel : ''}`}>
        {rightLabel}
      </span>
    </div>
  );
};

export default ToggleSwitch; 