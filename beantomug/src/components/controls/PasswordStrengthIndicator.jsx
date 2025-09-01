import React from 'react';
import classes from './PasswordStrengthIndicator.module.css';

export default function PasswordStrengthIndicator({ password, strength }) {
  if (!password) return null;

  return (
    <div className={classes.passwordStrength}>
      <div className={classes.strengthBar}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div 
            key={index} 
            className={`${classes.strengthSegment} ${
              index < strength.score 
                ? classes[`strength${strength.score}`]
                : ''
            }`}
          />
        ))}
      </div>
      {strength.label && (
        <span className={classes.strengthLabel}>
          {strength.label}
        </span>
      )}
    </div>
  );
}

