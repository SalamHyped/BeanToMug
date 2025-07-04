const express = require('express');
const bcrypt = require('bcrypt');
const { dbSingleton } = require('../dbSingleton');
const cartService = require('../services/cartService');
const router = express.Router();



// Get current user info
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const connection = await dbSingleton.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, first_name, last_name, phone_number, role, email_verified FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    res.json({
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
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { firstName, lastName, phoneNumber, username } = req.body;
    
    const connection = await dbSingleton.getConnection();
    
    // Check if username is being updated and if it's already taken
    if (username !== undefined) {
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.session.userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(409).json({ 
          error: 'Username already exists' 
        });
      }
    }
    
    // Update user profile with only the provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName || '');
    }
    
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName || '');
    }
    
    if (phoneNumber !== undefined) {
      updateFields.push('phone_number = ?');
      updateValues.push(phoneNumber || '');
    }
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username || '');
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update' 
      });
    }
    
    updateValues.push(req.session.userId);
    
    // Update user profile
    await connection.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Get updated user info
    const [updatedUsers] = await connection.execute(
      'SELECT id, username, email, first_name, last_name, phone_number, role, email_verified FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (updatedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = updatedUsers[0];
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name || '',
        lastName: updatedUser.last_name || '',
        phoneNumber: updatedUser.phone_number || '',
        role: updatedUser.role,
        emailVerified: updatedUser.email_verified === 1
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router; 