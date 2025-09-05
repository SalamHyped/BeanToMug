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
      await this._initializeTargets();
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

  async _initializeTargets() {
    try {
      // Initialize default targets (only keeping non-order related targets)
      this.defaultTargets = {
        totalOrders: await databaseConfig.get('total_orders_target') || 100,
        customerSatisfaction: await databaseConfig.get('customer_satisfaction_target') || 4.5
      };
      
      console.log('🎯 Targets initialized:', this.defaultTargets);
    } catch (error) {
      console.error('Failed to initialize targets, using defaults:', error.message);
      this.defaultTargets = {
        totalOrders: 100,
        customerSatisfaction: 4.5
      };
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
        orderTypeDistribution,
        popularItems
      ] = await Promise.all([
        this._calculateOnlineOrdersPercentage(connection, startDate, endDate),
        this._getOrderTypeDistribution(connection, startDate, endDate),
        this.getMostPopularItems(startDate, endDate)
      ]);

      // Calculate customer satisfaction and processing time
      const [customerSatisfactionData, processingTimeData] = await Promise.all([
        this._calculateCustomerSatisfaction(connection, startDate, endDate),
        this._calculateProcessingTime(connection, startDate, endDate)
      ]);

      return {
        onlineOrders: onlineOrdersData,
        orderTypes: orderTypeDistribution,
        popularItems: popularItems,
        customerSatisfaction: customerSatisfactionData,
        processingTime: processingTimeData,
        targets: this.defaultTargets,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          lastUpdated: new Date().toISOString(),
          periodDuration: endDate.getTime() - startDate.getTime()
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
    
    // Calculate previous period dates
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime());
    
    // Single optimized query to get current and previous period data
    const [result] = await connection.execute(`
      SELECT 
        -- Current period
        COALESCE(SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? AND o.is_cart = 0 THEN 1 ELSE 0 END) / 
                 NULLIF(SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? THEN 1 ELSE 0 END), 0), 0) * 100 as current_percentage,
        SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? THEN 1 ELSE 0 END) as current_total_orders,
        SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? AND o.is_cart = 0 THEN 1 ELSE 0 END) as current_online_orders,
        SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? AND o.is_cart = 1 THEN 1 ELSE 0 END) as current_cart_orders,
        
        -- Previous period
        COALESCE(SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? AND o.is_cart = 0 THEN 1 ELSE 0 END) / 
                 NULLIF(SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? THEN 1 ELSE 0 END), 0), 0) * 100 as previous_percentage,
        SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? THEN 1 ELSE 0 END) as previous_total_orders,
        SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? AND o.is_cart = 0 THEN 1 ELSE 0 END) as previous_online_orders,
        SUM(CASE WHEN o.created_at >= ? AND o.created_at < ? AND o.is_cart = 1 THEN 1 ELSE 0 END) as previous_cart_orders
      FROM orders o
    `, [
      // Current period params
      startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate,
      // Previous period params  
      previousStartDate, previousEndDate, previousStartDate, previousEndDate, previousStartDate, previousEndDate, previousStartDate, previousEndDate, previousStartDate, previousEndDate
    ]);
    
    const data = result[0];
    
    // Current period data
    const currentPercentage = parseFloat(data.current_percentage);
    const currentTotalOrders = parseInt(data.current_total_orders);
    const currentOnlineOrders = parseInt(data.current_online_orders);
    const currentCartOrders = parseInt(data.current_cart_orders);
    
    // Previous period data
    const previousPercentage = parseFloat(data.previous_percentage);
    const previousTotalOrders = parseInt(data.previous_total_orders);
    
    // Calculate change and trend
    const change = this._calculateChange(currentTotalOrders, previousTotalOrders);
    const trend = this._calculateTrend(currentTotalOrders, previousTotalOrders);
    
    const resultData = {
      percentage: currentPercentage,
      totalOrders: currentTotalOrders,
      onlineOrders: currentOnlineOrders,
      cartOrders: currentCartOrders,
      formatted: `${currentPercentage.toFixed(1)}%`,
      change: change,
      comparison: "vs previous period", // Will be updated by frontend
      trend: trend
    };
    
    // Cache the result
    this.cache.set(cacheKey, {
      ...resultData,
      timestamp: Date.now()
    });
    
    if (isDebug) {
      console.log(`📊 Online Orders Percentage found: ${currentPercentage}% (${currentOnlineOrders}/${currentTotalOrders})`);
      console.log(`📈 Change: ${change}, Trend: ${trend}`);
    }
    
    return resultData;
  }

  async _getOrderTypeDistribution(connection, startDate, endDate) {
    const [result] = await connection.execute(`
      SELECT 
        o.order_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE created_at >= ? AND o.created_at < ?), 2) as percentage
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
   * Calculate customer satisfaction score for a date range
   * @param {Object} connection - Database connection
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Object} Customer satisfaction data
   */
  async _calculateCustomerSatisfaction(connection, startDate, endDate) {
    try {
      // Get current period ratings from orders table
      const [currentResult] = await connection.execute(`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_ratings,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM orders 
        WHERE created_at >= ? AND created_at < ? AND rating > 0
      `, [startDate, endDate]);

      const currentData = currentResult[0];
      const currentScore = parseFloat(currentData.average_rating || 0);
      const currentTotalRatings = parseInt(currentData.total_ratings || 0);

      // Get previous period for comparison
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = new Date(startDate.getTime());

      const [previousResult] = await connection.execute(`
        SELECT AVG(rating) as average_rating
        FROM orders 
        WHERE created_at >= ? AND created_at < ? AND rating > 0
      `, [previousStartDate, previousEndDate]);

      const previousData = previousResult[0];
      const previousScore = parseFloat(previousData.average_rating || 0);

      // Calculate change and trend
      const change = this._calculateChange(currentScore, previousScore);
      const trend = this._calculateTrend(currentScore, previousScore);

      return {
        score: currentScore,
        change: change,
        trend: trend,
        totalRatings: currentTotalRatings,
        distribution: {
          fiveStar: parseInt(currentData.five_star || 0),
          fourStar: parseInt(currentData.four_star || 0),
          threeStar: parseInt(currentData.three_star || 0),
          twoStar: parseInt(currentData.two_star || 0),
          oneStar: parseInt(currentData.one_star || 0)
        }
      };
    } catch (error) {
      console.error('Error calculating customer satisfaction:', error);
      return {
        score: 0,
        change: "0.0",
        trend: "neutral",
        totalRatings: 0,
        distribution: {}
      };
    }
  }

  /**
   * Calculate order processing time for a date range
   * @param {Object} connection - Database connection
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Object} Processing time data
   */
  async _calculateProcessingTime(connection, startDate, endDate) {
    try {
      // Get current period processing times (using updated_at as completion time)
      const [currentResult] = await connection.execute(`
        SELECT 
          AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as average_time,
          MIN(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as fastest_time,
          MAX(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as slowest_time,
          COUNT(*) as total_orders
        FROM orders 
        WHERE created_at >= ? AND created_at < ? 
        AND status = 'completed'
      `, [startDate, endDate]);

      const currentData = currentResult[0];
      const currentAverage = parseFloat(currentData.average_time || 0);
      const currentFastest = parseFloat(currentData.fastest_time || 0);
      const currentSlowest = parseFloat(currentData.slowest_time || 0);
      const currentTotalOrders = parseInt(currentData.total_orders || 0);

      // Get previous period for comparison
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = new Date(startDate.getTime());

      const [previousResult] = await connection.execute(`
        SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as average_time
        FROM orders 
        WHERE created_at >= ? AND created_at < ? 
        AND status = 'completed'
      `, [previousStartDate, previousEndDate]);

      const previousData = previousResult[0];
      const previousAverage = parseFloat(previousData.average_time || 0);

      // Calculate change and trend (lower is better for processing time)
      const change = this._calculateChange(currentAverage, previousAverage);
      const trend = currentAverage < previousAverage ? 'up' : currentAverage > previousAverage ? 'down' : 'neutral';

      return {
        average: currentAverage,
        change: change,
        trend: trend,
        fastest: currentFastest,
        slowest: currentSlowest,
        totalOrders: currentTotalOrders
      };
    } catch (error) {
      console.error('Error calculating processing time:', error);
      return {
        average: 0,
        change: "0.0 min",
        trend: "neutral",
        fastest: 0,
        slowest: 0,
        totalOrders: 0
      };
    }
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
      
      // Use provided dates or calculate default range (30 days)
      if (startDate && endDate) {
        start = startDate;
        end = endDate;
      } else {
        // Default: last 30 days to show more order types
        end = new Date();
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
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
   * Get most popular items for a date range
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Array} Array of popular items with counts and trends
   */
  async getMostPopularItems(startDate, endDate) {
    try {
      await this._ensureInitialized();
      
      const connection = await dbSingleton.getConnection();
      
      // Get current period popular items
      const currentItems = await this._getPopularItems(connection, startDate, endDate);
      
      // Get previous period for trend calculation
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodLength);
      const previousEnd = new Date(startDate.getTime());
      
      const previousItems = await this._getPopularItems(connection, previousStart, previousEnd);
      
      // Calculate trends and combine data
      const itemsWithTrends = currentItems.map(currentItem => {
        const previousItem = previousItems.find(prev => prev.name === currentItem.name);
        const previousCount = previousItem ? previousItem.count : 0;
        
        let trend = 'neutral';
        if (currentItem.count > previousCount) trend = 'up';
        else if (currentItem.count < previousCount) trend = 'down';
        
        return {
          ...currentItem,
          trend,
          previousCount,
          change: currentItem.count - previousCount
        };
      });
      
      return itemsWithTrends;
    } catch (error) {
      console.error('OrderAnalyticsService.getMostPopularItems error:', error);
      throw new Error(`Failed to get most popular items: ${error.message}`);
    }
  }

  /**
   * Get popular items from database
   * @param {Object} connection - Database connection
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of items with counts
   */
  async _getPopularItems(connection, startDate, endDate) {
    try {
      // Query for most ordered items
      const [result] = await connection.execute(`
        SELECT 
          d.item_name as name,
          COUNT(*) as count,
          AVG(o.rating) as avgRating
        FROM order_item oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN dish d ON oi.item_id = d.item_id
        WHERE o.created_at >= ? AND o.created_at <= ?
        GROUP BY d.item_name
        ORDER BY count DESC
        LIMIT 6
      `, [startDate, endDate]);
      
      return result.map(row => ({
        name: row.name || 'Unknown Item',
        count: parseInt(row.count || 0),
        avgRating: row.avgRating ? parseFloat(parseFloat(row.avgRating).toFixed(1)) : 0
      }));
    } catch (error) {
      console.error('Error getting popular items:', error);
      // Return default items if query fails
      return [
        { name: "Espresso", count: 0, avgRating: 0 },
        { name: "Cappuccino", count: 0, avgRating: 0 },
        { name: "Latte", count: 0, avgRating: 0 },
        { name: "Americano", count: 0, avgRating: 0 },
        { name: "Mocha", count: 0, avgRating: 0 },
        { name: "Croissant", count: 0, avgRating: 0 }
      ];
    }
  }

  /**
   * Calculate percentage change between two values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {string} Formatted change percentage
   */
  _calculateChange(current, previous) {
    if (previous === 0) {
      return current > 0 ? '+100.0%' : '0.0%';
    }
    
    const changePercent = ((current - previous) / previous) * 100;
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  }

  /**
   * Determine trend based on two values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {string} Trend direction: 'up', 'down', or 'neutral'
   */
  _calculateTrend(current, previous) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
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
