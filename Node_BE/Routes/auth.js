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

 */
router.post('/signup', async (req, res) => {
  try {
    // Extract user data from request body
    const { username, password, email } = req.body;
    
    // Basic input validation
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }
    
    // Check if username is already taken
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
    
    // Check if email is already registered
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

    // Hash password before storing
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
    
    // Generate one-time verification token
    // CHANGE: Token is no longer stored in database, only sent via email
    const verificationToken = generateVerificationToken(email);
    
    // Attempt to send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // CHANGE: Continue even if email fails, user can request new verification email later
    }
    
    // Return success response
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
 * 

 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    // Validate required parameters
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and email are required'
      });
    }
    
    // Verify the token's validity
    const isValid = verifyToken(token, email);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Find the user account
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
    
    // Update user's verification status
    await req.db.query(
      'UPDATE users SET email_verified = true WHERE id = ?',
      [user.id]
    );
    
    // Set session for automatic login
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

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
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
    
    // If already verified, no need to resend
    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'Email is already verified'
      });
    }
    
    // Generate a new verification token
    const verificationToken = generateVerificationToken(email);
    
    // Send verification email
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

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 1. Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // 2. Query database for user
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );
    
    const user = users[0];
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // 3. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // 4. Check email verification
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // 5. CART MIGRATION: Only for customers
    let cartMigrationResult = null;
    if (user.role === 'customer') {
      const cartService = require('../services/cartService');
      // Get session cart items array, default to empty array if not exists
      const sessionCart = req.session.cart?.items || [];
      console.log(sessionCart);
      cartMigrationResult = await cartService.migrateSessionToUser(
        user.id, 
        sessionCart
      );
      // Update session cart with merged cart (for compatibility)
      req.session.cart = {
        items: cartMigrationResult.cartItems,
        orderType: cartMigrationResult.orderType || 'Dine In'
      };
    }

    // 6. Set session data
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    // Save the session
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

    // 7. Send success response with cart info (only for customers)
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

// Logout endpoint
router.post('/logout', (req, res) => {
  if (req.session) {
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
    res.json({ 
      success: true, 
      message: 'Already logged out' 
    });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session.userId) {
    return res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      }
    });
  }
  
  res.json({ authenticated: false });
});

module.exports = router; 