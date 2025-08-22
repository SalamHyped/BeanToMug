const { dbSingleton } = require('../dbSingleton');

/**
 * Supplier Service
 * Business logic for supplier management operations
 * 
 * This service handles complex business operations for suppliers including:
 * - Supplier statistics and analytics
 * - Bulk operations
 * - Integration with ingredient management
 * - Supplier performance tracking
 */

class SupplierService {

  /**
   * Get supplier statistics and analytics
   * @param {number|null} supplierId - Specific supplier ID or null for all
   * @returns {Object} Supplier statistics
   */
  async getSupplierStatistics(supplierId = null) {
    try {
      const connection = await dbSingleton.getConnection();
      
      let whereClause = '';
      let params = [];
      
      if (supplierId) {
        whereClause = 'WHERE s.supplier_id = ?';
        params.push(supplierId);
      }

      const [stats] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT s.supplier_id) as total_suppliers,
          COUNT(DISTINCT CASE WHEN s.status = 1 THEN s.supplier_id END) as active_suppliers,
          COUNT(DISTINCT i.ingredient_id) as total_ingredients,
          COUNT(DISTINCT CASE WHEN i.status = 1 THEN i.ingredient_id END) as active_ingredients,
          COUNT(DISTINCT CASE WHEN i.quantity_in_stock <= i.low_stock_threshold THEN i.ingredient_id END) as low_stock_ingredients,
          AVG(i.quantity_in_stock) as avg_stock_level,
          SUM(i.price * i.quantity_in_stock) as total_inventory_value
        FROM supplier s
        LEFT JOIN ingredient i ON s.supplier_id = i.supplier_id
        ${whereClause}
      `, params);

      return stats[0];
    } catch (error) {
      console.error('Error getting supplier statistics:', error);
      throw error;
    }
  }

  /**
   * Get suppliers with low stock ingredients
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Array} Suppliers with low stock items
   */
  async getSuppliersWithLowStock(threshold = 10) {
    try {
      const connection = await dbSingleton.getConnection();

      const [suppliers] = await connection.execute(`
        SELECT 
          s.supplier_id,
          s.supplier_name,
          s.phone_number,
          s.email,
          COUNT(i.ingredient_id) as low_stock_count,
          GROUP_CONCAT(
            CONCAT(i.ingredient_name, ' (', i.quantity_in_stock, ' ', i.unit, ')')
            ORDER BY i.quantity_in_stock ASC
            SEPARATOR ', '
          ) as low_stock_items
        FROM supplier s
        INNER JOIN ingredient i ON s.supplier_id = i.supplier_id
        WHERE i.quantity_in_stock <= ? AND i.status = 1 AND s.status = 1
        GROUP BY s.supplier_id
        ORDER BY low_stock_count DESC
      `, [threshold]);

      return suppliers;
    } catch (error) {
      console.error('Error getting suppliers with low stock:', error);
      throw error;
    }
  }

  /**
   * Get supplier performance metrics
   * @param {number} supplierId - Supplier ID
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Object} Performance metrics
   */
  async getSupplierPerformance(supplierId, days = 30) {
    try {
      const connection = await dbSingleton.getConnection();

      // Get order statistics
      const [orderStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          AVG(total_price) as avg_order_value,
          SUM(total_price) as total_order_value,
          AVG(DATEDIFF(order_end_date, order_start_date)) as avg_delivery_days
        FROM product_order 
        WHERE supplier_id = ? 
          AND order_start_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [supplierId, days]);

      // Get ingredient reliability (how often ingredients are in stock)
      const [stockStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_ingredients,
          COUNT(CASE WHEN quantity_in_stock > low_stock_threshold THEN 1 END) as well_stocked,
          COUNT(CASE WHEN quantity_in_stock = 0 THEN 1 END) as out_of_stock,
          AVG(quantity_in_stock) as avg_stock_level
        FROM ingredient 
        WHERE supplier_id = ? AND status = 1
      `, [supplierId]);

