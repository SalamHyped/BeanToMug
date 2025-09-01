import React, { useState } from 'react';
import axios from 'axios';
import { getApiConfig } from '../../utils/config';
import classes from './ForgotPasswordForm.module.css';

export default function ForgotPasswordForm({ onBackToLogin, onSuccess }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post('/auth/forgot-password', { email }, getApiConfig());
      
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');
        setEmail('');
        
        if (onSuccess) {
          onSuccess(email);
        }
      } else {
        setMessage(response.data.message || 'Something went wrong');
        setMessageType('error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  return (
    <div className={classes.forgotPasswordContainer}>
      <div className={classes.header}>
        <h2>Forgot Password?</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearMessage();
            }}
            placeholder="Enter your email address"
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
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <button
            type="button"
            className={classes.backButton}
            onClick={onBackToLogin}
            disabled={isSubmitting}
          >
            Back to Login
          </button>
        </div>
      </form>

      <div className={classes.helpText}>
        <p>Remember your password? <button onClick={onBackToLogin} className={classes.linkButton}>Sign in here</button></p>
      </div>
    </div>
  );
}

