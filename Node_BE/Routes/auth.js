const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateVerificationToken, verifyToken, generatePasswordResetToken, verifyPasswordResetToken } = require('../utils/tokenUtil');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const vonageService = require('../utils/vonageService');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Signup Endpoint
 * --------------
 * This endpoint handles new user registration with email verification.
 * Recent changes moved from a two-step (pending registration) to a direct user creation approach.
 * 
 * Flow:
 * 1. Validate input
 * 2. Check for existing users
 * 3. Create user account (with email_verified = false)
 * 4. Send verification email
 * 
 * Changes from previous version:
 * - Removed pending_registrations table usage
 * - Users are now created directly in users table with email_verified = false
 * 
 * @route POST /auth/signup
 * @param {string} username - User's chosen username
 * @param {string} password - User's password (will be hashed)
 * @param {string} email - User's email address
 * @returns {Object} Success/error response with verification status
 */
router.post('/signup', async (req, res) => {
  try {
    // Extract user data from request body
    const { username, password, email } = req.body;
    
    // Basic input validation - ensure all required fields are present
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }
    
    // Check if username is already taken in the database
    const [existingUsers] = await req.db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Check if email is already registered to prevent duplicate accounts
    const [existingEmails] = await req.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmails.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Hash password using bcrypt with salt rounds for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user with unverified email status
    // CHANGE: Users are now directly created in users table instead of pending_registrations
    const [result] = await req.db.query(
      'INSERT INTO users (username, password, email, role, email_verified) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, 'customer', false]
    );
    
    if (!result.insertId) {
      throw new Error('Failed to insert user');
    }
    
    // Generate one-time verification token for email verification
    // CHANGE: Token is no longer stored in database, only sent via email
    const verificationToken = generateVerificationToken(email);
    
    // Attempt to send verification email to user
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // CHANGE: Continue even if email fails, user can request new verification email later
    }
    
    // Return success response indicating verification is required
    res.status(201).json({
      success: true,
      message: 'Registration pending. Please check your email to verify your account.',
      requiresVerification: true
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

/**
 * Email Verification Endpoint
 * --------------------------
 * Verifies user's email address using the token sent via email.
 * This endpoint is accessed when user clicks the verification link in their email.
 * 
 * Flow:
 * 1. Extract token and email from query parameters
 * 2. Validate token authenticity
 * 3. Find unverified user account
 * 4. Mark email as verified
 * 5. Set session for automatic login
 * 
 * @route GET /auth/verify-email
 * @param {string} token - Verification token from email
 * @param {string} email - User's email address
 * @returns {Object} Success/error response with user data
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    // Validate required parameters are present
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and email are required'
      });
    }
    
    // Verify the token's validity using the token utility
    const isValid = verifyToken(token, email);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Find the user account that matches email and is not yet verified
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE email = ? AND email_verified = false',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    const user = users[0];
    
    // Update user's verification status to true
    await req.db.query(
      'UPDATE users SET email_verified = true WHERE id = ?',
      [user.id]
    );
    
    // Set session for automatic login after verification
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = 'customer';
    
    res.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number || '',
        role: 'customer',
        emailVerified: true
      }
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

/**
 * Resend Verification Email Endpoint
 * ---------------------------------
 * Allows users to request a new verification email if the original was lost or expired.
 * 
 * Flow:
 * 1. Validate email parameter
 * 2. Find user account
 * 3. Check if already verified
 * 4. Generate new token and send email
 * 
 * @route POST /auth/resend-verification
 * @param {string} email - User's email address
 * @returns {Object} Success/error response
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email parameter is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user with the provided email address
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // If already verified, no need to resend verification email
    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'Email is already verified'
      });
    }
    
    // Generate a new verification token for the user
    const verificationToken = generateVerificationToken(email);
    
    // Send verification email with the new token
    await sendVerificationEmail(email, verificationToken);
    
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resend verification'
    });
  }
});

/**
 * Login Endpoint
 * -------------
 * Authenticates users and creates a session for logged-in users.
 * Includes cart migration functionality for customers.
 * 
 * Flow:
 * 1. Validate input credentials
 * 2. Query database for user
 * 3. Verify password using bcrypt
 * 4. Check email verification status
 * 5. Migrate session cart to user cart (for customers)
 * 6. Set session data
 * 7. Return user data and cart information
 * 
 * @route POST /auth/login
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Object} Success/error response with user and cart data
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 1. Validate input - ensure both username and password are provided
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // 2. Query database for user with the provided username
    const [users] = await req.db.query(
      'SELECT *, status FROM users WHERE username = ?', 
      [username]
    );
    
    const user = users[0];
    
    // Check if user exists in database
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // 3. Validate password using bcrypt compare
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // 4. Check if user has verified their email address
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // 5. Check if user account is active (not deactivated)
    if (!user.status) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact us.',
        accountDeactivated: true
      });
    }

    // 6. CART MIGRATION: Only for customers - merge session cart with user's database cart
    let cartMigrationResult = null;
    if (user.role === 'customer') {
      const cartService = require('../services/cartService');
      // Get session cart items array, default to empty array if not exists
      const sessionCart = req.session.cart?.items || [];
      console.log('Session cart before migration:', sessionCart);
      
      if (sessionCart.length > 0) {
        // Migrate session cart items to user's database cart
        cartMigrationResult = await cartService.migrateSessionToUser(
          user.id, 
          sessionCart
        );
        console.log('Cart migration result:', cartMigrationResult);
        
        // Update session cart with merged cart (for compatibility)
        req.session.cart = {
          items: cartMigrationResult.cartItems || [],
          orderType: cartMigrationResult.orderType || 'Dine In'
        };
      } else {
        // No session cart to migrate, but get existing user cart
        const userCart = await cartService.getCart(user.id);
        cartMigrationResult = {
          cartItems: userCart.items || [],
          orderType: userCart.orderType || 'Dine In',
          migrationPerformed: false
        };
        req.session.cart = {
          items: userCart.items || [],
          orderType: userCart.orderType || 'Dine In'
        };
      }
    }

    // 7. Set session data for authenticated user
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    // Save the session to ensure it's persisted
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });

    // 8. Send success response with user data and cart info (only for customers)
    const response = { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number || '',
        role: user.role,
        emailVerified: user.email_verified === 1
      }
    };

    // Add cart info only for customers
    if (user.role === 'customer' && cartMigrationResult) {
      response.cart = cartMigrationResult.cartItems;
      response.cartMigrated = cartMigrationResult.migrationPerformed;
    }

    return res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

/**
 * Logout Endpoint
 * --------------
 * Destroys the user's session and logs them out.
 * 
 * Flow:
 * 1. Check if session exists
 * 2. Destroy session if it exists
 * 3. Return success response
 * 
 * @route POST /auth/logout
 * @returns {Object} Success response
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    // Destroy the session to log out the user
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to logout' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    });
  } else {
    // User is already logged out (no session exists)
    res.json({ 
      success: true, 
      message: 'Already logged out' 
    });
  }
});

/**
 * Authentication Status Check Endpoint
 * -----------------------------------
 * Checks if the user is currently authenticated and returns their session data.
 * Used by frontend to determine login state.
 * 
 * Flow:
 * 1. Check if session contains userId
 * 2. Query database for full user information
 * 3. Return user data if authenticated
 * 4. Return false if not authenticated
 * 
 * @route GET /auth/status
 * @returns {Object} Authentication status and user data
 */
router.get('/status', async (req, res) => {
  try {
    if (req.session.userId) {
      // User is authenticated, get full user data from database
      const [users] = await req.db.query(
        'SELECT id, username, email, first_name, last_name, phone_number, role, email_verified FROM users WHERE id = ?',
        [req.session.userId]
      );
      
      if (users.length > 0) {
        const user = users[0];
        return res.json({ 
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            phoneNumber: user.phone_number || '',
            role: user.role,
            emailVerified: user.email_verified === 1
          }
        });
      }
    }
    
    // User is not authenticated
    res.json({ authenticated: false });
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(500).json({ 
      authenticated: false, 
      error: 'Failed to check authentication status' 
    });
  }
});

/**
 * Enhanced Signup with SMS Verification
 * ------------------------------------
 * Registration endpoint that includes SMS verification for phone numbers.
 * 
 * NOTE: This endpoint has been removed since SMS verification is now handled
 * in the Profile Completion flow after basic signup. This provides a better
 * user experience by separating account creation from profile completion.
 * 
 * The flow is now:
 * 1. User signs up with /auth/signup (username, password, email)
 * 2. User completes profile with /user/profile (including SMS verification)
 * 
 * This approach is cleaner and more user-friendly.
 */

/**
 * Send SMS Verification Code
 * -------------------------
 * Sends a verification code via SMS to the provided phone number.
 * Used during registration or for phone number verification.
 * 
 * Flow:
 * 1. Validate phone number
 * 2. Generate verification code
 * 3. Store code in session with expiration
 * 4. Send SMS with code
 * 
 * @route POST /auth/send-sms-verification
 * @param {string} phoneNumber - User's phone number
 * @returns {Object} Success/error response
 */
router.post('/send-sms-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    if (!vonageService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if Vonage is properly configured
    if (!vonageService.isConfigured()) {
      console.error('Vonage configuration error:', vonageService.testConfiguration());
      return res.status(500).json({
        success: false,
        message: 'SMS service is not properly configured. Please contact support.'
      });
    }
    
    // Generate verification code
    const verificationCode = vonageService.generateVerificationCode();
    
    // Store verification code in session with 10-minute expiration
    req.session.smsVerification = {
      phoneNumber: phoneNumber,
      code: verificationCode,
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    
    // Send SMS with verification code
    try {
      await vonageService.sendVerificationCode(phoneNumber, verificationCode);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code. Please try again later.'
      });
    }
    
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: '10 minutes'
    });
    
  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during SMS verification'
    });
  }
});

