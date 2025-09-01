const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const financialService = require('../services/FinancialService');
const orderAnalyticsService = require('../services/OrderAnalyticsService');
const salesAnalyticsService = require('../services/SalesAnalyticsService');

// Get order ratings analytics
router.get('/order-ratings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    
    let result;
    
    if (range) {
      // Use predefined range (e.g., '7_days', '30_days')
      result = await orderAnalyticsService.getOrderRatings(range);
    } else if (startDate && endDate) {
      // Use custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      result = await orderAnalyticsService.getOrderRatings(start, end);
    } else {
      // Use default range from config
      result = await orderAnalyticsService.getOrderRatings();
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Failed to get order ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order ratings',
      error: error.message
    });
  }
});

// Get most popular items analytics
router.get('/popular-items', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    
    let result;
    
    if (range) {
      // Use predefined range (e.g., '7_days', '30_days')
      const end = new Date();
      const start = new Date();
      if (range === '7_days') start.setDate(start.getDate() - 7);
      else if (range === '30_days') start.setDate(start.getDate() - 30);
      else if (range === '90_days') start.setDate(start.getDate() - 90);
      result = await orderAnalyticsService.getMostPopularItems(start, end);
    } else if (startDate && endDate) {
      // Use custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      result = await orderAnalyticsService.getMostPopularItems(start, end);
    } else {
      // Use default range (last 30 days)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      result = await orderAnalyticsService.getMostPopularItems(start, end);
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Failed to get popular items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular items',
      error: error.message
    });
  }
});

// Get current targets
router.get('/targets', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const targets = orderAnalyticsService.getTargets();
    res.json({
      success: true,
      data: targets
    });
  } catch (error) {
    console.error('Failed to get targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get targets',
      error: error.message
    });
  }
});

// Update targets
router.put('/targets', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { targets } = req.body;
    
    if (!targets || typeof targets !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid targets data'
      });
    }
    
    await orderAnalyticsService.updateTargets(targets);
    
    res.json({
      success: true,
      message: 'Targets updated successfully',
      data: orderAnalyticsService.getTargets()
    });
  } catch (error) {
    console.error('Failed to update targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update targets',
      error: error.message
    });
  }
});

// Force refresh targets from database
router.post('/targets/refresh', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('🔄 Admin requested target refresh...');
    
    const refreshedTargets = await orderAnalyticsService.forceRefreshTargets();
    
    res.json({
      success: true,
      message: 'Targets refreshed successfully from database',
      data: refreshedTargets
    });
  } catch (error) {
    console.error('Failed to refresh targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh targets',
      error: error.message
    });
  }
});

// Get sales analytics
router.get('/sales-analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { range, startDate, endDate, granularity = 'daily' } = req.query;
    
    let start, end;
    
    if (range) {
      // Use predefined range
      end = new Date();
      start = new Date();
      
      if (range === 'today') start.setHours(0, 0, 0, 0);
      else if (range === '7_days') start.setDate(start.getDate() - 7);
      else if (range === '14_days') start.setDate(start.getDate() - 14);
      else if (range === '30_days') start.setDate(start.getDate() - 30);
      else if (range === '3_months') start.setDate(start.getDate() - 90);
      else if (range === '6_months') start.setDate(start.getDate() - 180);
      else if (range === '1_year') start.setDate(start.getDate() - 365);
      else {
        // Default to 30 days
        start.setDate(start.getDate() - 30);
      }
    } else if (startDate && endDate) {
      // Use custom date range
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
    }
    
    const result = await salesAnalyticsService.getSalesAnalytics(start, end, granularity);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Failed to get sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales analytics',
      error: error.message
    });
  }
});



// Get all users (Admin only)
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { includeDeactivated = 'false' } = req.query;
    
    let query = `
      SELECT id, username, email, first_name, last_name, phone_number, role, email_verified, 
             status
      FROM users 
    `;
    
    if (includeDeactivated === 'false') {
      query += ` WHERE status = TRUE`;
    }
    
    query += ` ORDER BY id DESC`;
    
    const [users] = await req.db.execute(query);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add new user (Admin only)
router.post('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone_number, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, password, and role are required' 
      });
    }
    
    // Validate role
    if (!['staff', 'customer'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role must be either staff or customer' 
      });
    }
    
    // Check if username already exists
    const [existingUsername] = await req.db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsername.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Check if email already exists
    const [existingEmail] = await req.db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await req.db.execute(`
      INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, email_verified) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [username, email, hashedPassword, first_name || '', last_name || '', phone_number || 0, role]);
    
    // Get the newly created user
    const [newUser] = await req.db.execute(`
      SELECT id, username, email, first_name, last_name, phone_number, role, email_verified
      FROM users WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser[0]
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create user' 
    });
  }
});

