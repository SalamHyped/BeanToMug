import React, { useState, useCallback } from 'react';
import axios from 'axios';
import usePasswordStrength from '../../../hooks/usePasswordStrength';
import { getApiConfig } from '../../../utils/config';
import classes from './PasswordChangeForm.module.css';

export default function PasswordChangeForm({ onSuccess, onCancel, onError }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChanging, setIsChanging] = useState(false);
  const [errors, setErrors] = useState({});
  const { passwordStrength, calculatePasswordStrength } = usePasswordStrength();

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Calculate password strength for new password
    if (field === 'newPassword') {
      calculatePasswordStrength(value);
    }
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors, calculatePasswordStrength]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long';
    } else if (passwordStrength.score < 2) {
      newErrors.newPassword = 'Password is too weak. Please use a stronger password with uppercase letters, numbers, or special characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'New passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, passwordStrength.score]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsChanging(true);
    setErrors({});

    try {
      const response = await axios.put(`${getApiConfig().baseURL}/auth/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.message);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        if (errorMessage.includes('Current password is incorrect')) {
          setErrors({ currentPassword: errorMessage });
        } else if (errorMessage.includes('New password must be different')) {
          setErrors({ newPassword: errorMessage });
        } else {
          setErrors({ general: errorMessage });
        }
      } else {
        setErrors({ general: errorMessage });
      }
      
      // Call error callback
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsChanging(false);
    }
  }, [formData, validateForm, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    
    // Call cancel callback
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <div className={classes.passwordChangeForm}>
      <div className={classes.formHeader}>
        <h4>Change Password</h4>
        <p>Enter your current password and choose a new one</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* General Error */}
        {errors.general && (
          <div className={classes.errorMessage}>
            {errors.general}
          </div>
        )}

        {/* Current Password */}
        <div className={classes.formGroup}>
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={formData.currentPassword}
            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
            className={errors.currentPassword ? classes.inputError : ''}
            disabled={isChanging}
            placeholder="Enter your current password"
          />
          {errors.currentPassword && (
            <span className={classes.errorText}>{errors.currentPassword}</span>
          )}
        </div>
        
                 {/* New Password */}
         <div className={classes.formGroup}>
           <label htmlFor="newPassword">New Password</label>
           <input
             type="password"
             id="newPassword"
             value={formData.newPassword}
             onChange={(e) => handleInputChange('newPassword', e.target.value)}
             className={errors.newPassword ? classes.inputError : ''}
             disabled={isChanging}
             placeholder="Enter your new password (min 6 characters)"
             minLength={6}
           />
           {formData.newPassword && passwordStrength.label && (
             <div className={classes.passwordStrength}>
               <div className={classes.strengthBar}>
                 <div 
                   className={`${classes.strengthFill} ${classes[`strength${passwordStrength.score}`]}`}
                   style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                 ></div>
               </div>
               <span className={`${classes.strengthLabel} ${classes[`strength${passwordStrength.score}`]}`}>
                 {passwordStrength.label}
               </span>
             </div>
           )}
           {formData.newPassword && passwordStrength.score < 2 && (
             <div className={classes.weakPasswordWarning}>
               <span className={classes.warningIcon}>⚠️</span>
               <span className={classes.warningText}>
                 Password is too weak. Add uppercase letters, numbers, or special characters.
               </span>
             </div>
           )}
           {errors.newPassword && (
             <span className={classes.errorText}>{errors.newPassword}</span>
           )}
         </div>
        
        {/* Confirm New Password */}
        <div className={classes.formGroup}>
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? classes.inputError : ''}
            disabled={isChanging}
            placeholder="Confirm your new password"
            minLength={6}
          />
          {errors.confirmPassword && (
            <span className={classes.errorText}>{errors.confirmPassword}</span>
          )}
        </div>
        
        {/* Form Actions */}
        <div className={classes.formActions}>
          <button
            type="button"
            onClick={handleCancel}
            className={classes.cancelButton}
            disabled={isChanging}
          >
            Cancel
          </button>
                     <button
             type="submit"
             className={classes.submitButton}
             disabled={isChanging || passwordStrength.score < 2}
           >
             {isChanging ? 'Changing...' : 'Change Password'}
           </button>
        </div>
      </form>
    </div>
  );
}
