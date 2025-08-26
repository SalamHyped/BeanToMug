const { dbSingleton } = require('../dbSingleton');

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
   * Get order ratings analytics for a date range
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Object} Order ratings data
   */
  async getOrderRatings(startDate, endDate) {
    try {
      await this._ensureInitialized();
      
      let start, end;
      
      // Use provided dates or calculate default range (7 days)
      if (startDate && endDate) {
        start = startDate;
        end = endDate;
      } else {
        // Default: last 7 days
        end = new Date();
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const connection = await dbSingleton.getConnection();
      
      const [
        overallRating,
        ratingDistribution,
        orderTypeRatings,
        ratingTrends
      ] = await Promise.all([
        this._getOverallRating(connection, start, end),
        this._getRatingDistribution(connection, start, end),
        this._getOrderTypeRatings(connection, start, end),
        this._getRatingTrends(connection, end)
      ]);

      // If no ratings found, return default structure
      if (overallRating.totalRatings === 0) {
        return {
          overall: 0,
          totalRatings: 0,
          distribution: { five: 0, four: 0, three: 0, two: 0, one: 0 },
          byOrderType: { online: 0, pickup: 0 },
          trends: [],
          dateRange: { start: start.toISOString(), end: end.toISOString(), range: 'default' }
        };
      }

      return {
        overall: overallRating.overall,
        totalRatings: overallRating.totalRatings,
        distribution: ratingDistribution,
        byOrderType: orderTypeRatings,
        trends: ratingTrends,
        dateRange: { start: start.toISOString(), end: end.toISOString(), range: 'custom' }
      };
    } catch (error) {
      console.error('OrderAnalyticsService.getOrderRatings error:', error);
      throw new Error(`Failed to get order ratings: ${error.message}`);
    }
  }



  // Private helper methods for ratings
  async _getOverallRating(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        AVG(rating) as overall,
        COUNT(rating) as totalRatings
      FROM orders 
      WHERE rating > 0 
        AND created_at >= ? 
        AND created_at <= ?
    `, [startDate, endDate]);
    
    const overall = result[0]?.overall;
    const totalRatings = result[0]?.totalRatings;
    
    return {
      overall: overall !== null ? parseFloat(overall) : 0,
      totalRatings: parseInt(totalRatings || 0)
    };
  }

  async _getRatingDistribution(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM orders 
      WHERE rating > 0 
        AND created_at >= ? 
        AND created_at <= ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [startDate, endDate]);
    
    const distribution = {
      five: 0, four: 0, three: 0, two: 0, one: 0
    };
    
    result.forEach(row => {
      if (row.rating >= 1 && row.rating <= 5 && row.count !== null) {
        distribution[row.rating === 1 ? 'one' : row.rating === 2 ? 'two' : row.rating === 3 ? 'three' : row.rating === 4 ? 'four' : 'five'] = parseInt(row.count || 0);
      }
    });
    
    return distribution;
  }

  async _getOrderTypeRatings(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        order_type,
        AVG(rating) as avgRating,
        COUNT(rating) as count
      FROM orders 
      WHERE rating > 0 
        AND created_at >= ? 
        AND created_at <= ?
      GROUP BY order_type
      ORDER BY avgRating DESC
    `, [startDate, endDate]);
    
    const byOrderType = {
      online: 0,
      pickup: 0
    };
    
    result.forEach(row => {
      const type = row.order_type?.toLowerCase();
      
      // Map your actual database values to chart labels
      let mappedType = null;
      if (type === 'dine in') {
        mappedType = 'online';  // Dine In = Online Orders
      } else if (type === 'take away') {
        mappedType = 'pickup';  // Take Away = Pickup
      }
      
      if (mappedType && byOrderType.hasOwnProperty(mappedType) && row.avgRating !== null) {
        byOrderType[mappedType] = parseFloat(parseFloat(row.avgRating).toFixed(1));
      }
    });
    
    return byOrderType;
  }

  async _getRatingTrends(connection, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        AVG(rating) as avgRating,
        COUNT(rating) as count
      FROM orders 
      WHERE rating > 0 
        AND created_at >= DATE_SUB(?, INTERVAL 7 DAY)
        AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [endDate, endDate]);
    
    return result.map(row => ({
      date: row.date,
      rating: row.avgRating !== null ? parseFloat(parseFloat(row.avgRating).toFixed(1)) : 0,
      count: parseInt(row.count || 0)
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
