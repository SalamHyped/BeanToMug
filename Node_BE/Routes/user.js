const express = require('express');
const bcrypt = require('bcrypt');
const { dbSingleton } = require('../dbSingleton');
const cartService = require('../services/cartService');
const router = express.Router();

// Login route with cart migration
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const connection = await dbSingleton.getConnection();
    
    // Find user
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password (assuming bcrypt)
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // CART MIGRATION: Handle guest cart from session
    const sessionCart = req.session.cart || [];
    const migrationResult = await cartService.migrateSessionToUser(
      user.id, 
      sessionCart // Session cart items from req.session.cart
    );
    
    // Set session data
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAuthenticated = true;
    
    // Update session cart with merged cart (for compatibility)
    req.session.cart = migrationResult.cartItems;
    
    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      cart: migrationResult.cartItems,
      cartMigrated: migrationResult.migrationPerformed
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }
    
    const connection = await dbSingleton.getConnection();
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: 'Username or email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, hashedPassword]
    );
    
    const userId = result.insertId;
    
    // CART MIGRATION: Handle guest cart from session
    const sessionCart = req.session.cart || [];
    const migrationResult = await cartService.migrateSessionToUser(
      userId, 
      sessionCart
    );
    
    // Set session data
    req.session.userId = userId;
    req.session.username = username;
    req.session.isAuthenticated = true;
    
    // Update session cart
    req.session.cart = migrationResult.cartItems;
    
    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        username,
        email
      },
      cart: migrationResult.cartItems,
      cartMigrated: migrationResult.migrationPerformed
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  try {
    // Clear user session but keep guest cart
    req.session.userId = null;
    req.session.username = null;
    req.session.isAuthenticated = false;
    
    // Keep cart for guest session
    const guestCart = req.session.cart || [];
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      cart: guestCart
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const connection = await dbSingleton.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: users[0]
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

module.exports = router; 