/**
 * Verify SMS Code
 * --------------
 * Verifies the SMS code sent to the user's phone number.
 * Used during registration or for phone number verification.
 * 
 * Flow:
 * 1. Validate verification code
 * 2. Check if code matches and is not expired
 * 3. Mark phone number as verified
 * 4. Clear verification session
 * 
 * @route POST /auth/verify-sms
 * @param {string} code - Verification code from SMS
 * @returns {Object} Success/error response
 */
router.post('/verify-sms', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Validate code
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    // Check if verification session exists
    if (!req.session.smsVerification) {
      return res.status(400).json({
        success: false,
        message: 'No verification code requested. Please request a new code.'
      });
    }
    
    const { phoneNumber, code: storedCode, expiresAt } = req.session.smsVerification;
    
    // Check if code is expired
    if (Date.now() > expiresAt) {
      delete req.session.smsVerification;
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }
    
    // Check if code matches
    if (code !== storedCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Code is valid - mark phone number as verified
    req.session.phoneVerified = true;
    req.session.verifiedPhoneNumber = phoneNumber;
    
    // Clear verification session
    delete req.session.smsVerification;
    
    res.json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: phoneNumber
    });
    
  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
});

/**
 * Forgot Password Endpoint
 * ------------------------
 * Handles password reset requests by sending a reset email to the user.
 * 
 * Flow:
 * 1. Validate email parameter
 * 2. Check if user exists and is verified
 * 3. Generate password reset token
 * 4. Send password reset email
 * 
 * @route POST /auth/forgot-password
 * @param {string} email - User's email address
 * @returns {Object} Success/error response
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email parameter
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user with the provided email address
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    const user = users[0];
    
    // Check if user's email is verified
    if (!user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before requesting a password reset'
      });
    }
    
    // Check if user account is active
    if (!user.status) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Generate password reset token
    const resetToken = generatePasswordResetToken(email);
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
      
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email'
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

/**
 * Reset Password Endpoint
 * -----------------------
 * Resets user's password using the token from the reset email.
 * 
 * Flow:
 * 1. Validate token, email, and new password
 * 2. Verify reset token
 * 3. Update user's password
 * 4. Return success response
 * 
 * @route POST /auth/reset-password
 * @param {string} token - Password reset token
 * @param {string} email - User's email address
 * @param {string} newPassword - New password
 * @returns {Object} Success/error response
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    // Validate required parameters
    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and new password are required'
      });
    }
    
    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Verify the reset token
    const isValidToken = verifyPasswordResetToken(token, email);
    
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Find user with the provided email
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Check if user account is active
    if (!user.status) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    await req.db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

/**
 * Verify Reset Token Endpoint
 * ---------------------------
 * Verifies if a password reset token is valid without resetting the password.
 * Useful for frontend validation before showing the reset password form.
 * 
 * Flow:
 * 1. Validate token and email
 * 2. Verify reset token validity
 * 3. Return token status
 * 
 * @route POST /auth/verify-reset-token
 * @param {string} token - Password reset token
 * @param {string} email - User's email address
 * @returns {Object} Token validation response
 */
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token, email } = req.body;
    
    // Validate required parameters
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token and email are required'
      });
    }
    
    // Verify the reset token
    const isValidToken = verifyPasswordResetToken(token, email);
    
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Check if user exists
    const [users] = await req.db.query(
      'SELECT id, status FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Check if user account is active
    if (!user.status) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    res.json({
      success: true,
      message: 'Reset token is valid',
      valid: true
    });
    
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

/**
 * Change Password Endpoint
 * ------------------------
 * Allows authenticated users to change their password by providing current password.
 * 
 * Flow:
 * 1. Validate current password and new password
 * 2. Verify current password matches
 * 3. Hash new password and update in database
 * 4. Return success response
 * 
 * @route PUT /auth/change-password
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - User's new password
 * @returns {Object} Success/error response
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validate required parameters
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }
    
    // Get user from database
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    await req.db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password has been changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

module.exports = router; 