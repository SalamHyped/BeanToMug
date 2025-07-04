const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /orders/staff/all
 * Retrieves all orders for staff management
 * 
 * This endpoint provides a comprehensive view of all orders for staff:
 * - Requires user authentication via JWT token
 * - Fetches all orders (excluding cart items) for staff management
 * - Groups order items with their respective orders
 * - Includes ingredients/options for each order item
 * - Orders are sorted by creation date (newest first)
 * - Returns structured data for staff order management
 * 
 * Authentication: Required (JWT token)
 * Response: Array of orders with their associated items and options
 */
router.get('/staff/all', authenticateToken, async (req, res) => {
  try {
    // Complex query to fetch all orders and their associated items with ingredients
    // This query joins four tables:
    // - orders: Main order information (ID, type, status, timestamps)
    // - order_item: Individual items within each order (quantity, price)
    // - dish: Item details (name, description)
    // - order_item_ingredient: Customization options/ingredients for each item
    // 
    // Key conditions:
    // - WHERE o.is_cart = 0: Exclude cart items (only actual orders)
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
        oi.quantity,
        oii.ingredient_id,
        oii.price as ingredient_price,
        ing.ingredient_name,
        it.name as ingredient_type
      FROM orders o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN dish d ON oi.item_id = d.item_id
      LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
      LEFT JOIN ingredient ing ON oii.ingredient_id = ing.ingredient_id
      LEFT JOIN ingredient_type it ON it.id = ing.type_id
      WHERE o.is_cart = 0
      ORDER BY o.created_at DESC, oi.order_item_id, oii.ingredient_id
    `;
    
    // Execute the query
    const [rows] = await req.db.execute(query);
    
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
        
        // Check if this item already exists in the order
        let existingItem = order.items.find(item => item.order_item_id === row.order_item_id);
        
        if (!existingItem) {
          // Create new item
          existingItem = {
            order_item_id: row.order_item_id,
            item_id: row.item_id,
            item_name: row.item_name,
            price: parseFloat(row.price),  // Convert string to number for consistency
            quantity: row.quantity,
            ingredients: []  // Array to hold ingredients/options
          };
          order.items.push(existingItem);
        }
        
        // Add ingredient/option if it exists
        if (row.ingredient_id) {
          existingItem.ingredients.push({
            ingredient_id: row.ingredient_id,
            ingredient_name: row.ingredient_name,
            price: parseFloat(row.ingredient_price || 0),
            category: row.ingredient_type
          });
        }
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
    console.error('Error fetching staff orders:', error);
    
    // Return generic error message to client
    // In production, you might want to log more details but not expose them
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
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
    // Extract user ID from the authenticated JWT token
    const userId = req.user.id;
    
    // Get the order ID from the URL parameter
    const orderId = req.params.orderId;
    
    // Step 1: Verify the order exists and belongs to the authenticated user
    // This is a security measure to prevent users from accessing other users' orders
    const orderQuery = `
      SELECT * FROM orders 
      WHERE order_id = ? AND user_id = ? AND is_cart = 0
    `;
    
    // Execute the query with order ID and user ID as parameters
    const [orderRows] = await req.db.execute(orderQuery, [orderId, userId]);
    
    // If no order is found, return 404 error
    // This could happen if:
    // - The order doesn't exist
    // - The order belongs to a different user
    // - The order is actually a cart item (is_cart = 1)
    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Extract the order data (there should only be one row)
    const order = orderRows[0];
    
    // Step 2: Get all items associated with this order
    // This query fetches item details by joining order_item with dish table
    const itemsQuery = `
      SELECT 
        oi.order_item_id,
        oi.item_id,
        oi.quantity,
        oi.price,
        d.item_name
      FROM order_item oi
      LEFT JOIN dish d ON oi.item_id = d.item_id
      WHERE oi.order_id = ?
    `;
    
    // Execute the query to get all items for this order
    const [itemRows] = await req.db.execute(itemsQuery, [orderId]);
    
    // Process the item data into a consistent format
    const items = itemRows.map(item => ({
      order_item_id: item.order_item_id,
      item_id: item.item_id,
      item_name: item.item_name,
      price: parseFloat(item.price),  // Convert string to number
      quantity: item.quantity,
      options: null // Options field not available in current schema
      // Note: Customization options are not currently stored in the database
    }));
    
    // Return the complete order information with items
    res.json({
      success: true,
      order: {
        ...order,  // Spread all order properties (id, status, timestamps, etc.)
        items: items  // Add the processed items array
      }
    });
    
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error fetching order details:', error);
    
    // Return generic error message to client
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
});

module.exports = router; 