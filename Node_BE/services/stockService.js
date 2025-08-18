const { dbSingleton } = require('../dbSingleton');

/**
 * Stock Service (Simplified Version)
 * Handles automatic stock deduction when orders are completed
 * 
 * This service automatically reduces ingredient stock levels based on:
 * - Items ordered and their quantities
 * - Ingredients required for each item
 * - Customizations/additions selected
 * 
 * Features:
 * - Automatic stock deduction on order completion
 * - Low stock threshold checking
 * - Real-time stock updates via WebSocket
 * - Uses existing ingredient table only
 */

class StockService {
  
  /**
   * Deduct stock for a completed order (Simplified Version)
   * 
   * @param {number} orderId - The completed order ID
   * @returns {Object} Stock deduction results
   */
  async deductStockForOrder(orderId) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      // Get all items in the order with their ingredients (only physical ingredients)
      const [orderItems] = await connection.execute(`
        SELECT 
          oi.order_item_id,
          oi.item_id,
          oi.quantity as item_quantity,
          d.item_name,
          oii.ingredient_id,
          iii.quantity_required,
          i.ingredient_name,
          i.quantity_in_stock,
          i.low_stock_threshold,
          i.unit,
          it.is_physical
        FROM order_item oi
        JOIN dish d ON oi.item_id = d.item_id
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        LEFT JOIN ingredient i ON oii.ingredient_id = i.ingredient_id
        LEFT JOIN ingredients_in_item iii ON i.ingredient_id = iii.ingredient_id AND d.item_id = iii.item_id
        LEFT JOIN ingredient_type it ON i.type_id = it.id
        WHERE oi.order_id = ? AND (it.is_physical = 1 OR it.is_physical IS NULL)
      `, [orderId]);

      if (orderItems.length === 0) {
        throw new Error('No items found for order');
      }

      // Group by ingredient and calculate total deductions (memory efficient)
      const ingredientDeductions = new Map();
      const ingredientData = new Map();

      // Get selected options for effects calculation
      const [selectedOptions] = await connection.execute(`
        SELECT 
          oi.order_item_id,
          oi.item_id,
          oii.ingredient_id as option_id
        FROM order_item oi
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        LEFT JOIN ingredient i ON oii.ingredient_id = i.ingredient_id
        LEFT JOIN ingredient_type it ON i.type_id = it.id
        WHERE oi.order_id = ? AND it.is_physical = 0
      `, [orderId]);

      // Get ingredient effects
      const selectedOptionIds = [...new Set(selectedOptions.map(opt => opt.option_id).filter(Boolean))];
      const [effects] = selectedOptionIds.length > 0 ? await connection.execute(`
        SELECT 
          ie.target_ingredient_id,
          ie.multiplier,
          ie.item_id
        FROM ingredient_effects ie
        WHERE ie.option_ingredient_id IN (${selectedOptionIds.map(() => '?').join(',')})
      `, selectedOptionIds) : [[], []];

      for (const item of orderItems) {
        if (item.ingredient_id) {
          const key = item.ingredient_id;
          const currentDeduction = ingredientDeductions.get(key) || 0;
          
          // Calculate base deduction
          let deduction = parseFloat(item.quantity_required || 0) * item.item_quantity;
          
          // Apply ingredient effects if any
          const applicableEffects = effects.filter(effect => 
            effect.target_ingredient_id === item.ingredient_id && 
            effect.item_id === item.item_id
          );
          
          // Multiply by effects (multiple effects are multiplicative)
          for (const effect of applicableEffects) {
            deduction *= parseFloat(effect.multiplier);
          }
          
          ingredientDeductions.set(key, currentDeduction + deduction);
          
          // Store ingredient data once
          if (!ingredientData.has(key)) {
            ingredientData.set(key, {
              ingredient_name: item.ingredient_name,
              quantity_in_stock: parseFloat(item.quantity_in_stock),
              low_stock_threshold: parseFloat(item.low_stock_threshold),
              unit: item.unit
            });
          }
        }
      }

      // Prepare bulk operations
      const stockUpdates = [];
      const stockDeductions = [];
      const alerts = [];

