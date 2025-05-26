import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './styles.module.css';

const VerificationPending = () => {
  const location = useLocation();
  console.log(location);
  const email = location.state?.email;

  return (
    <div className={styles.verificationPage}>
      <div className={styles.verificationCard}>
        <h1 className={styles.title}>Verify Your Email</h1>
        <div className={styles.content}>
          <div className={styles.emailIcon}>📧</div>
          <h2>Almost there!</h2>
          <p>We've sent a verification email to:</p>
          <p className={styles.emailAddress}>{email}</p>
          <p>Please check your inbox and click the verification link to complete your registration.</p>
          
          <div className={styles.infoBox}>
            <h3>Haven't received the email?</h3>
            <ul>
              <li>Check your spam folder</li>
              <li>Make sure the email address is correct</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <div className={styles.buttonContainer}>
            <Link to="/resend-verification" className={styles.resendButton}>
              Resend Verification Email
            </Link>
            <Link to="/login" className={styles.loginButton}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending; 