const { dbSingleton } = require('../dbSingleton');
const databaseConfig = require('../utils/databaseConfig');
const orderAnalyticsService = require('./OrderAnalyticsService');

/**
 * Financial Service - Handles all financial KPI calculations and business configuration
 * Provides a clean interface for financial operations with proper error handling
 */
class FinancialService {
  constructor() {
    this.cache = new Map();
    this.queryCache = new Map(); // Cache for individual queries
    
    // These will be set from database config
    this.cacheTimeout = 30000; // Default 30 seconds
    this.queryCacheTimeout = 10000; // Default 10 seconds
    
    // Initialize cache timeouts from config (will be called when first method is invoked)
    this._initialized = false;
  }

  async _ensureInitialized() {
    if (!this._initialized) {
      await this._initializeCacheTimeouts();
      this._initialized = true;
    }
  }

  async _initializeCacheTimeouts() {
    try {
      this.cacheTimeout = (await databaseConfig.get('cache_timeout') || 30) * 1000; // Convert to milliseconds
      this.queryCacheTimeout = (await databaseConfig.get('query_cache_timeout') || 10) * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to initialize cache timeouts, using defaults:', error.message);
    }
  }

  /**
   * Get comprehensive financial KPIs for admin dashboard
   * @param {number} userId - Admin user ID for audit trails
   * @returns {Object} Complete financial KPI data
   */
  async getFinancialKPIs(userId) {
    try {
      // Ensure cache timeouts are initialized
      await this._ensureInitialized();
      
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
        targets,
        onlineOrdersData
      ] = await Promise.all([
        this._getRevenue(connection, todayStart, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)),
        this._getRevenue(connection, yesterdayStart, todayStart),
        this._getRevenue(connection, weekStart, new Date()),
        this._getRevenue(connection, lastWeekStart, weekStart),
        this._getAOV(connection, todayStart, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)),
        this._getAOV(connection, yesterdayStart, todayStart),
        this._getTargets(),
        orderAnalyticsService.getOnlineOrdersPercentage(todayStart, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000))
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
            formatted: await this._formatCurrency(todayRevenue),
            percentage: Math.round((todayRevenue / targets.dailyRevenue) * 100),
            change: changes.revenueChange,
            target: await this._formatCurrency(targets.dailyRevenue)
          },
          weekly: {
            value: weeklyRevenue,
            formatted: await this._formatCurrency(weeklyRevenue),
            percentage: Math.round((weeklyRevenue / targets.weeklyRevenue) * 100),
            change: changes.weeklyChange,
            target: await this._formatCurrency(targets.weeklyRevenue)
          }
        },
        aov: {
          value: todayAOV.value,
          formatted: await this._formatCurrency(todayAOV.value),
          percentage: Math.round((todayAOV.value / targets.aov) * 100),
          change: await this._formatCurrency(Math.abs(todayAOV.value - yesterdayAOV.value)),
          changeDirection: todayAOV.value >= yesterdayAOV.value ? 'up' : 'down',
          target: await this._formatCurrency(targets.aov),
          orderCount: todayAOV.count
        },
        profit: {
          value: todayProfit,
          formatted: await this._formatCurrency(todayProfit),
          margin: todayMarginData.margin,
          marginFormatted: `${(todayMarginData.margin * 100).toFixed(1)}%`,
          change: changes.profitChange,
          source: todayMarginData.source,
          details: todayMarginData.details
        },
        onlineOrders: {
          percentage: onlineOrdersData.percentage,
          formatted: `${onlineOrdersData.percentage.toFixed(1)}%`,
          target: targets.onlineOrders,
          targetFormatted: `${targets.onlineOrders}%`,
          percentageAchievement: Math.round((onlineOrdersData.percentage / targets.onlineOrders) * 100)
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          userId,
          dataQuality: await this._assessDataQuality(todayAOV.count, todayMarginData.source)
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

  /**
   * Debug method to check database orders
   */
  async debugOrders() {
    try {
      const connection = await dbSingleton.getConnection();
      
      // Check recent orders
      const [recentOrders] = await connection.execute(`
        SELECT order_id, total_price, status, created_at, is_cart
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      console.log('🔍 Recent Orders in Database:');
      recentOrders.forEach(order => {
        console.log(`  Order ${order.order_id}: $${order.total_price}, Status: ${order.status}, Date: ${order.created_at}, Cart: ${order.is_cart}`);
      });
      
      // Check completed orders
      const [completedOrders] = await connection.execute(`
        SELECT COUNT(*) as count, SUM(total_price) as total
        FROM orders 
        WHERE status = 'completed' AND is_cart = 0
      `);
      
      console.log(`✅ Completed Orders: ${completedOrders[0].count}, Total Revenue: $${completedOrders[0].total}`);
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  }

  // Private helper methods
  async _getRevenue(connection, startDate, endDate) {
    // Only log once per method call, not for every query
    const isDebug = false; // Set to true only when debugging
    
    // Create cache key for this query
    const cacheKey = `revenue_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.queryCacheTimeout) {
        if (isDebug) console.log(`💰 Revenue from cache: $${cached.value}`);
        return cached.value;
      }
    }
    
    if (isDebug) {
      console.log(`🔍 Revenue Query - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
    }
    
    // First, let's see what orders exist in this date range
    const [debugOrders] = await connection.execute(`
      SELECT order_id, total_price, status, created_at, is_cart
      FROM orders 
      WHERE created_at >= ? AND created_at < ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [startDate, endDate]);
    
    if (isDebug) {
      console.log(`📋 Orders in date range:`);
      debugOrders.forEach(order => {
        console.log(`  Order ${order.order_id}: $${order.total_price}, Status: ${order.status}, Date: ${order.created_at}, Cart: ${order.is_cart}`);
      });
    }
    
    const [result] = await connection.execute(`
      SELECT COALESCE(SUM(total_price), 0) as revenue
      FROM orders 
      WHERE created_at >= ? AND created_at < ? 
        AND status = 'completed'
        AND is_cart = 0
    `, [startDate, endDate]);
    
    const revenue = parseFloat(result[0].revenue);
    
    // Cache the result
    this.queryCache.set(cacheKey, {
      value: revenue,
      timestamp: Date.now()
    });
    
    if (isDebug) {
      console.log(`💰 Revenue found: $${revenue}`);
    }
    
    return revenue;
  }

  async _getAOV(connection, startDate, endDate) {
    const isDebug = false; // Set to true only when debugging
    
    // Create cache key for this query
    const cacheKey = `aov_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.queryCacheTimeout) {
        if (isDebug) console.log(`📊 AOV from cache: $${cached.value}, Orders: ${cached.count}`);
        return cached;
      }
    }
    
    if (isDebug) {
      console.log(`🔍 AOV Query - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
    }
    
    const [result] = await connection.execute(`
      SELECT 
        COALESCE(AVG(total_price), 0) as aov,
        COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= ? AND created_at < ? 
        AND status = 'completed'
        AND is_cart = 0
    `, [startDate, endDate]);
    
    const aov = {
      value: parseFloat(result[0].aov),
      count: parseInt(result[0].order_count)
    };
    
    // Cache the result
    this.queryCache.set(cacheKey, {
      value: aov.value,
      count: aov.count,
      timestamp: Date.now()
    });
    
    if (isDebug) {
      console.log(`📊 AOV found: $${aov.value}, Orders: ${aov.count}`);
    }
    
    return aov;
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
    const laborCosts = revenue * (await databaseConfig.get('labor_cost_ratio'));
    const overheadCosts = revenue * (await databaseConfig.get('overhead_cost_ratio'));
    
    // Validate that cost ratios are configured
    if (laborCosts === undefined || overheadCosts === undefined) {
      throw new Error('Labor and overhead cost ratios must be configured in business_config');
    }
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
      aov: await databaseConfig.getTarget('aov') || 15,
      onlineOrders: await databaseConfig.getTarget('online_orders') || 70
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

  async _formatCurrency(amount) {
    try {
      const currency = await databaseConfig.get('currency') || 'USD';
      const locale = await databaseConfig.get('locale') || 'en-US';
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency, using USD fallback:', error.message);
      // Fallback to USD if config fails
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  }

  async _assessDataQuality(orderCount, profitSource) {
    try {
      const highQualityThreshold = await databaseConfig.get('data_quality_high_threshold') || 10;
      const mediumQualityThreshold = await databaseConfig.get('data_quality_medium_threshold') || 5;
      
      if (orderCount >= highQualityThreshold && profitSource === 'calculated') return 'high';
      if (orderCount >= mediumQualityThreshold || profitSource === 'configured') return 'medium';
      return 'low';
    } catch (error) {
      console.error('Error assessing data quality, using defaults:', error.message);
      // Fallback to defaults if config fails
      if (orderCount >= 10 && profitSource === 'calculated') return 'high';
      if (orderCount >= 5 || profitSource === 'configured') return 'medium';
      return 'low';
    }
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
    this.queryCache.clear(); // Also clear query cache
    console.log('🧹 FinancialService cache cleared');
  }
}

module.exports = new FinancialService();