      // Process each ingredient deduction
      for (const [ingredientId, totalDeduction] of ingredientDeductions) {
        const ingredient = ingredientData.get(ingredientId);
        if (!ingredient) continue;

        const previousStock = ingredient.quantity_in_stock;
        const newStock = Math.max(0, previousStock - totalDeduction);

        // Prepare stock update
        stockUpdates.push([newStock, ingredientId]);

        stockDeductions.push({
          ingredientId,
          ingredientName: ingredient.ingredient_name,
          previousStock,
          newStock,
          deduction: totalDeduction,
          unit: ingredient.unit
        });

        // Check for low stock alerts
        const threshold = ingredient.low_stock_threshold;
        if (newStock <= threshold) {
          let alertType = 'low_stock';
          let alertMessage = `${ingredient.ingredient_name} is running low (${newStock} ${ingredient.unit} remaining)`;
          
          if (newStock <= 0) {
            alertType = 'out_of_stock';
            alertMessage = `${ingredient.ingredient_name} is out of stock`;
          }

          alerts.push({
            ingredientId,
            ingredientName: ingredient.ingredient_name,
            alertType,
            message: alertMessage
          });
        }
      }

      // Bulk update stock levels (single query)
      if (stockUpdates.length > 0) {
        const updateQuery = `
          UPDATE ingredient 
          SET quantity_in_stock = CASE ingredient_id 
            ${stockUpdates.map(([stock, id]) => `WHEN ${id} THEN ${stock}`).join(' ')}
            ELSE quantity_in_stock 
          END 
          WHERE ingredient_id IN (${stockUpdates.map(([, id]) => id).join(',')})
        `;
        await connection.execute(updateQuery);
      }

      await connection.commit();

      // Batch emit real-time updates (reduced WebSocket calls)
      const socketService = require('./socketService');
      
      // Emit bulk stock updates
      if (stockDeductions.length > 0) {
        socketService.io.to('admin-room').to('staff-room').emit('bulkStockUpdate', {
          orderId,
          deductions: stockDeductions,
          timestamp: new Date()
        });
      }

      // Emit alerts in batch
      if (alerts.length > 0) {
        socketService.io.to('admin-room').to('staff-room').emit('bulkStockAlert', {
          orderId,
          alerts,
          timestamp: new Date()
        });
      }

