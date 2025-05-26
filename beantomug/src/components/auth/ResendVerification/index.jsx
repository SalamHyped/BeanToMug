import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './styles.module.css';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    
    try {
      setStatus('loading');
      setMessage('Sending verification email...');
      
      const response = await axios.post(
        'http://localhost:8801/auth/resend-verification',
        { email },
        { withCredentials: true }
      );
      
      setStatus('success');
      setMessage(response.data.message || 'Verification email has been sent!');
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Failed to send verification email. Please try again.'
      );
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>{message}</p>
          </div>
        );
      
      case 'success':
        return (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h3>Email Sent!</h3>
            <p>{message}</p>
            <p>Please check your inbox and click the verification link.</p>
            <Link to="/login" className={styles.loginButton}>
              Return to Login
            </Link>
          </div>
        );
      
      case 'error':
        return (
          <>
            <div className={styles.errorMessage}>{message}</div>
            {renderForm()}
          </>
        );
      
      default:
        return renderForm();
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="Enter your email address"
          required
        />
      </div>
      
      <div className={styles.buttonContainer}>
        <button type="submit" className={styles.primaryButton}>
          Send Verification Email
        </button>
        <Link to="/login" className={styles.secondaryButton}>
          Back to Login
        </Link>
      </div>
    </form>
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Resend Verification Email</h2>
        <p className={styles.subtitle}>
          Enter your email address below to receive a new verification link.
        </p>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default ResendVerification; 