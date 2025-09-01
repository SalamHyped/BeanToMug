import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiConfig } from '../../utils/config';
import PasswordStrengthIndicator from '../controls/PasswordStrengthIndicator';
import usePasswordStrength from '../../hooks/usePasswordStrength';
import classes from './ResetPasswordForm.module.css';

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const { passwordStrength, calculatePasswordStrength } = usePasswordStrength();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setMessage('Invalid reset link. Please request a new password reset.');
        setMessageType('error');
        setIsValidating(false);
        return;
      }

      try {
        const response = await axios.post('/auth/verify-reset-token', { token, email }, getApiConfig());
        
        if (response.data.success) {
          setTokenValid(true);
          setMessage('');
        } else {
          setMessage('Reset link is invalid or has expired. Please request a new one.');
          setMessageType('error');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to validate reset link.';
        setMessage(errorMessage);
        setMessageType('error');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate password strength when password field changes
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    // Clear message when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const validateForm = () => {
    if (!formData.password.trim()) {
      setMessage('Please enter a new password');
      setMessageType('error');
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post('/auth/reset-password', {
        token,
        email,
        newPassword: formData.password
      }, getApiConfig());
      
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(response.data.message || 'Something went wrong');
        setMessageType('error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className={classes.container}>
        <div className={classes.loadingContainer}>
          <div className={classes.spinner}></div>
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={classes.container}>
        <div className={classes.errorContainer}>
          <h2>Invalid Reset Link</h2>
          <p>{message}</p>
          <button 
            onClick={() => navigate('/login')}
            className={classes.primaryButton}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.resetPasswordContainer}>
        <div className={classes.header}>
          <h2>Reset Your Password</h2>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.inputGroup}>
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter new password"
              required
              disabled={isSubmitting}
              minLength={6}
            />
            <small>Password must be at least 6 characters long</small>
            
            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator 
              password={formData.password} 
              strength={passwordStrength} 
            />
          </div>

          <div className={classes.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm new password"
              required
              disabled={isSubmitting}
            />
          </div>

          {message && (
            <div className={`${classes.message} ${classes[messageType]}`}>
              {message}
            </div>
          )}

          <div className={classes.buttonGroup}>
            <button
              type="submit"
              className={classes.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
            
            <button
              type="button"
              className={classes.backButton}
              onClick={() => navigate('/login')}
              disabled={isSubmitting}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