      return {
        success: true,
        orderId,
        stockDeductions,
        alerts,
        message: `Stock deducted for order #${orderId}`
      };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error deducting stock for order:', error);
      throw error;
    }
  }

  /**
   * Restore stock for a cancelled order
   * 
   * This function restores the stock that was deducted when the order was completed.
   * It should be called when an order is cancelled after being completed.
   * 
   * @param {number} orderId - The cancelled order ID
   * @returns {Object} Stock restoration results
   */
  async restoreStockForCancelledOrder(orderId) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      // Get all items in the order with their ingredients (only physical ingredients)
      const [orderItems] = await connection.execute(`
        SELECT 
          oi.order_item_id,
          oi.item_id,
          oi.quantity as item_quantity,
          d.item_name,
          oii.ingredient_id,
          iii.quantity_required,
          i.ingredient_name,
          i.quantity_in_stock,
          i.low_stock_threshold,
          i.unit,
          it.is_physical
        FROM order_item oi
        JOIN dish d ON oi.item_id = d.item_id
        LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
        LEFT JOIN ingredient i ON oii.ingredient_id = i.ingredient_id
        LEFT JOIN ingredients_in_item iii ON i.ingredient_id = iii.ingredient_id AND d.item_id = iii.item_id
        LEFT JOIN ingredient_type it ON i.type_id = it.id
        WHERE oi.order_id = ? AND (it.is_physical = 1 OR it.is_physical IS NULL)
      `, [orderId]);

      if (orderItems.length === 0) {
        throw new Error('No items found for order');
      }

      // Group by ingredient and calculate total restoration (same logic as deduction)
      const ingredientRestorations = new Map();
      const ingredientData = new Map();

      for (const item of orderItems) {
        if (item.ingredient_id) {
          const key = item.ingredient_id;
          const currentRestoration = ingredientRestorations.get(key) || 0;
          const restoration = parseFloat(item.quantity_required || 0) * item.item_quantity;
          ingredientRestorations.set(key, currentRestoration + restoration);
          
          // Store ingredient data once
          if (!ingredientData.has(key)) {
            ingredientData.set(key, {
              ingredient_name: item.ingredient_name,
              quantity_in_stock: parseFloat(item.quantity_in_stock),
              low_stock_threshold: parseFloat(item.low_stock_threshold),
              unit: item.unit
            });
          }
        }
      }

      // Prepare bulk operations
      const stockUpdates = [];
      const stockRestorations = [];
      const alerts = [];

      // Process each ingredient restoration
      for (const [ingredientId, totalRestoration] of ingredientRestorations) {
        const ingredient = ingredientData.get(ingredientId);
        if (!ingredient) continue;

        const previousStock = ingredient.quantity_in_stock;
        const newStock = previousStock + totalRestoration;

        // Prepare stock update
        stockUpdates.push([newStock, ingredientId]);

        stockRestorations.push({
          ingredientId,
          ingredientName: ingredient.ingredient_name,
          previousStock,
          newStock,
          restoration: totalRestoration,
          unit: ingredient.unit
        });

        // Check for alerts (restoration might resolve low stock)
        const threshold = ingredient.low_stock_threshold;
        if (previousStock <= threshold && newStock > threshold) {
          alerts.push({
            ingredientId,
            ingredientName: ingredient.ingredient_name,
            alertType: 'stock_restored',
            message: `${ingredient.ingredient_name} stock restored above threshold (${newStock} ${ingredient.unit})`
          });
        }
      }

      // Bulk update stock levels (single query)
      if (stockUpdates.length > 0) {
        const updateQuery = `
          UPDATE ingredient 
          SET quantity_in_stock = CASE ingredient_id 
            ${stockUpdates.map(([stock, id]) => `WHEN ${id} THEN ${stock}`).join(' ')}
            ELSE quantity_in_stock 
          END 
          WHERE ingredient_id IN (${stockUpdates.map(([, id]) => id).join(',')})
        `;
        await connection.execute(updateQuery);
      }

      await connection.commit();

      // Batch emit real-time updates
      const socketService = require('./socketService');
      
      // Emit bulk stock updates
      if (stockRestorations.length > 0) {
        await socketService.emitStockUpdate({
          type: 'bulk_restoration',
          orderId,
          updates: stockRestorations
        });
      }

      // Emit alerts if any
      if (alerts.length > 0) {
        await socketService.emitStockAlert({
          type: 'bulk_restoration_alerts',
          alerts
        });
      }

      return {
        success: true,
        orderId,
        restoredIngredients: stockRestorations,
        alerts
      };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error restoring stock for cancelled order:', error);
      throw error;
    }
  }

  /**
   * Get current stock levels for all ingredients
   * 
   * @returns {Array} Array of ingredients with stock information
   */
  async getCurrentStock() {
    try {
      const connection = await dbSingleton.getConnection();
      
      const [ingredients] = await connection.execute(`
        SELECT 
          i.ingredient_id,
          i.ingredient_name,
          i.price,
          i.brand,
          i.status,
          i.expiration,
          i.unit,
          i.quantity_in_stock,
          i.low_stock_threshold,
          i.type_id,
          it.is_physical,
          ic.name as category_name,
          s.supplier_name,
          CASE 
            WHEN i.quantity_in_stock <= i.low_stock_threshold THEN 'low_stock'
            WHEN i.quantity_in_stock = 0 THEN 'out_of_stock'
            WHEN i.quantity_in_stock > i.low_stock_threshold * 2 THEN 'overstock'
            ELSE 'normal'
          END as stock_status
        FROM ingredient i
        LEFT JOIN ingredient_type it ON i.type_id = it.id
        LEFT JOIN ingredient_category ic ON i.type_id = ic.id
        LEFT JOIN supplier s ON i.supplier_id = s.supplier_id
        ORDER BY i.ingredient_name
      `);

      return ingredients;

    } catch (error) {
      console.error('Error fetching current stock:', error);
      throw error;
    }
  }

  /**
   * Manually update stock for an ingredient
   * 
   * @param {number} ingredientId - Ingredient ID
   * @param {number} quantity - Quantity to add/subtract
   * @param {string} reason - Reason for update
   * @param {number} userId - User ID making the update
   * @returns {Object} Update result
   */
  async updateStock(ingredientId, quantity, reason, userId = null) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      // Get current stock
      const [currentStock] = await connection.execute(
        'SELECT quantity_in_stock, ingredient_name, low_stock_threshold, unit FROM ingredient WHERE ingredient_id = ?',
        [ingredientId]
      );

      if (currentStock.length === 0) {
        throw new Error('Ingredient not found');
      }

      const previousStock = parseFloat(currentStock[0].quantity_in_stock);
      const newStock = Math.max(0, previousStock + parseFloat(quantity));

      // Update stock
      await connection.execute(
        'UPDATE ingredient SET quantity_in_stock = ? WHERE ingredient_id = ?',
        [newStock, ingredientId]
      );

      // Check for alerts
      const threshold = parseFloat(currentStock[0].low_stock_threshold);
      let alertType = null;
      let alertMessage = null;

      if (newStock <= 0) {
        alertType = 'out_of_stock';
        alertMessage = `${currentStock[0].ingredient_name} is out of stock`;
      } else if (newStock <= threshold) {
        alertType = 'low_stock';
        alertMessage = `${currentStock[0].ingredient_name} is running low (${newStock} ${currentStock[0].unit} remaining)`;
      }

      await connection.commit();

      // Emit real-time update
      const socketService = require('./socketService');
      socketService.io.to('admin-room').to('staff-room').emit('stockUpdate', {
        ingredientId: parseInt(ingredientId),
        ingredientName: currentStock[0].ingredient_name,
        previousStock,
        newStock,
        updatedBy: userId,
        timestamp: new Date()
      });

      if (alertType) {
        socketService.io.to('admin-room').to('staff-room').emit('stockAlert', {
          ingredientId: parseInt(ingredientId),
          alertType,
          message: alertMessage,
          timestamp: new Date()
        });
      }

      return {
        success: true,
        ingredientId: parseInt(ingredientId),
        ingredientName: currentStock[0].ingredient_name,
        previousStock,
        newStock,
        change: quantity
      };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Get low stock ingredients
   * 
   * @returns {Array} Array of ingredients with low stock
   */
  async getLowStockIngredients() {
    try {
      const connection = await dbSingleton.getConnection();
      
      const [ingredients] = await connection.execute(`
        SELECT 
          i.ingredient_id,
          i.ingredient_name,
          i.quantity_in_stock,
          i.low_stock_threshold,
          i.unit,
          CASE 
            WHEN i.quantity_in_stock = 0 THEN 'out_of_stock'
            ELSE 'low_stock'
          END as alert_type,
          CONCAT(
            i.ingredient_name, 
            CASE 
              WHEN i.quantity_in_stock = 0 THEN ' is out of stock'
              ELSE CONCAT(' is running low (', i.quantity_in_stock, ' ', i.unit, ' remaining)')
            END
          ) as message
        FROM ingredient i
        WHERE i.quantity_in_stock <= i.low_stock_threshold
        ORDER BY i.quantity_in_stock ASC
      `);

      return ingredients;

    } catch (error) {
      console.error('Error fetching low stock ingredients:', error);
      throw error;
    }
  }

  /**
   * Reconcile physical stock with calculated stock
   * 
   * @param {number} ingredientId - Ingredient ID
   * @param {number} physicalStock - Actual physical stock count
   * @param {string} reason - Reason for reconciliation
   * @param {number} userId - User ID making the reconciliation
   * @returns {Object} Reconciliation result
   */
  async reconcilePhysicalStock(ingredientId, physicalStock, reason, userId = null) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      // Get current calculated stock
      const [currentStock] = await connection.execute(
        'SELECT quantity_in_stock, ingredient_name, low_stock_threshold, unit FROM ingredient WHERE ingredient_id = ?',
        [ingredientId]
      );

      if (currentStock.length === 0) {
        throw new Error('Ingredient not found');
      }

      const calculatedStock = parseFloat(currentStock[0].quantity_in_stock);
      const physicalStockValue = parseFloat(physicalStock);
      const difference = physicalStockValue - calculatedStock;

      // Update to physical stock
      await connection.execute(
        'UPDATE ingredient SET quantity_in_stock = ? WHERE ingredient_id = ?',
        [physicalStockValue, ingredientId]
      );

      // Check for alerts
      const threshold = parseFloat(currentStock[0].low_stock_threshold);
      let alertType = null;
      let alertMessage = null;

      if (physicalStockValue <= 0) {
        alertType = 'out_of_stock';
        alertMessage = `${currentStock[0].ingredient_name} is out of stock`;
      } else if (physicalStockValue <= threshold) {
        alertType = 'low_stock';
        alertMessage = `${currentStock[0].ingredient_name} is running low (${physicalStockValue} ${currentStock[0].unit} remaining)`;
      }

      await connection.commit();

      // Emit real-time update
      const socketService = require('./socketService');
      socketService.io.to('admin-room').to('staff-room').emit('stockReconciliation', {
        ingredientId: parseInt(ingredientId),
        ingredientName: currentStock[0].ingredient_name,
        calculatedStock,
        physicalStock: physicalStockValue,
        difference,
        reason,
        updatedBy: userId,
        timestamp: new Date()
      });

      if (alertType) {
        socketService.io.to('admin-room').to('staff-room').emit('stockAlert', {
          ingredientId: parseInt(ingredientId),
          alertType,
          message: alertMessage,
          timestamp: new Date()
        });
      }

      return {
        success: true,
        ingredientId: parseInt(ingredientId),
        ingredientName: currentStock[0].ingredient_name,
        calculatedStock,
        physicalStock: physicalStockValue,
        difference,
        reason
      };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error reconciling physical stock:', error);
      throw error;
    }
  }

  /**
   * Get stock discrepancy report
   * 
   * @returns {Array} Array of ingredients with stock discrepancies
   */
  async getStockDiscrepancies() {
    try {
      const connection = await dbSingleton.getConnection();
      
      // This would typically compare calculated vs physical stock
      // For now, we'll show ingredients that might need reconciliation
      const [ingredients] = await connection.execute(`
        SELECT 
          i.ingredient_id,
          i.ingredient_name,
          i.quantity_in_stock as calculated_stock,
          i.low_stock_threshold,
          i.unit,
          CASE 
            WHEN i.quantity_in_stock <= i.low_stock_threshold THEN 'needs_reconciliation'
            WHEN i.quantity_in_stock = 0 THEN 'out_of_stock'
            ELSE 'normal'
          END as status
        FROM ingredient i
        WHERE i.quantity_in_stock <= i.low_stock_threshold
        ORDER BY i.quantity_in_stock ASC
      `);

      return ingredients;

    } catch (error) {
      console.error('Error fetching stock discrepancies:', error);
      throw error;
    }
  }

  /**
   * Bulk reconcile physical stock for multiple ingredients
   * 
   * @param {Array} reconciliations - Array of {ingredientId, physicalStock, reason}
   * @param {number} userId - User ID making the reconciliation
   * @returns {Object} Bulk reconciliation result
   */
  async bulkReconcilePhysicalStock(reconciliations, userId = null) {
    let connection;
    
    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      const results = [];
      const updates = [];

      for (const reconciliation of reconciliations) {
        const { ingredientId, physicalStock, reason } = reconciliation;
        
        // Get current calculated stock
        const [currentStock] = await connection.execute(
          'SELECT quantity_in_stock, ingredient_name, low_stock_threshold, unit FROM ingredient WHERE ingredient_id = ?',
          [ingredientId]
        );

        if (currentStock.length === 0) continue;

        const calculatedStock = parseFloat(currentStock[0].quantity_in_stock);
        const physicalStockValue = parseFloat(physicalStock);
        const difference = physicalStockValue - calculatedStock;

        // Prepare bulk update
        updates.push([physicalStockValue, ingredientId]);

        results.push({
          ingredientId: parseInt(ingredientId),
          ingredientName: currentStock[0].ingredient_name,
          calculatedStock,
          physicalStock: physicalStockValue,
          difference,
          reason
        });
      }

      // Bulk update stock levels
      if (updates.length > 0) {
        const updateQuery = `
          UPDATE ingredient 
          SET quantity_in_stock = CASE ingredient_id 
            ${updates.map(([stock, id]) => `WHEN ${id} THEN ${stock}`).join(' ')}
            ELSE quantity_in_stock 
          END 
          WHERE ingredient_id IN (${updates.map(([, id]) => id).join(',')})
        `;
        await connection.execute(updateQuery);
      }

      await connection.commit();

      // Emit bulk reconciliation update
      const socketService = require('./socketService');
      socketService.io.to('admin-room').to('staff-room').emit('bulkStockReconciliation', {
        reconciliations: results,
        updatedBy: userId,
        timestamp: new Date()
      });

      return {
        success: true,
        reconciliations: results,
        message: `Reconciled ${results.length} ingredients`
      };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error bulk reconciling physical stock:', error);
      throw error;
    }
  }
}

module.exports = new StockService(); 