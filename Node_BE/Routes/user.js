const express = require('express');
const bcrypt = require('bcrypt');
const { dbSingleton } = require('../dbSingleton');
const cartService = require('../services/cartService');
const router = express.Router();

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