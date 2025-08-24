const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /orders/staff/all
 * Retrieves orders for staff management with pagination and filtering
 * 
 * This endpoint allows staff to browse and filter orders:
 * - Requires user authentication via JWT token
 * - Supports pagination
 * - Supports date filtering (all, today, yesterday, week, month)
 * - Supports custom date range (startDate to endDate)
 * - Supports search by order ID, status, or order type
 * - Supports status filtering
 * - Returns paginated results with total count
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - dateFilter: Date filter (all, today, yesterday, week, month)
 * - startDate: Custom start date (YYYY-MM-DD format)
 * - endDate: Custom end date (YYYY-MM-DD format)
 * - searchTerm: Search term for order ID, status, or order type
 * - status: Filter by specific status (processing, completed, pending, etc.)
 * 
 * Authentication: Required (JWT token)
 * Response: Array of orders with pagination details
 */
router.get('/staff/all', authenticateToken, async (req, res) => {
  try {
    const { getCompleteOrderData } = require('../utils/orderUtils');
    
    // Get pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Keep reasonable default
    const offset = (page - 1) * limit;
    const dateFilter = req.query.dateFilter || 'all';
    const searchTerm = req.query.searchTerm || '';
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const status = req.query.status || null; // Add status parameter
    
    // Get filtered orders with pagination
    const { orders, totalCount, totalPages } = await getCompleteOrderData(null, { 
      page,
      limit,
      offset,
      dateFilter,
      searchTerm,
      startDate,
      endDate,
      status // Pass status to backend filtering
    });
    
    // Return successful response with paginated data
    res.json({
      success: true,
      orders: orders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching staff orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /orders/staff/recent
 * Retrieves recent orders for dashboard display
 * 
 * This endpoint provides a lightweight view of recent orders:
 * - Requires user authentication via JWT token
 * - Fetches only the 5 most recent orders for dashboard
 * - Includes complete order data with items and ingredients
 * - Optimized for dashboard performance
 * 
 * Authentication: Required (JWT token)
 * Response: Array of recent orders with their associated items and options
 */
router.get('/staff/recent', authenticateToken, async (req, res) => {
  try {
    const { getRecentOrders } = require('../utils/orderUtils');
    
    // Get limit from query params or default to 5
    const limit = parseInt(req.query.limit) || 5;
    
    // Get only recent orders (optimized)
    const recentOrders = await getRecentOrders(limit);
    
    // Return successful response with recent order data
    res.json({
      success: true,
      orders: recentOrders,
      meta: {
        limit: limit,
        count: recentOrders.length,
        endpoint: 'recent'
      }
    });
    
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders'
    });
  }
});



/**
 * GET /orders/staff/stats
 * Retrieves various order statistics for the dashboard
 * 
 * This endpoint provides key metrics for the dashboard:
 * - Total orders
 * - Today's orders
 * - This week's orders
 * - This month's orders
 * - Pending orders
 * - Completed orders
 * 
 * Authentication: Required (JWT token)
 * Response: Object containing statistics
 */
router.get('/staff/stats', authenticateToken, async (req, res) => {
  try {
    const { dbSingleton } = require('../utils/dbSingleton'); // Assuming dbSingleton is in orderUtils
    
    const connection = await dbSingleton.getConnection();
    
    // Get various statistics
    const stats = await Promise.all([
      // Total orders
      connection.execute('SELECT COUNT(*) as total FROM orders WHERE is_cart = 0'),
      // Today's orders
      connection.execute('SELECT COUNT(*) as today FROM orders WHERE is_cart = 0 AND DATE(created_at) = CURDATE()'),
      // This week's orders
      connection.execute('SELECT COUNT(*) as week FROM orders WHERE is_cart = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      // This month's orders
      connection.execute('SELECT COUNT(*) as month FROM orders WHERE is_cart = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'),
      // Pending orders
      connection.execute('SELECT COUNT(*) as pending FROM orders WHERE is_cart = 0 AND status = "pending"'),
      // Completed orders
      connection.execute('SELECT COUNT(*) as completed FROM orders WHERE is_cart = 0 AND status = "completed"')
    ]);
    
    const [total, today, week, month, pending, completed] = stats.map(result => result[0][0]);
    
    res.json({
      success: true,
      stats: {
        total: total.total,
        today: today.today,
        week: week.week,
        month: month.month,
        pending: pending.pending,
        completed: completed.completed
      }
    });
    
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
});



/**
 * PUT /orders/staff/:orderId/status
 * Updates order status for staff management
 * 
 * This endpoint allows staff to update order status:
 * - Requires user authentication via JWT token
 * - Updates the status of a specific order
 * - Validates the order exists
 * 
 * @param {string} orderId - The order ID from the URL parameter
 * @param {string} status - The new status (pending, processing, completed, cancelled)
 * 
 * Authentication: Required (JWT token)
 * Response: Updated order information
 */
router.put('/staff/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, processing, completed, cancelled'
      });
    }
    
   // Get order details before updating for notification
    const [orderRows] = await req.db.execute(
      'SELECT user_id, order_type, total_price, status FROM orders WHERE order_id = ? AND is_cart = 0',
      [orderId]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const orderData = orderRows[0];
    
    // Update the order status
    const [result] = await req.db.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ? AND is_cart = 0',
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Handle stock updates based on status change
    if (status === 'completed') {
      // Deduct stock when order is marked as completed
      try {
        const stockService = require('../services/stockService');
        const stockResult = await stockService.deductStockForOrder(orderId);
      } catch (stockError) {
        console.error(`Error deducting stock for order ${orderId}:`, stockError);
        // Don't fail the order status update if stock deduction fails
        // The stock can be manually adjusted later
      }
    } else if (status === 'cancelled') {
      // Restore stock when order is cancelled (in case it was previously completed)
      try {
        const stockService = require('../services/stockService');
        const stockResult = await stockService.restoreStockForCancelledOrder(orderId);
      } catch (stockError) {
        console.error(`Error restoring stock for cancelled order ${orderId}:`, stockError);
        // Don't fail the order status update if stock restoration fails
        // The stock can be manually adjusted later
      }
    }
    
    // Emit real-time notification for order update
    // Get complete order data to emit via WebSocket for better synchronization
    try {
      const { getSingleOrder } = require('../utils/orderUtils');
      const completeOrder = await getSingleOrder(orderId);
      
      if (completeOrder) {
        // Backend now always sends complete order data with order_id
        // No need for field normalization since we're using order_id consistently
        await req.socketService.emitOrderUpdate(completeOrder);
        
        // Emit financial KPI updates for real-time dashboard
        if (status === 'completed') {
          // Calculate only the incremental changes for efficient updates
          try {
            // Validate total_price exists
            if (!orderData.total_price || isNaN(orderData.total_price)) {
              console.error('❌ Invalid total_price from orderData:', orderData.total_price);
              return;
            }
            
            // Get current totals for percentage calculations (minimal query)
            const [currentTotals] = await req.db.execute(`
              SELECT 
                COALESCE(SUM(total_price), 0) as todayRevenue,
                COUNT(*) as todayOrderCount
              FROM orders 
              WHERE DATE(created_at) = CURDATE() 
                AND status = 'completed' 
                AND is_cart = 0
            `);
            
            // Get profit margin from config (cached)
            const databaseConfig = require('../utils/databaseConfig');
            const profitMargin = await databaseConfig.getProfitMargin('default') || 0.4;
            
            const orderImpact = {
              orderId: orderId,
              totalPrice: orderData.total_price,
              status: status,
              profitIncrease: orderData.total_price * profitMargin,
              currentTotals: {
                todayRevenue: parseFloat(currentTotals[0].todayRevenue),
                todayOrderCount: parseInt(currentTotals[0].todayOrderCount)
              }
            };
            
            req.socketService.emitOrderCompleted(orderImpact);
            
          } catch (kpiError) {
            // Silent fallback without KPI data
            req.socketService.emitOrderCompleted({
              orderId: orderId,
              totalPrice: orderData.total_price,
              status: status
            });
          }
        } else {
          // Check if this order was previously completed (decrease KPIs)
          try {
            // Get previous status from the database
            const [previousStatusRow] = await req.db.execute(
              'SELECT status FROM orders WHERE order_id = ? AND is_cart = 0',
              [orderId]
            );
            const previousStatus = previousStatusRow[0]?.status;

            if (previousStatus === 'completed') {
              // Get profit margin from config
              const databaseConfig = require('../utils/databaseConfig');
              const profitMargin = await databaseConfig.getProfitMargin('default') || 0.4;
              
              const orderDecrease = {
                orderId: orderId,
                totalPrice: orderData.total_price,
                status: status,
                previousStatus: 'completed',
                profitDecrease: orderData.total_price * profitMargin,
                message: `Order ${orderId} changed from completed to ${status} - decreasing KPIs`
              };
              
              // Emit order status changed event for KPI decrease
              req.socketService.emitOrderStatusChanged(orderDecrease);
            } else {
              // No KPI decrease needed
            }
            
          } catch (error) {
            // Silent error handling for previous status check
          }
        }
      } else {
        // Fallback to basic notification if complete data not available
        await req.socketService.emitOrderUpdate({
          order_id: orderId,
          status,
          customerId: orderData.user_id,
          orderType: orderData.order_type,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (wsError) {
      console.error('Error emitting WebSocket update:', wsError);
      // Fallback to basic notification
      await req.socketService.emitOrderUpdate({
        order_id: orderId,
        status,
        customerId: orderData.user_id,
        orderType: orderData.order_type,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Emit notification to staff
    req.socketService.emitNotification({
      targetRole: 'staff',
      message: `Order #${orderId} status updated to ${status}`,
      type: 'order_update'
    });
    
    // Return success response
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

/**
 * GET /orders/history
 * Retrieves the complete order history for the authenticated user
 * 
 * This endpoint provides a comprehensive view of all past orders:
 * - Requires user authentication via JWT token
 * - Fetches all orders (excluding cart items) for the logged-in user
 * - Groups order items with their respective orders
 * - Orders are sorted by creation date (newest first)
 * - Returns structured data for frontend order history display
 * 
 * Authentication: Required (JWT token)
 * Response: Array of orders with their associated items
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // Extract user ID from the authenticated JWT token
    // This ensures users can only access their own order history
    const userId = req.user.id;
    
    // Complex query to fetch all orders and their associated items
    // This query joins three tables:
    // - orders: Main order information (ID, type, status, timestamps)
    // - order_item: Individual items within each order (quantity, price)
    // - dish: Item details (name, description)
    // 
    // Key conditions:
    // - WHERE o.user_id = ?: Only orders belonging to the authenticated user
    // - AND o.is_cart = 0: Exclude cart items (only actual orders)
    // - ORDER BY o.created_at DESC: Most recent orders first
    const query = `
      SELECT 
        o.order_id,
        o.user_id,
        o.order_type,
        o.status,
        o.created_at,
        o.updated_at,
        oi.order_item_id,
        oi.item_id,
        d.item_name,
        oi.price,
        oi.quantity
      FROM orders o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN dish d ON oi.item_id = d.item_id
      WHERE o.user_id = ? AND o.is_cart = 0
      ORDER BY o.created_at DESC
    `;
    
    // Execute the query with the user ID as parameter
    const [rows] = await req.db.execute(query, [userId]);
    
    // Process the flat database results into a structured format
    // Group items by their parent order for easier frontend consumption
    const ordersMap = new Map();
    
    // Iterate through each row from the database
    rows.forEach(row => {
      // If this is a new order (not seen before), create the order object
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          user_id: row.user_id,
          order_type: row.order_type,    // e.g., "Dine In", "Take Away"
          status: row.status,            // e.g., "pending", "completed", "failed"
          created_at: row.created_at,    // When the order was placed
          updated_at: row.updated_at,    // Last status update
          items: []                      // Array to hold order items
        });
      }
      
      // If this row contains item data (not just order data), add it to the order
      // Some rows might only have order data if an order has no items (edge case)
      if (row.item_id) {
        const order = ordersMap.get(row.order_id);
        order.items.push({
          order_item_id: row.order_item_id,
          item_id: row.item_id,
          item_name: row.item_name,
          price: parseFloat(row.price),  // Convert string to number for consistency
          quantity: row.quantity,
          options: null // Options field not available in current schema
          // Note: Customization options (like "extra shot", "no ice") are not
          // currently stored in the database schema, so this is set to null
        });
      }
    });
    
    // Convert the Map to an array for JSON response
    const orders = Array.from(ordersMap.values());
    
    // Return successful response with structured order data
    res.json({
      success: true,
      orders: orders
    });
    
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error fetching order history:', error);
    
    // Return generic error message to client
    // In production, you might want to log more details but not expose them
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history'
    });
  }
});

/**
 * GET /orders/guest/:orderId
 * Retrieves detailed information about a guest order (no authentication required)
 * 
 * This endpoint provides comprehensive details for a guest order:
 * - No authentication required (for guest orders)
 * - Validates that the order exists and is a guest order (user_id = NULL)
 * - Fetches complete order information including all items
 * - Used for post-payment receipt display for guests
 * 
 * @param {string} orderId - The order ID from the URL parameter
 * 
 * Authentication: None (for guest orders)
 * Response: Detailed order information with items
 */
router.get('/guest/:orderId', async (req, res) => {
  try {
    const { getSingleOrder } = require('../utils/orderUtils');
    
    // Get the order ID from the URL parameter
    const orderId = req.params.orderId;
    
    // Get order details using shared utility (null for guest orders)
    const order = await getSingleOrder(orderId, null);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Guest order not found'
      });
    }
    
    // Return the complete order information with items
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    console.error('Error fetching guest order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
});

/**
 * GET /orders/:orderId
 * Retrieves detailed information about a specific order
 * 
 * This endpoint provides comprehensive details for a single order:
 * - Requires user authentication via JWT token
 * - Validates that the order belongs to the authenticated user
 * - Fetches complete order information including all items
 * - Provides security by ensuring users can only access their own orders
 * 
 * @param {string} orderId - The order ID from the URL parameter
 * 
 * Authentication: Required (JWT token)
 * Response: Detailed order information with items
 */
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { getSingleOrder } = require('../utils/orderUtils');
    
    // Extract user ID from the authenticated JWT token
    const userId = req.user.id;
    
    // Get the order ID from the URL parameter
    const orderId = req.params.orderId;
    
    // Get order details using shared utility (with user authentication)
    const order = await getSingleOrder(orderId, userId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Return the complete order information with items
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
});

/**
 * GET /orders/customer/all
 * Retrieves orders for customer view with pagination and filtering
 * 
 * This endpoint allows customers to view their own orders:
 * - Requires user authentication via JWT token
 * - Only returns orders belonging to the authenticated user
 * - Supports pagination
 * - Supports date filtering (all, today, yesterday, week, month)
 * - Supports custom date range (startDate to endDate)
 * - Supports search by order ID, status, or order type
 * - Returns paginated results with total count
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - dateFilter: Date filter (all, today, yesterday, week, month)
 * - startDate: Custom start date (YYYY-MM-DD format)
 * - endDate: Custom end date (YYYY-MM-DD format)
 * - searchTerm: Search term for order ID, status, or order type
 * - status: Filter by specific status (processing, completed, pending, etc.)
 * 
 * Authentication: Required (JWT token)
 * Response: Array of customer's orders with pagination details
 */
router.get('/customer/all', authenticateToken, async (req, res) => {
  try {
    const { getCompleteOrderData } = require('../utils/orderUtils');
    
    // Get pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const dateFilter = req.query.dateFilter || 'all';
    const searchTerm = req.query.searchTerm || '';
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const status = req.query.status || null; // Add status parameter
    
    // Get paginated and filtered orders for the authenticated user
    const { orders, totalCount, totalPages } = await getCompleteOrderData(null, { 
      page, 
      limit, 
      offset,
      dateFilter,
      searchTerm,
      startDate,
      endDate,
      status, // Pass status to backend filtering
      userId: req.user.user_id // Filter by authenticated user
    });
    
    // Return successful response with paginated data
    res.json({
      success: true,
      orders: orders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

module.exports = router; 