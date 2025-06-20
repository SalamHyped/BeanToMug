const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user's order history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all orders for the user with their items
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
    
    const [rows] = await req.db.execute(query, [userId]);
    
    // Group orders and their items
    const ordersMap = new Map();
    
    rows.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          user_id: row.user_id,
          order_type: row.order_type,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          items: []
        });
      }
      
      if (row.item_id) {
        const order = ordersMap.get(row.order_id);
        order.items.push({
          order_item_id: row.order_item_id,
          item_id: row.item_id,
          item_name: row.item_name,
          price: parseFloat(row.price),
          quantity: row.quantity,
          options: null // Options field not available in current schema
        });
      }
    });
    
    const orders = Array.from(ordersMap.values());
    
    res.json({
      success: true,
      orders: orders
    });
    
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history'
    });
  }
});

// Get specific order details
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;
    
    // Verify the order belongs to the user
    const orderQuery = `
      SELECT * FROM orders 
      WHERE order_id = ? AND user_id = ? AND is_cart = 0
    `;
    
    const [orderRows] = await req.db.execute(orderQuery, [orderId, userId]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const order = orderRows[0];
    
    // Get order items with dish information
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
    
    const [itemRows] = await req.db.execute(itemsQuery, [orderId]);
    
    const items = itemRows.map(item => ({
      order_item_id: item.order_item_id,
      item_id: item.item_id,
      item_name: item.item_name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      options: null // Options field not available in current schema
    }));
    
    res.json({
      success: true,
      order: {
        ...order,
        items: items
      }
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
});

module.exports = router; 