      return {
        orders: orderStats[0],
        stock: stockStats[0],
        performance_score: this.calculatePerformanceScore(orderStats[0], stockStats[0])
      };
    } catch (error) {
      console.error('Error getting supplier performance:', error);
      throw error;
    }
  }

  /**
   * Calculate supplier performance score (0-100)
   * @param {Object} orderStats - Order statistics
   * @param {Object} stockStats - Stock statistics
   * @returns {number} Performance score
   */
  calculatePerformanceScore(orderStats, stockStats) {
    try {
      let score = 0;

      // Order completion rate (40% of score)
      if (orderStats.total_orders > 0) {
        const completionRate = orderStats.completed_orders / orderStats.total_orders;
        score += completionRate * 40;
      }

      // Stock reliability (40% of score)
      if (stockStats.total_ingredients > 0) {
        const stockReliability = stockStats.well_stocked / stockStats.total_ingredients;
        score += stockReliability * 40;
      }

      // Delivery speed bonus (20% of score)
      if (orderStats.avg_delivery_days) {
        // Faster delivery = higher score (assuming 1-7 days is excellent, 8-14 is good, 15+ is poor)
        if (orderStats.avg_delivery_days <= 7) {
          score += 20;
        } else if (orderStats.avg_delivery_days <= 14) {
          score += 10;
        }
      }

      return Math.round(Math.min(100, Math.max(0, score)));
    } catch (error) {
      console.error('Error calculating performance score:', error);
      return 0;
    }
  }

  /**
   * Update supplier status and cascade to ingredients
   * @param {number} supplierId - Supplier ID
   * @param {boolean} status - New status
   * @param {boolean} updateIngredients - Whether to update ingredient status too
   * @returns {Object} Update result
   */
  async updateSupplierStatus(supplierId, status, updateIngredients = false) {
    const connection = await dbSingleton.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update supplier status
      await connection.execute(
        'UPDATE supplier SET status = ?, updated_at = NOW() WHERE supplier_id = ?',
        [status, supplierId]
      );

      let affectedIngredients = 0;

      // Optionally update all ingredients from this supplier
      if (updateIngredients) {
        const [result] = await connection.execute(
          'UPDATE ingredient SET status = ? WHERE supplier_id = ?',
          [status, supplierId]
        );
        affectedIngredients = result.affectedRows;
      }

      await connection.commit();

      return {
        success: true,
        supplier_updated: true,
        ingredients_updated: affectedIngredients,
        new_status: status
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  /**
   * Get suggested reorder list for a supplier
   * @param {number} supplierId - Supplier ID
   * @returns {Array} Ingredients that need reordering
   */
  async getReorderSuggestions(supplierId) {
    try {
      const connection = await dbSingleton.getConnection();

      const [suggestions] = await connection.execute(`
        SELECT 
          i.ingredient_id,
          i.ingredient_name,
          i.quantity_in_stock,
          i.low_stock_threshold,
          i.unit,
          i.price,
          (i.low_stock_threshold - i.quantity_in_stock) as shortage,
          (i.low_stock_threshold * 2) as suggested_order_quantity,
          ((i.low_stock_threshold * 2) * i.price) as estimated_cost
        FROM ingredient i
        WHERE i.supplier_id = ? 
          AND i.status = 1 
          AND i.quantity_in_stock <= i.low_stock_threshold
        ORDER BY (i.low_stock_threshold - i.quantity_in_stock) DESC
      `, [supplierId]);

      return suggestions.map(item => ({
        ...item,
        priority: this.calculateReorderPriority(item)
      }));

    } catch (error) {
      console.error('Error getting reorder suggestions:', error);
      throw error;
    }
  }

  /**
   * Calculate reorder priority (high, medium, low)
   * @param {Object} ingredient - Ingredient data
   * @returns {string} Priority level
   */
  calculateReorderPriority(ingredient) {
    const stockRatio = ingredient.quantity_in_stock / ingredient.low_stock_threshold;
    
    if (stockRatio <= 0) return 'critical';
    if (stockRatio <= 0.25) return 'high';
    if (stockRatio <= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Bulk update supplier information
   * @param {Array} updates - Array of supplier updates
   * @returns {Object} Bulk update result
   */
  async bulkUpdateSuppliers(updates) {
    const connection = await dbSingleton.getConnection();
    
    try {
      await connection.beginTransaction();

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const update of updates) {
        try {
          const { supplier_id, ...updateData } = update;
          
          // Build dynamic update query
          const fields = Object.keys(updateData);
          const setClause = fields.map(field => `${field} = ?`).join(', ');
          const values = [...Object.values(updateData), supplier_id];

          await connection.execute(
            `UPDATE supplier SET ${setClause}, updated_at = NOW() WHERE supplier_id = ?`,
            values
          );

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            supplier_id: update.supplier_id,
            error: error.message
          });
        }
      }

      await connection.commit();

      return {
        success: true,
        updated: successCount,
        failed: errorCount,
        errors: errors
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
}

module.exports = new SupplierService();
