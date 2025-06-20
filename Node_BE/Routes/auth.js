const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateVerificationToken, verifyToken } = require('../utils/tokenUtil');
const { sendVerificationEmail } = require('../utils/mailer');

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
        role: 'customer'
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
      'SELECT * FROM users WHERE username = ?', 
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

    // 5. CART MIGRATION: Only for customers - merge session cart with user's database cart
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

    // 6. Set session data for authenticated user
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

    // 7. Send success response with user data and cart info (only for customers)
    const response = { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role
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
 * 2. Return user data if authenticated
 * 3. Return false if not authenticated
 * 
 * @route GET /auth/status
 * @returns {Object} Authentication status and user data
 */
router.get('/status', (req, res) => {
  if (req.session.userId) {
    // User is authenticated, return their session data
    return res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      }
    });
  }
  
  // User is not authenticated
  res.json({ authenticated: false });
});

module.exports = router; 