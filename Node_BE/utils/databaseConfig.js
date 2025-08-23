const { dbSingleton } = require('../dbSingleton');

class DatabaseConfig {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
    this.lastCacheUpdate = 0;
  }

  /**
   * Get configuration value with caching
   */
  async get(key) {
    // Check cache first
    if (this.isCacheValid() && this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Load from database
    await this.loadCache();
    return this.cache.get(key) || null;
  }

  /**
   * Get multiple configuration values
   */
  async getMultiple(keys) {
    if (!this.isCacheValid()) {
      await this.loadCache();
    }

    const result = {};
    for (const key of keys) {
      result[key] = this.cache.get(key) || null;
    }
    return result;
  }

  /**
   * Get all configurations by category
   */
  async getByCategory(category) {
    const connection = await dbSingleton.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT config_key, config_value, config_type, description
        FROM business_config 
        WHERE category = ? AND is_active = TRUE
        ORDER BY config_key
      `, [category]);

      const result = {};
      for (const row of rows) {
        result[row.config_key] = this.parseValue(row.config_value, row.config_type);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching config by category:', error);
      return {};
    }
  }

  /**
   * Set configuration value with validation and audit
   */
  async set(key, value, userId, reason = null) {
    const connection = await dbSingleton.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current config for validation
      const [existing] = await connection.execute(`
        SELECT id, config_value, config_type, min_value, max_value, version
        FROM business_config 
        WHERE config_key = ? AND is_active = TRUE
      `, [key]);

      if (existing.length === 0) {
        await connection.rollback();
        throw new Error(`Configuration key '${key}' not found`);
      }

      const config = existing[0];
      
      // Validate value
      const validationError = this.validateValue(value, config);
      if (validationError) {
        await connection.rollback();
        throw new Error(validationError);
      }

      // Convert value to string for storage
      const stringValue = this.stringifyValue(value, config.config_type);

      // Update with optimistic locking
      const [updateResult] = await connection.execute(`
        UPDATE business_config 
        SET config_value = ?, updated_by = ?, updated_at = NOW(), version = version + 1
        WHERE id = ? AND version = ?
      `, [stringValue, userId, config.id, config.version]);

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        throw new Error('Configuration was modified by another user. Please refresh and try again.');
      }

      await connection.commit();
      
      // Clear cache
      this.clearCache();
      
      return {
        success: true,
        key,
        oldValue: this.parseValue(config.config_value, config.config_type),
        newValue: value,
        updatedBy: userId
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  /**
   * Load all configurations into cache
   */
  async loadCache() {
    const connection = await dbSingleton.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT config_key, config_value, config_type
        FROM business_config 
        WHERE is_active = TRUE
      `);

      this.cache.clear();
      for (const row of rows) {
        const value = this.parseValue(row.config_value, row.config_type);
        this.cache.set(row.config_key, value);
      }
      
      this.lastCacheUpdate = Date.now();
      
    } catch (error) {
      console.error('Error loading config cache:', error);
    }
  }

  /**
   * Parse stored value based on type
   */
  parseValue(value, type) {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      default:
        return value;
    }
  }

  /**
   * Convert value to string for storage
   */
  stringifyValue(value, type) {
    switch (type) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value);
    }
  }

  /**
   * Validate value against constraints
   */
  validateValue(value, config) {
    const { config_type, min_value, max_value } = config;
    
    switch (config_type) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          return `Value must be a valid number`;
        }
        if (min_value !== null && num < min_value) {
          return `Value must be at least ${min_value}`;
        }
        if (max_value !== null && num > max_value) {
          return `Value must not exceed ${max_value}`;
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return `Value must be true or false`;
        }
        break;
        
      case 'json':
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
          } catch {
            return `Value must be valid JSON`;
          }
        }
        break;
    }
    
    return null; // Valid
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    return Date.now() - this.lastCacheUpdate < this.cacheTimeout;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Get configuration audit history
   */
  async getAuditHistory(key, limit = 10) {
    const connection = await dbSingleton.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          a.old_value, a.new_value, a.action, a.changed_at, a.change_reason,
          u.username, u.first_name, u.last_name
        FROM business_config_audit a
        LEFT JOIN users u ON a.changed_by = u.id
        WHERE a.config_key = ?
        ORDER BY a.changed_at DESC
        LIMIT ?
      `, [key, limit]);

      return rows;
    } catch (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
  }

  // Quick access methods for common configs
  async getProfitMargin(category = 'default') {
    return await this.get(`profit_margin_${category}`) || await this.get('profit_margin_fallback');
  }

  async getTarget(type) {
    return await this.get(`${type}_target`);
  }

  async shouldUseRealCosts() {
    return await this.get('use_real_costs') !== false;
  }

  async getCurrency() {
    return await this.get('currency') || 'USD';
  }

  async getUpdateFrequency() {
    return await this.get('update_frequency_seconds') || 30;
  }
}

// Export singleton instance
module.exports = new DatabaseConfig();
