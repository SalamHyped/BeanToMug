import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './styles.module.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const hasAttemptedVerification = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple verification attempts
      if (hasAttemptedVerification.current) {
        return;
      }
      
      hasAttemptedVerification.current = true;
      
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
          setVerificationStatus('error');
          setMessage('Missing verification information. Please check your email link.');
          return;
        }

        const response = await axios.get(
          `http://localhost:8801/auth/verify-email`, {
          params: { token, email },
          withCredentials: true
        });

        setVerificationStatus('success');
        setMessage(response.data.message || 'Your email has been verified successfully!');
        
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Verification failed. The link may be expired or invalid.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResendVerification = async () => {
    const email = searchParams.get('email');
    
    if (!email) {
      setMessage('Email address is missing. Please try again.');
      return;
    }
    
    try {
      setVerificationStatus('verifying');
      setMessage('Sending verification email...');
      
      const response = await axios.post(
        'http://localhost:8801/auth/resend-verification',
        { email },
        { withCredentials: true }
      );
      
      setVerificationStatus('info');
      setMessage(response.data.message || 'Verification email has been sent!');
    } catch (error) {
      setVerificationStatus('error');
      setMessage(error.response?.data?.message || 'Failed to resend verification email.');
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className={styles.verifyingContainer}>
            <div className={styles.loader}></div>
            <p>Verifying your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <Link to="/profile-completion" className={styles.loginButton}>
              Complete Your Profile
            </Link>
          </div>
        );

      case 'info':
        return (
          <div className={styles.infoContainer}>
            <div className={styles.infoIcon}>i</div>
            <h2>Verification Email Sent</h2>
            <p>{message}</p>
            <Link to="/login" className={styles.loginButton}>
              Back to Login
            </Link>
          </div>
        );

      case 'error':
        return (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>✗</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className={styles.buttonContainer}>
              <Link to="/login" className={styles.secondaryButton}>
                Back to Login
              </Link>
              <button 
                onClick={handleResendVerification}
                className={styles.primaryButton}
              >
                Resend Verification
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.verificationPage}>
      <div className={styles.verificationCard}>
        <h1 className={styles.title}>Email Verification</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default EmailVerification; 