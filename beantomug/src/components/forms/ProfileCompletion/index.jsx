import React, { useState } from 'react';
import axios from 'axios';
import classes from './profileCompletion.module.css';

const ProfileCompletion = ({ onComplete, onSkip, user }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SMS verification state
  const [smsVerification, setSmsVerification] = useState({
    isRequested: false,
    isVerified: false,
    code: '',
    isSending: false,
    isVerifying: false,
    countdown: 0
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Handle phone number formatting
      let formattedValue = value;
      
      // Remove all non-digit characters except +
      const cleaned = value.replace(/[^\d+]/g, '');
      
      // If it already has +972, keep it as is
      if (cleaned.startsWith('+972')) {
        formattedValue = cleaned;
      }
      // If it's a 9-digit number starting with 0 (Israeli mobile), replace 0 with +972
      else if (cleaned.length === 9 && cleaned.startsWith('0')) {
        formattedValue = `+972${cleaned.substring(1)}`;
      }
      // If it's a 9-digit number not starting with 0 (Israeli mobile), add +972
      else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
        formattedValue = `+972${cleaned}`;
      }
      // If it's a 10-digit number starting with 0 (Israeli mobile), replace 0 with +972
      else if (cleaned.length === 10 && cleaned.startsWith('0')) {
        formattedValue = `+972${cleaned.substring(1)}`;
      }
      // If it has any other format, keep the original input
      else {
        formattedValue = value;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Reset SMS verification if phone number changes
    if (name === 'phoneNumber') {
      setSmsVerification(prev => ({
        ...prev,
        isRequested: false,
        isVerified: false,
        code: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Phone number validation if provided
    if (formData.phoneNumber) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }
    
    return newErrors;
  };

  const handleSendSmsCode = async () => {
    if (!formData.phoneNumber) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: 'Please enter a phone number first'
      }));
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
        setSmsVerification(prev => ({
          ...prev,
          isRequested: true,
          isSending: false,
          countdown: 60
        }));
        
        // Start countdown timer
        const timer = setInterval(() => {
          setSmsVerification(prev => {
            if (prev.countdown <= 1) {
              clearInterval(timer);
              return { ...prev, countdown: 0 };
            }
            return { ...prev, countdown: prev.countdown - 1 };
          });
        }, 1000);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      setErrors(prev => ({
        ...prev,
        sms: error.response?.data?.message || 'Failed to send verification code'
      }));
      setSmsVerification(prev => ({ ...prev, isSending: false }));
    }
  };

  const handleVerifySmsCode = async () => {
    if (!smsVerification.code) {
      setErrors(prev => ({
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
        setErrors(prev => ({ ...prev, sms: '' }));
      }
    } catch (error) {
      console.error('SMS verification error:', error);
      setErrors(prev => ({
        ...prev,
        sms: error.response?.data?.message || 'Failed to verify code'
      }));
      setSmsVerification(prev => ({ ...prev, isVerifying: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update user profile
      const response = await axios.put('http://localhost:8801/user/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        onComplete({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ 
        general: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip(user);
  };

  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <div className={classes.header}>
          <h2>Complete Your Profile</h2>
          <p>Welcome to BeanToMug! Let's personalize your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.formGroup}>
            <label htmlFor="firstName">First Name (Optional)</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              className={classes.input}
            />
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="lastName">Last Name (Optional)</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              className={classes.input}
            />
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g., 525881614 or 0525881614"
                className={`${classes.input} ${errors.phoneNumber ? classes.error : ''}`}
              />
              <small className={classes.helpText}>
                Enter your Israeli mobile number (9 or 10 digits). Examples: 525881614, 0525881614, or +972525881614. The +972 prefix will be added automatically.
              </small>
            {errors.phoneNumber && (
              <span className={classes.errorText}>{errors.phoneNumber}</span>
            )}
          </div>

          {/* SMS Verification Section */}
          {formData.phoneNumber && (
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
                      onChange={(e) => setSmsVerification(prev => ({ ...prev, code: e.target.value }))}
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

              {errors.sms && (
                <span className={classes.errorText}>{errors.sms}</span>
              )}
            </div>
          )}

          {errors.general && (
            <div className={classes.generalError}>
              {errors.general}
            </div>
          )}

          <div className={classes.buttonGroup}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={classes.submitButton}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
            
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className={classes.skipButton}
            >
              Skip for Now
            </button>
          </div>
        </form>

        <div className={classes.footer}>
          <p>You can always update your profile later in your account settings.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion; 