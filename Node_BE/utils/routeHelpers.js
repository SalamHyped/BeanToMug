/**
 * Shared utilities for route handlers
 * Reduces code duplication across route files
 */

/**
 * Standard error handler for route responses
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} message - User-friendly error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const handleError = (res, error, message, statusCode = 500) => {
  console.error(`Error: ${message}`, error);
  res.status(statusCode).json({ 
    success: false, 
    message,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
};

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Validate required fields in request body
 * @param {Object} data - Request body data
 * @param {Array} requiredFields - Array of required field names
 * @returns {string|null} - Error message or null if valid
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return `The following fields are required: ${missingFields.join(', ')}`;
  }
  
  return null;
};

/**
 * Validate status value (0 or 1)
 * @param {any} status - Status value to validate
 * @returns {string|null} - Error message or null if valid
 */
/**
 * Normalize status to number (0 or 1)
 * @param {any} status - Status value to normalize
 * @param {number} defaultValue - Default value if status is null/undefined
 * @returns {number} - Normalized status (0 or 1)
 */
const normalizeStatus = (status, defaultValue = 1) => {
  return status !== undefined && status !== null ? Number(status) : defaultValue;
};

/**
 * Validate status (must be 0 or 1)
 * @param {any} status - Status value to validate
 * @returns {string|null} - Error message or null if valid
 */
const validateStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized !== 0 && normalized !== 1) {
    return 'Status must be 0 (inactive) or 1 (active)';
  }
  return null;
};

/**
 * Validate numeric ID parameter
 * @param {any} id - ID value to validate
 * @returns {string|null} - Error message or null if valid
 */
const validateId = (id) => {
  if (id === null || id === undefined || id === '' || isNaN(id) || parseInt(id) < 0) {
    return 'Invalid ID parameter';
  }
  return null;
};

/**
 * Check if a record exists in the database
 * @param {Object} db - Database connection
 * @param {string} table - Table name
 * @param {string} idField - ID field name
 * @param {any} id - ID value
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
const checkRecordExists = async (db, table, idField, id) => {
  try {
    const [result] = await db.execute(
      `SELECT ${idField} FROM ${table} WHERE ${idField} = ? LIMIT 1`,
      [id]
    );
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking ${table} existence:`, error);
    throw error;
  }
};

/**
 * Get record with optional joins
 * @param {Object} db - Database connection
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const getRecords = async (db, query, params = []) => {
  try {
    const [results] = await db.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

/**
 * Build WHERE clause from filters
 * @param {Object} filters - Filter object
 * @param {Object} filterMap - Mapping of filter keys to SQL conditions
 * @returns {Object} - { whereClause, queryParams }
 */
const buildWhereClause = (filters, filterMap) => {
  const whereConditions = [];
  const queryParams = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value && filterMap[key]) {
      if (typeof filterMap[key] === 'function') {
        const result = filterMap[key](value);
        if (result && result.condition) {
          whereConditions.push(result.condition);
          if (result.params && result.params.length > 0) {
            queryParams.push(...result.params);
          }
        }
      } else {
        whereConditions.push(filterMap[key]);
        queryParams.push(value);
      }
    }
  });

  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ') 
    : '';

  return { whereClause, queryParams };
};

/**
 * Validate and sanitize sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {Array} validFields - Array of valid sort fields
 * @param {string} defaultField - Default sort field
 * @returns {Object} - { sortField, order }
 */
const validateSort = (sortBy, sortOrder, validFields, defaultField) => {
  const sortField = validFields.includes(sortBy) ? sortBy : defaultField;
  const order = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  
  return { sortField, order };
};

/**
 * Calculate pagination parameters
 * @param {number|string} page - Page number
 * @param {number|string} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} - { offset, limit: sanitizedLimit, page: sanitizedPage }
 */
const calculatePagination = (page = 1, limit = 20, maxLimit = 100) => {
  const sanitizedPage = Math.max(1, parseInt(page) || 1);
  const sanitizedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  const offset = (sanitizedPage - 1) * sanitizedLimit;
  
  return { 
    offset, 
    limit: sanitizedLimit, 
    page: sanitizedPage 
  };
};

/**
 * Create pagination response object
 * @param {number} currentPage - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {Object} - Pagination object
 */
const createPaginationResponse = (currentPage, limit, totalCount) => {
  return {
    currentPage,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
    limit,
    hasNext: currentPage < Math.ceil(totalCount / limit),
    hasPrev: currentPage > 1
  };
};

/**
 * Async wrapper for route handlers that automatically catches errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a middleware that validates request body against schema
 * @param {Object} schema - Validation schema
 * @returns {Function} - Validation middleware
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Basic validation - can be extended with a library like Joi
    Object.entries(schema).forEach(([field, rules]) => {
      const value = req.body[field];
      
      if (rules.required && (!value && value !== 0)) {
        errors.push(`${field} is required`);
      }
      
      if (value && rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
      
      if (value && rules.min && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      
      if (value && rules.max && value > rules.max) {
        errors.push(`${field} must not exceed ${rules.max}`);
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  handleError,
  sendSuccess,
  validateRequiredFields,
  normalizeStatus,
  validateStatus,
  validateId,
  checkRecordExists,
  getRecords,
  buildWhereClause,
  validateSort,
  calculatePagination,
  createPaginationResponse,
  asyncHandler,
  validateBody
};
