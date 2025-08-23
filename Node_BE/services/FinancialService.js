const { dbSingleton } = require('../dbSingleton');
const databaseConfig = require('../utils/databaseConfig');

/**
 * Financial Service - Handles all financial KPI calculations and business configuration
 * Provides a clean interface for financial operations with proper error handling
 */
class FinancialService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Get comprehensive financial KPIs for admin dashboard
   * @param {number} userId - Admin user ID for audit trails
   * @returns {Object} Complete financial KPI data
   */
  async getFinancialKPIs(userId) {
    try {
      const connection = await dbSingleton.getConnection();
      
      // Calculate date ranges
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // Fetch all revenue data in parallel
      const [
        todayRevenue,
        yesterdayRevenue,
        weeklyRevenue,
        lastWeekRevenue,
        todayAOV,
        yesterdayAOV,
        targets
      ] = await Promise.all([
        this._getRevenue(connection, todayStart, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)),
        this._getRevenue(connection, yesterdayStart, todayStart),
        this._getRevenue(connection, weekStart, new Date()),
        this._getRevenue(connection, lastWeekStart, weekStart),
        this._getAOV(connection, todayStart, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)),
        this._getAOV(connection, yesterdayStart, todayStart),
        this._getTargets()
      ]);

      // Calculate profit margins using real data
      const todayMarginData = await this._getProfitMargin(
        connection, todayStart, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      );
      const yesterdayMarginData = await this._getProfitMargin(
        connection, yesterdayStart, todayStart
      );

      // Calculate profits
      const todayProfit = todayRevenue * todayMarginData.margin;
      const yesterdayProfit = yesterdayRevenue * yesterdayMarginData.margin;

      // Calculate percentage changes
      const changes = this._calculateChanges({
        todayRevenue, yesterdayRevenue,
        weeklyRevenue, lastWeekRevenue,
        todayAOV: todayAOV.value, yesterdayAOV: yesterdayAOV.value,
        todayProfit, yesterdayProfit
      });

      // Build response
      return {
        revenue: {
          today: {
            value: todayRevenue,
            formatted: this._formatCurrency(todayRevenue),
            percentage: Math.round((todayRevenue / targets.dailyRevenue) * 100),
            change: changes.revenueChange,
            target: this._formatCurrency(targets.dailyRevenue)
          },
          weekly: {
            value: weeklyRevenue,
            formatted: this._formatCurrency(weeklyRevenue),
            percentage: Math.round((weeklyRevenue / targets.weeklyRevenue) * 100),
            change: changes.weeklyChange,
            target: this._formatCurrency(targets.weeklyRevenue)
          }
        },
        aov: {
          value: todayAOV.value,
          formatted: this._formatCurrency(todayAOV.value),
          percentage: Math.round((todayAOV.value / targets.aov) * 100),
          change: this._formatCurrency(Math.abs(todayAOV.value - yesterdayAOV.value)),
          changeDirection: todayAOV.value >= yesterdayAOV.value ? 'up' : 'down',
          target: this._formatCurrency(targets.aov),
          orderCount: todayAOV.count
        },
        profit: {
          value: todayProfit,
          formatted: this._formatCurrency(todayProfit),
          margin: todayMarginData.margin,
          marginFormatted: `${(todayMarginData.margin * 100).toFixed(1)}%`,
          change: changes.profitChange,
          source: todayMarginData.source,
          details: todayMarginData.details
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          userId,
          dataQuality: this._assessDataQuality(todayAOV.count, todayMarginData.source)
        }
      };

    } catch (error) {
      console.error('FinancialService.getFinancialKPIs error:', error);
      throw new Error(`Failed to calculate financial KPIs: ${error.message}`);
    }
  }

  /**
   * Update business configuration with validation
   * @param {string} key - Configuration key
   * @param {any} value - New value
   * @param {number} userId - User making the change
   * @returns {Object} Update result
   */
  async updateConfiguration(key, value, userId) {
    try {
      // Validate user permissions (admin only)
      await this._validateAdminUser(userId);
      
      // Update configuration
      const result = await databaseConfig.set(key, value, userId);
      
      // Clear cache
      this._clearCache();
      
      // Log configuration change
      console.log(`Configuration updated by user ${userId}: ${key} = ${value}`);
      
      return {
        success: true,
        key,
        oldValue: result.oldValue,
        newValue: result.newValue,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('FinancialService.updateConfiguration error:', error);
      throw new Error(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * Get all business configuration organized by category
   * @param {number} userId - Admin user ID
   * @returns {Object} Configuration data by category
   */
  async getConfiguration(userId) {
    try {
      await this._validateAdminUser(userId);
      
      const [financial, targets, costs, system] = await Promise.all([
        databaseConfig.getByCategory('financial'),
        databaseConfig.getByCategory('targets'), 
        databaseConfig.getByCategory('costs'),
        databaseConfig.getByCategory('system')
      ]);
      
      return {
        financial,
        targets,
        costs,
        system,
        metadata: {
          lastAccessed: new Date().toISOString(),
          userId
        }
      };

    } catch (error) {
      console.error('FinancialService.getConfiguration error:', error);
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }
  }

  // Private helper methods
  async _getRevenue(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE created_at >= ? AND created_at < ? AND status = 'completed'
    `, [startDate, endDate]);
    
    return parseFloat(result[0].revenue);
  }

  async _getAOV(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        COALESCE(AVG(total_amount), 0) as aov,
        COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= ? AND created_at < ? AND status = 'completed'
    `, [startDate, endDate]);
    
    return {
      value: parseFloat(result[0].aov),
      count: parseInt(result[0].order_count)
    };
  }

  async _getProfitMargin(connection, startDate, endDate) {
    try {
      // Try to calculate real profit margin from order data
      if (await databaseConfig.shouldUseRealCosts()) {
        const realMargin = await this._calculateRealProfitMargin(connection, startDate, endDate);
        if (realMargin.orderCount >= 5 && realMargin.margin > 0) {
          return {
            margin: realMargin.margin,
            source: 'calculated',
            details: realMargin
          };
        }
      }
      
      // Fallback to configured margin
      const configuredMargin = await databaseConfig.getProfitMargin('default');
      return {
        margin: configuredMargin,
        source: 'configured',
        details: null
      };

    } catch (error) {
      console.error('Error calculating profit margin:', error);
      const fallbackMargin = await databaseConfig.getProfitMargin('fallback');
      return {
        margin: fallbackMargin,
        source: 'fallback',
        details: { error: error.message }
      };
    }
  }

  async _calculateRealProfitMargin(connection, startDate, endDate) {
    const [profitData] = await connection.execute(`
      SELECT 
        COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
        COALESCE(SUM(CASE 
          WHEN ing.price IS NOT NULL 
          THEN ing.price * oi.quantity 
          ELSE 0 
        END), 0) as ingredient_costs,
        COUNT(DISTINCT o.order_id) as order_count
      FROM orders o
      JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
      LEFT JOIN ingredient ing ON oii.ingredient_id = ing.ingredient_id
      WHERE o.status = 'completed' 
        AND o.is_cart = 0
        AND o.created_at >= ? 
        AND o.created_at < ?
    `, [startDate, endDate]);

    const data = profitData[0];
    const revenue = parseFloat(data.total_revenue);
    const ingredientCosts = parseFloat(data.ingredient_costs);
    const orderCount = parseInt(data.order_count);

    if (revenue === 0) {
      return { margin: 0, orderCount: 0 };
    }

    // Calculate total costs including labor and overhead
    const laborCosts = revenue * (await databaseConfig.get('labor_cost_ratio') || 0.30);
    const overheadCosts = revenue * (await databaseConfig.get('overhead_cost_ratio') || 0.15);
    const totalCosts = ingredientCosts + laborCosts + overheadCosts;
    
    const netProfit = revenue - totalCosts;
    const margin = netProfit / revenue;

    return {
      margin: Math.max(0, margin), // Ensure non-negative
      orderCount,
      revenue,
      costs: { ingredients: ingredientCosts, labor: laborCosts, overhead: overheadCosts, total: totalCosts },
      profit: netProfit
    };
  }

  async _getTargets() {
    return {
      dailyRevenue: await databaseConfig.getTarget('daily_revenue') || 3000,
      weeklyRevenue: await databaseConfig.getTarget('weekly_revenue') || 18000,
      aov: await databaseConfig.getTarget('aov') || 15
    };
  }

  _calculateChanges(data) {
    const { todayRevenue, yesterdayRevenue, weeklyRevenue, lastWeekRevenue, 
            todayAOV, yesterdayAOV, todayProfit, yesterdayProfit } = data;

    return {
      revenueChange: this._formatPercentageChange(todayRevenue, yesterdayRevenue),
      weeklyChange: this._formatPercentageChange(weeklyRevenue, lastWeekRevenue),
      aovChange: this._formatPercentageChange(todayAOV, yesterdayAOV),
      profitChange: this._formatPercentageChange(todayProfit, yesterdayProfit)
    };
  }

  _formatPercentageChange(current, previous) {
    if (previous === 0) return '+0.0%';
    const change = ((current - previous) / previous * 100);
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  _formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  _assessDataQuality(orderCount, profitSource) {
    if (orderCount >= 10 && profitSource === 'calculated') return 'high';
    if (orderCount >= 5 || profitSource === 'configured') return 'medium';
    return 'low';
  }

  async _validateAdminUser(userId) {
    const connection = await dbSingleton.getConnection();
    const [user] = await connection.execute(
      'SELECT role FROM users WHERE id = ?', [userId]
    );
    
    if (!user.length || user[0].role !== 'admin') {
      throw new Error('Insufficient permissions: Admin access required');
    }
  }

  _clearCache() {
    this.cache.clear();
  }
}

module.exports = new FinancialService();
