const { dbSingleton } = require('../dbSingleton');
const databaseConfig = require('../utils/databaseConfig');

/**
 * Order Analytics Service - Handles order-related analytics and metrics
 * Provides clean separation of concerns for order analysis operations
 */
class OrderAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // Default 30 seconds
    
    // Initialize cache timeout from config
    this._initialized = false;
  }

  async _ensureInitialized() {
    if (!this._initialized) {
      await this._initializeCacheTimeout();
      this._initialized = true;
    }
  }

  async _initializeCacheTimeout() {
    try {
      this.cacheTimeout = (await databaseConfig.get('cache_timeout') || 30) * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to initialize cache timeout, using default:', error.message);
    }
  }

  /**
   * Get online orders percentage for a given date range
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Object} Online orders percentage data
   */
  async getOnlineOrdersPercentage(startDate, endDate) {
    try {
      await this._ensureInitialized();
      
      const connection = await dbSingleton.getConnection();
      return await this._calculateOnlineOrdersPercentage(connection, startDate, endDate);
    } catch (error) {
      console.error('OrderAnalyticsService.getOnlineOrdersPercentage error:', error);
      throw new Error(`Failed to calculate online orders percentage: ${error.message}`);
    }
  }

  /**
   * Get comprehensive order analytics for a date range
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Object} Complete order analytics data
   */
  async getOrderAnalytics(startDate, endDate) {
    try {
      await this._ensureInitialized();
      
      const connection = await dbSingleton.getConnection();
      
      const [
        onlineOrdersData,
        orderTypeDistribution
      ] = await Promise.all([
        this._calculateOnlineOrdersPercentage(connection, startDate, endDate),
        this._getOrderTypeDistribution(connection, startDate, endDate)
      ]);

      return {
        onlineOrders: onlineOrdersData,
        orderTypes: orderTypeDistribution,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('OrderAnalyticsService.getOrderAnalytics error:', error);
      throw new Error(`Failed to get order analytics: ${error.message}`);
    }
  }

  // Private helper methods
  async _calculateOnlineOrdersPercentage(connection, startDate, endDate) {
    const isDebug = false;
    
    // Create cache key for this query
    const cacheKey = `online_orders_percentage_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        if (isDebug) console.log(`Online Orders Percentage from cache: ${cached.percentage}%`);
        return cached;
      }
    }
    
    if (isDebug) {
      console.log(`🔍 Online Orders Percentage Query - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
    }
    
    const [result] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN o.is_cart = 0 THEN 1 ELSE 0 END) / COUNT(DISTINCT o.order_id), 0) * 100 as percentage,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(CASE WHEN o.is_cart = 0 THEN 1 ELSE 0 END) as online_orders,
        SUM(CASE WHEN o.is_cart = 1 THEN 1 ELSE 0 END) as cart_orders
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < ?
    `, [startDate, endDate]);
    
    const data = result[0];
    const percentage = parseFloat(data.percentage);
    const totalOrders = parseInt(data.total_orders);
    const onlineOrders = parseInt(data.online_orders);
    const cartOrders = parseInt(data.cart_orders);
    
    const resultData = {
      percentage: percentage,
      totalOrders: totalOrders,
      onlineOrders: onlineOrders,
      cartOrders: cartOrders,
      formatted: `${percentage.toFixed(1)}%`
    };
    
    // Cache the result
    this.cache.set(cacheKey, {
      ...resultData,
      timestamp: Date.now()
    });
    
    if (isDebug) {
      console.log(`📊 Online Orders Percentage found: ${percentage}% (${onlineOrders}/${totalOrders})`);
    }
    
    return resultData;
  }

  async _getOrderTypeDistribution(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        o.order_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE created_at >= ? AND created_at < ?), 2) as percentage
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < ?
      GROUP BY o.order_type
      ORDER BY count DESC
    `, [startDate, endDate, startDate, endDate]);

    return result.map(row => ({
      type: row.order_type || 'unknown',
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage)
    }));
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 OrderAnalyticsService cache cleared');
  }
}

module.exports = new OrderAnalyticsService();
