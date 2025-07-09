import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useUser } from '../../context/UserContext/UserContext';
import axios from 'axios';
import classes from './Profile.module.css';

export default function Profile() {
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    username: ''
  });  
  const [userStats, setUserStats] = useState({
    totalCompletedOrders: 0
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // SMS verification state
  const [smsVerification, setSmsVerification] = useState({
    isRequested: false,
    isVerified: false,
    code: '',
    isSending: false,
    isVerifying: false,
    countdown: 0
  });

  // Ref to store timer for cleanup
  const countdownTimerRef = useRef(null);

  // Memoized user display name
  const userDisplayName = useMemo(() => {
    if (!user) return '';
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.username;
  }, [user]);

  // Memoized user initials
  const userInitials = useMemo(() => {
    if (!user) return '';
    return user.firstName && user.lastName 
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : user.username.charAt(0).toUpperCase();
  }, [user]);

  // Memoized phone number formatting function
  const formatPhoneNumber = useCallback((value) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If it already has +972, keep it as is
    if (cleaned.startsWith('+972')) {
      return cleaned;
    }
    // If it's a 9-digit number starting with 0 (Israeli mobile), replace 0 with +972
    else if (cleaned.length === 9 && cleaned.startsWith('0')) {
      return `+972${cleaned.substring(1)}`;
    }
    // If it's a 9-digit number not starting with 0 (Israeli mobile), add +972
    else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
      return `+972${cleaned}`;
    }
    // If it's a 10-digit number starting with 0 (Israeli mobile), replace 0 with +972
    else if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `+972${cleaned.substring(1)}`;
    }
    // If it has any other format, keep the original input
    else {
      return value;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Fetch user statistics including order count


  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await axios.get('http://localhost:8801/user/me', {
          withCredentials: true
        });
        
        if (response.data.success) {
          setUserStats(response.data.userStats);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    };

    if (user) {
      fetchUserStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user]);

  // Input validation - memoized to prevent recreation
  const validateField = useCallback((name, value) => {
    const errors = {};
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phoneNumber':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
          errors.phoneNumber = 'Please enter a valid phone number';
        } else if (value && !value.startsWith('+972') && value.length > 0) {
          errors.phoneNumber = 'Please enter a valid Israeli phone number (should start with +972)';
        }
        break;
      case 'username':
        if (value && value.length < 3) {
          errors.username = 'Username must be at least 3 characters';
        }
        break;
      case 'firstName':
      case 'lastName':
        if (value && value.length < 2) {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        }
        break;
    }
    
    return errors;
  }, []);

  // Optimized input change handler with batched state updates
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = { ...prev };
      
      if (name === 'phoneNumber') {
        newFormData[name] = formatPhoneNumber(value);
      } else {
        newFormData[name] = value;
      }
      
      return newFormData;
    });

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [name]: null
    }));

    // Reset SMS verification if phone number changes
    if (name === 'phoneNumber') {
      setSmsVerification(prev => ({
        ...prev,
        isRequested: false,
        isVerified: false,
        code: ''
      }));
    }
  }, [formatPhoneNumber]);

  // Optimized SMS code sending with proper timer cleanup
  const handleSendSmsCode = useCallback(async () => {
    if (!formData.phoneNumber) {
      setValidationErrors(prev => ({
        ...prev,
        phoneNumber: 'Please enter a phone number first'
      }));
      return;
    }

    const phoneErrors = validateField('phoneNumber', formData.phoneNumber);
    if (Object.keys(phoneErrors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...phoneErrors }));
      return;
    }

    try {
      setSmsVerification(prev => ({ ...prev, isSending: true }));
      
      const response = await axios.post('http://localhost:8801/auth/send-sms-verification', {
        phoneNumber: formData.phoneNumber
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Clear any existing timer
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }

        setSmsVerification(prev => ({
          ...prev,
          isRequested: true,
          isSending: false,
          countdown: 60
        }));
        
        // Start countdown timer with proper cleanup
        countdownTimerRef.current = setInterval(() => {
          setSmsVerification(prev => {
            if (prev.countdown <= 1) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
              return { ...prev, countdown: 0 };
            }
            return { ...prev, countdown: prev.countdown - 1 };
          });
        }, 1000);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      setValidationErrors(prev => ({
        ...prev,
        sms: error.response?.data?.message || 'Failed to send verification code'
      }));
      setSmsVerification(prev => ({ ...prev, isSending: false }));
    }
  }, [formData.phoneNumber, validateField]);

  const handleVerifySmsCode = useCallback(async () => {
    if (!smsVerification.code) {
      setValidationErrors(prev => ({
        ...prev,
        sms: 'Please enter the verification code'
      }));
      return;
    }

    try {
      setSmsVerification(prev => ({ ...prev, isVerifying: true }));
      
      const response = await axios.post('http://localhost:8801/auth/verify-sms', {
        code: smsVerification.code
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setSmsVerification(prev => ({
          ...prev,
          isVerified: true,
          isVerifying: false
        }));
        setValidationErrors(prev => ({ ...prev, sms: '' }));
        setSuccess('Phone number verified successfully!');
        
        // Auto-save the profile after successful verification
        console.log('Auto-saving profile after verification...');
        await handleSave();
      }
    } catch (error) {
      console.error('SMS verification error:', error);
      setValidationErrors(prev => ({
        ...prev,
        sms: error.response?.data?.message || 'Failed to verify code'
      }));
      setSmsVerification(prev => ({ ...prev, isVerifying: false }));
    }
  }, [smsVerification.code]);

  const handleSave = useCallback(async () => {
    try {
      // Validate all fields
      const errors = {};
      Object.keys(formData).forEach(field => {
        const fieldErrors = validateField(field, formData[field]);
        Object.assign(errors, fieldErrors);
      });

      // Check if phone number was changed and needs verification
      if (formData.phoneNumber && formData.phoneNumber !== user.phoneNumber && !smsVerification.isVerified) {
        errors.phoneNumber = 'Please verify your phone number before saving';
      }

      console.log('Validation errors:', errors);

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        console.log('Validation failed, not saving');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      // Prepare the data to send
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        username: formData.username
      };

      const response = await axios.put('http://localhost:8801/user/profile', dataToSend, {
        withCredentials: true
      });

      if (response.data.success) {
        updateUser(response.data.user);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setValidationErrors({});
        // Reset SMS verification state
        setSmsVerification({
          isRequested: false,
          isVerified: false,
          code: '',
          isSending: false,
          isVerifying: false,
          countdown: 0
        });
        console.log('Profile saved successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Handle specific error types
      if (err.response?.status === 409 && err.response?.data?.error?.includes('Username')) {
        setValidationErrors(prev => ({
          ...prev,
          username: 'Username already exists'
        }));
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, user.phoneNumber, smsVerification.isVerified, validateField, updateUser]);

  const handleCancel = useCallback(() => {
    // Reset form data to original user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      username: user.username || ''
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setSmsVerification({
      isRequested: false,
      isVerified: false,
      code: '',
      isSending: false,
      isVerifying: false,
      countdown: 0
    });
  }, [user]);

  const handleChangePassword = useCallback(() => {
    // This would typically open a modal or navigate to a password change page
    setError('Password change functionality will be implemented separately');
  }, []);

  // Memoized SMS code change handler
  const handleSmsCodeChange = useCallback((e) => {
    setSmsVerification(prev => ({ ...prev, code: e.target.value }));
  }, []);

  if (!user) {
    return (
      <div className={classes.container}>
        <div className={classes.errorMessage}>
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className={classes.successMessage}>
          {success}
        </div>
      )}

      {error && (
        <div className={classes.errorMessage}>
          {error}
        </div>
      )}

      <div className={classes.profileContent}>
        {/* Profile Picture Section */}
        <div className={classes.profilePictureSection}>
          <div className={classes.profilePicture}>
            <div className={classes.avatar}>
              {userInitials}
            </div>
          </div>
          <div className={classes.profileInfo}>
            <h2>{userDisplayName}</h2>
            <p className={classes.userRole}>Customer</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className={classes.profileForm}>
          <div className={classes.formHeader}>
            <h3>Personal Information</h3>
            {!isEditing && (
              <button 
                className={classes.editButton}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className={classes.formGrid}>
            <div className={classes.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`${classes.input} ${validationErrors.firstName ? classes.inputError : ''}`}
                placeholder="Enter your first name"
              />
              {validationErrors.firstName && (
                <span className={classes.errorText}>{validationErrors.firstName}</span>
              )}
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`${classes.input} ${validationErrors.lastName ? classes.inputError : ''}`}
                placeholder="Enter your last name"
              />
              {validationErrors.lastName && (
                <span className={classes.errorText}>{validationErrors.lastName}</span>
              )}
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`${classes.input} ${validationErrors.username ? classes.inputError : ''}`}
                placeholder="Enter your username"
              />
              {validationErrors.username && (
                <span className={classes.errorText}>{validationErrors.username}</span>
              )}
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`${classes.input} ${validationErrors.email ? classes.inputError : ''}`}
                placeholder="Enter your email"
              />
              {user.emailVerified && (
                <span className={classes.verifiedBadge}>✓ Verified</span>
              )}
              {validationErrors.email && (
                <span className={classes.errorText}>{validationErrors.email}</span>
              )}
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="phoneNumber">Phone Number</label>
              <div className={classes.phoneInputGroup}>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`${classes.input} ${validationErrors.phoneNumber ? classes.inputError : ''}`}
                  placeholder="e.g., 525881614 or 0525881614"
                />
              </div>
              <small className={classes.helpText}>
                Enter your Israeli mobile number (9 or 10 digits). Examples: 525881614, 0525881614, or +972525881614. The +972 prefix will be added automatically.
              </small>
              {validationErrors.phoneNumber && (
                <span className={classes.errorText}>{validationErrors.phoneNumber}</span>
              )}
            </div>

            {/* SMS Verification Section */}
            {isEditing && formData.phoneNumber && (
              <div className={classes.smsVerification}>
                {!smsVerification.isRequested ? (
                  <button
                    type="button"
                    onClick={handleSendSmsCode}
                    disabled={smsVerification.isSending}
                    className={classes.sendCodeButton}
                  >
                    {smsVerification.isSending ? 'Sending...' : 'Send Verification Code'}
                  </button>
                ) : (
                  <div className={classes.verificationSection}>
                    <div className={classes.codeInputGroup}>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={smsVerification.code}
                        onChange={handleSmsCodeChange}
                        className={classes.codeInput}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifySmsCode}
                        disabled={smsVerification.isVerifying || smsVerification.isVerified}
                        className={classes.verifyButton}
                      >
                        {smsVerification.isVerifying ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                    
                    {smsVerification.isVerified && (
                      <div className={classes.verifiedMessage}>
                        ✓ Phone number verified successfully!
                        {loading && <span> Saving profile...</span>}
                        {!loading && (
                          <button
                            type="button"
                            onClick={handleSave}
                            className={classes.saveAfterVerificationButton}
                          >
                            Save Profile
                          </button>
                        )}
                      </div>
                    )}
                    
                    {smsVerification.countdown > 0 ? (
                      <div className={classes.countdown}>
                        Resend available in {smsVerification.countdown}s
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendSmsCode}
                        disabled={smsVerification.isSending}
                        className={classes.resendButton}
                      >
                        {smsVerification.isSending ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                )}
                
                {validationErrors.sms && (
                  <span className={classes.errorText}>{validationErrors.sms}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className={classes.actionButtons}>
              <button 
                className={classes.saveButton}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className={classes.cancelButton}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Account Security Section */}
        <div className={classes.securitySection}>
          <h3>Account Security</h3>
          <div className={classes.securityOptions}>
            <div className={classes.securityOption}>
              <div className={classes.securityInfo}>
                <h4>Password</h4>
                <p>Change your account password</p>
              </div>
              <button 
                className={classes.securityButton}
                onClick={handleChangePassword}
              >
                Change Password
              </button>
            </div>

            <div className={classes.securityOption}>
              <div className={classes.securityInfo}>
                <h4>Email Verification</h4>
                <p>Your email is {user.emailVerified ? 'verified' : 'not verified'}</p>
              </div>
              {!user.emailVerified && (
                <button className={classes.securityButton}>
                  Resend Verification
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className={classes.statsSection}>
          <h3>Account Overview</h3>
          <div className={classes.statsGrid}>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>{userStats.totalCompletedOrders}</div>
              <div className={classes.statLabel}>Total Orders</div>
            </div>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>$0.00</div>
              <div className={classes.statLabel}>Total Spent</div>
            </div>
          
          </div>
        </div>
      </div>
    </div>
  );
} 