// Delete user (Admin only)
router.delete('/users/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists and get their role
    const [users] = await req.db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = users[0];
    
    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete admin users' 
      });
    }
    
    // Different logic for staff vs customer
    if (user.role === 'staff') {
      // Staff users should always be deactivated, never deleted
      return res.json({
        success: false,
        message: 'Staff users cannot be deleted. They will be deactivated instead.',
        userRole: 'staff',
        action: 'deactivate'
      });
    }
    
    // For customers, check if they have orders
    const [orders] = await req.db.execute(
      'SELECT order_id FROM orders WHERE user_id = ? LIMIT 1',
      [userId]
    );
    
    if (orders.length > 0) {
      // Customer has orders - deactivate instead of delete
      return res.json({
        success: false,
        message: 'Customer has existing orders. They will be deactivated instead.',
        userRole: 'customer',
        hasOrders: true,
        dataSummary: {
          orderCount: orders.length
        },
        action: 'deactivate'
      });
    }
    
    // Customer with no orders - safe to delete
    await req.db.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully (no orders found)'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
});

// Soft delete user (deactivate instead of delete)
router.post('/users/:userId/deactivate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const [users] = await req.db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = users[0];
    
    // Prevent deactivation of admin users
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot deactivate admin users' 
      });
    }
    
    // Soft delete by updating status
    await req.db.execute(`
      UPDATE users 
      SET status = FALSE
      WHERE id = ?
    `, [userId]);
    
    res.json({
      success: true,
      message: 'User deactivated successfully',
      user: { id: userId, status: false }
    });
    
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate user' 
    });
  }
});

// Reactivate a deactivated user
router.post('/users/:userId/reactivate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Reactivate user
    await req.db.execute(`
      UPDATE users 
      SET status = TRUE
      WHERE id = ?
    `, [userId]);
    
    res.json({
      success: true,
      message: 'User reactivated successfully',
      user: { id: userId, status: true }
    });
    
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reactivate user' 
    });
  }
});

// Get Financial KPIs (Admin only)
router.get('/financial-kpis', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const kpis = await financialService.getFinancialKPIs(req.user.id);
    
    res.json({
      success: true,
      data: {
        todaysRevenue: kpis.revenue.today.formatted,
        todaysPercentage: kpis.revenue.today.percentage,
        todaysChange: kpis.revenue.today.change,
        
        weeklyRevenue: kpis.revenue.weekly.formatted,
        weeklyPercentage: kpis.revenue.weekly.percentage,
        weeklyChange: kpis.revenue.weekly.change,
        
        averageOrderValue: kpis.aov.formatted,
        aovPercentage: kpis.aov.percentage,
        aovChange: `${kpis.aov.changeDirection === 'up' ? '+' : '-'}${kpis.aov.change}`,
        
        dailyProfit: kpis.profit.formatted,
        profitMargin: kpis.profit.marginFormatted,
        profitChange: kpis.profit.change,
        profitSource: kpis.profit.source,
        
        // Online Orders data
        onlineOrdersPercentage: kpis.onlineOrders.percentage,
        onlineOrdersFormatted: kpis.onlineOrders.formatted,
        onlineOrdersTarget: kpis.onlineOrders.target,
        onlineOrdersTargetFormatted: kpis.onlineOrders.targetFormatted,
        onlineOrdersPercentageAchievement: kpis.onlineOrders.percentageAchievement,
        
        lastUpdated: kpis.metadata.lastUpdated,
        dataQuality: kpis.metadata.dataQuality
      }
    });
  } catch (error) {
    console.error('Error fetching financial KPIs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch financial KPIs',
      error: error.message 
    });
  }
});

// Get Business Configuration (Admin only)
router.get('/business-config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const config = await financialService.getConfiguration(req.user.id);
    
    res.json({
      success: true,
      data: {
        profit_margins: config.financial,
        targets: config.targets,
        cost_categories: config.costs,
        settings: config.system,
        metadata: config.metadata
      }
    });
  } catch (error) {
    console.error('Error fetching business config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch business configuration',
      error: error.message 
    });
  }
});

// Update Business Configuration (Admin only)
router.put('/business-config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }
    
    const result = await financialService.updateConfiguration(key, value, req.user.id);
    
    res.json({
      success: true,
      message: 'Business configuration updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating business config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update business configuration',
      error: error.message 
    });
  }
});

// Get Order Analytics (Admin only)
router.get('/order-analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates or use defaults
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    
    const analytics = await orderAnalyticsService.getOrderAnalytics(start, end);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order analytics',
      error: error.message 
    });
  }
});

module.exports = router;
