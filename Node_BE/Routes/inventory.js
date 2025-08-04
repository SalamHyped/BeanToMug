const express = require('express');
const { dbSingleton } = require('../dbSingleton');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const stockService = require('../services/stockService');
const router = express.Router();

/**
 * GET /inventory/stock
 * Get all ingredient stock levels with real-time data (Admin only)
 */
router.get('/stock', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const ingredients = await stockService.getCurrentStock();

    res.json({
      success: true,
      ingredients: ingredients
    });

  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

/**
 * GET /inventory/stock/:ingredientId
 * Get specific ingredient stock details (Admin only)
 */
router.get('/stock/:ingredientId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const connection = await dbSingleton.getConnection();
    
    const [ingredients] = await connection.execute(`
      SELECT 
        i.*,
        ic.name as category_name,
        s.supplier_name,
        s.contact_info
      FROM ingredient i
      LEFT JOIN ingredient_category ic ON i.type_id = ic.id
      LEFT JOIN supplier s ON i.supplier_id = s.supplier_id
      WHERE i.ingredient_id = ?
    `, [ingredientId]);

    if (ingredients.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({
      success: true,
      ingredient: ingredients[0]
    });

  } catch (error) {
    console.error('Error fetching ingredient stock:', error);
    res.status(500).json({ error: 'Failed to fetch ingredient stock' });
  }
});

/**
 * PUT /inventory/stock/:ingredientId
 * Update ingredient stock quantity (Admin only)
 */
router.put('/stock/:ingredientId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { quantity, reason } = req.body;
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const result = await stockService.updateStock(
      ingredientId, 
      quantity, 
      reason, 
      req.session.userId
    );

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

/**
 * GET /inventory/alerts
 * Get low stock ingredients
 */
router.get('/alerts', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const alerts = await stockService.getLowStockIngredients();

    res.json({
      success: true,
      alerts: alerts
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});



/**
 * GET /inventory/movements
 * Get recent order history (simplified) (Admin only)
 */
router.get('/movements', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const connection = await dbSingleton.getConnection();
    
    // Get recent orders with items for movement tracking
    const [orders] = await connection.execute(`
      SELECT 
        o.order_id,
        o.total_price,
        o.order_type,
        o.created_at,
        COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      WHERE o.status = 'completed'
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      movements: orders
    });

  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Failed to fetch movement history' });
  }
});

/**
 * POST /inventory/stock/bulk
 * Bulk update stock quantities
 */
router.post('/stock/bulk', authenticateToken, requireRole(['admin']), async (req, res) => {
  let connection;
  try {
    const { updates } = req.body; // Array of { ingredientId, quantity, reason }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    connection = await dbSingleton.getConnection();
    await connection.beginTransaction();

    const results = [];

    for (const update of updates) {
      const { ingredientId, quantity, reason } = update;

      // Get current stock
      const [currentStock] = await connection.execute(
        'SELECT quantity_in_stock, ingredient_name FROM ingredient WHERE ingredient_id = ?',
        [ingredientId]
      );

      if (currentStock.length === 0) {
        results.push({ ingredientId, success: false, error: 'Ingredient not found' });
        continue;
      }

      const previousStock = parseFloat(currentStock[0].quantity_in_stock);
      const newStock = Math.max(0, previousStock + parseFloat(quantity));

      // Update stock
      await connection.execute(
        'UPDATE ingredient SET quantity_in_stock = ? WHERE ingredient_id = ?',
        [newStock, ingredientId]
      );

      results.push({
        ingredientId,
        success: true,
        previousStock,
        newStock,
        change: quantity
      });
    }

    await connection.commit();

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').to('staff-room').emit('bulkStockUpdate', {
        updates: results,
        updatedBy: req.session.userId,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Bulk update completed',
      results: results
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error bulk updating stock:', error);
    res.status(500).json({ error: 'Failed to bulk update stock' });
  }
});

/**
 * PUT /inventory/reconcile/:ingredientId
 * Reconcile physical stock with calculated stock (Admin only)
 */
router.put('/reconcile/:ingredientId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { physicalStock, reason } = req.body;
    
    if (physicalStock === undefined || physicalStock === null) {
      return res.status(400).json({ error: 'Physical stock is required' });
    }

    const result = await stockService.reconcilePhysicalStock(
      ingredientId, 
      physicalStock, 
      reason, 
      req.session.userId
    );

    res.json({
      success: true,
      message: 'Stock reconciled successfully',
      data: result
    });

  } catch (error) {
    console.error('Error reconciling stock:', error);
    res.status(500).json({ error: 'Failed to reconcile stock' });
  }
});

/**
 * POST /inventory/reconcile/bulk
 * Bulk reconcile physical stock for multiple ingredients (Admin only)
 */
router.post('/reconcile/bulk', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { reconciliations } = req.body;
    
    if (!Array.isArray(reconciliations) || reconciliations.length === 0) {
      return res.status(400).json({ error: 'Reconciliations array is required' });
    }

    const result = await stockService.bulkReconcilePhysicalStock(reconciliations, req.session.userId);

    res.json({
      success: true,
      message: 'Bulk reconciliation completed',
      data: result
    });

  } catch (error) {
    console.error('Error bulk reconciling stock:', error);
    res.status(500).json({ error: 'Failed to bulk reconcile stock' });
  }
});

/**
 * GET /inventory/discrepancies
 * Get stock discrepancy report (Admin only)
 */
router.get('/discrepancies', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const discrepancies = await stockService.getStockDiscrepancies();

    res.json({
      success: true,
      discrepancies: discrepancies
    });

  } catch (error) {
    console.error('Error fetching discrepancies:', error);
    res.status(500).json({ error: 'Failed to fetch discrepancies' });
  }
});

module.exports = router; 