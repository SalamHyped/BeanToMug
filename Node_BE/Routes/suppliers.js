const express = require('express');
const router = express.Router();
const { dbSingleton } = require('../dbSingleton');
const {
  handleError, sendSuccess, validateRequiredFields, validateId,
  checkRecordExists, getRecords, asyncHandler, buildWhereClause,
  validateSort, calculatePagination, createPaginationResponse
} = require('../utils/routeHelpers');

/**
 * Supplier Management Routes
 * Using router helpers for consistency with other routes
 * 
 * Available endpoints:
 * - GET /suppliers - Get all suppliers with filtering and search
 * - GET /suppliers/:id - Get specific supplier details  
 * - POST /suppliers - Create new supplier
 * - PUT /suppliers/:id - Update supplier
 * - DELETE /suppliers/:id - Delete supplier
 * - PUT /suppliers/:id/toggle-status - Toggle supplier active status
 */

/**
 * GET /suppliers
 * Retrieve all suppliers with optional filtering and search
 * 
 * Query parameters:
 * - search: Search by supplier name, phone, or email
 * - status: Filter by status (active, inactive, all)
 * - sortBy: Sort field (name, created_at, etc.)
 * - sortOrder: Sort direction (asc, desc)
 * - page: Page number for pagination
 * - limit: Items per page
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    search = '',
    status = 'all',
    sortBy = 'supplier_name',
    sortOrder = 'asc',
    page = 1,
    limit = 50
  } = req.query;

  try {
    const connection = await dbSingleton.getConnection();
    
    // Define filter mapping for buildWhereClause helper
    const filterMap = {
      search: (value) => ({
        condition: `(s.supplier_name LIKE ? OR s.phone_number LIKE ? OR s.email LIKE ?)`,
        params: [`%${value.trim()}%`, `%${value.trim()}%`, `%${value.trim()}%`]
      }),
      status: (value) => {
        if (value === 'active') return { condition: 's.status = 1', params: [] };
        if (value === 'inactive') return { condition: 's.status = 0', params: [] };
        return null; // 'all' - no filter
      }
    };

    // Build WHERE clause using helper
    const filters = { search: search.trim() || null, status: status !== 'all' ? status : null };
    const { whereClause, queryParams } = buildWhereClause(filters, filterMap);

    // Validate sort parameters using helper
    const allowedSortFields = ['supplier_name', 'phone_number', 'email', 'created_at', 'updated_at'];
    const { sortField, order } = validateSort(sortBy, sortOrder, allowedSortFields, 'supplier_name');

    // Calculate pagination using helper
    const { offset, limit: limitNum, page: pageNum } = calculatePagination(page, limit, 100);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM supplier s ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const totalCount = countResult[0].total;

    // Main query with supplier data and ingredient count
    const mainQuery = `
      SELECT 
        s.supplier_id,
        s.supplier_name,
        s.phone_number,
        s.email,
        s.status,
        s.created_at,
        s.updated_at,
        COUNT(i.ingredient_id) as ingredient_count,
        GROUP_CONCAT(DISTINCT i.ingredient_name ORDER BY i.ingredient_name ASC SEPARATOR ', ') as ingredients_list
      FROM supplier s
      LEFT JOIN ingredient i ON s.supplier_id = i.supplier_id
      ${whereClause}
      GROUP BY s.supplier_id
      ORDER BY s.${sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    const [suppliers] = await connection.execute(mainQuery, [...queryParams, limitNum, offset]);

    // Format the response
    const formattedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      ingredient_count: parseInt(supplier.ingredient_count) || 0,
      ingredients_list: supplier.ingredients_list || '',
      status_text: supplier.status ? 'Active' : 'Inactive'
    }));

    // Create pagination response using helper
    const pagination = createPaginationResponse(pageNum, limitNum, totalCount);

    sendSuccess(res, {
      suppliers: formattedSuppliers,
      pagination,
      filters: {
        search,
        status,
        sortBy: sortField,
        sortOrder: order
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch suppliers');
  }
}));

/**
 * GET /suppliers/:id
 * Get detailed information about a specific supplier
 * Including all ingredients supplied by this supplier
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter using helper
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if supplier exists using helper
    const supplierExists = await checkRecordExists(connection, 'supplier', 'supplier_id', id);
    if (!supplierExists) {
      return handleError(res, new Error('Supplier not found'), 'Supplier not found', 404);
    }

    // Get supplier details using helper
    const supplier = await getRecords(connection, `
      SELECT 
        supplier_id,
        supplier_name,
        phone_number,
        email,
        status,
        created_at,
        updated_at
      FROM supplier 
      WHERE supplier_id = ?
    `, [id]);

    // Get all ingredients from this supplier using helper
    const ingredients = await getRecords(connection, `
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
        it.name as type_name,
        ic.name as category_name
      FROM ingredient i
      LEFT JOIN ingredient_type it ON i.type_id = it.id
      LEFT JOIN ingredient_category ic ON i.type_id = ic.id
      WHERE i.supplier_id = ?
      ORDER BY i.ingredient_name ASC
    `, [id]);

    // Get recent product orders from this supplier using helper
    const recentOrders = await getRecords(connection, `
      SELECT 
        po.order_id,
        po.total_price,
        po.order_start_date,
        po.order_end_date,
        po.status
      FROM product_order po
      WHERE po.supplier_id = ?
      ORDER BY po.order_start_date DESC
      LIMIT 10
    `, [id]);

    sendSuccess(res, {
      supplier: {
        ...supplier[0],
        status_text: supplier[0].status ? 'Active' : 'Inactive'
      },
      ingredients: ingredients.map(ing => ({
        ...ing,
        status_text: ing.status ? 'Active' : 'Inactive',
        in_stock: ing.quantity_in_stock > 0,
        low_stock: ing.quantity_in_stock <= ing.low_stock_threshold
      })),
      recent_orders: recentOrders || [],
      statistics: {
        total_ingredients: ingredients.length,
        active_ingredients: ingredients.filter(i => i.status).length,
        low_stock_ingredients: ingredients.filter(i => i.quantity_in_stock <= i.low_stock_threshold).length,
        total_orders: recentOrders.length
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch supplier details');
  }
}));

/**
 * POST /suppliers
 * Create a new supplier
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    supplier_name,
    phone_number = null,
    email = null,
    status = 1
  } = req.body;

  // Validate required fields using helper
  const requiredFields = ['supplier_name'];
  const validationError = validateRequiredFields(req.body, requiredFields);
  if (validationError) {
    return handleError(res, new Error(validationError), validationError, 400);
  }

  // Additional validation
  if (supplier_name.trim().length < 2 || supplier_name.trim().length > 255) {
    return handleError(res, new Error('Supplier name must be between 2 and 255 characters'), 'Invalid supplier name', 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if supplier name already exists using helper
    const nameExists = await getRecords(connection, 
      'SELECT supplier_id FROM supplier WHERE supplier_name = ?', 
      [supplier_name.trim()]
    );

    if (nameExists.length > 0) {
      return handleError(res, new Error('Duplicate supplier name'), 'Supplier with this name already exists', 409);
    }

    // Create new supplier
    const [result] = await connection.execute(`
      INSERT INTO supplier (
        supplier_name, phone_number, email, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [supplier_name.trim(), phone_number, email, status]);

    sendSuccess(res, { 
      supplier_id: result.insertId,
      supplier_name: supplier_name.trim(),
      phone_number,
      email,
      status,
      status_text: status ? 'Active' : 'Inactive'
    }, 'Supplier created successfully', 201);

  } catch (error) {
    handleError(res, error, 'Failed to create supplier');
  }
}));

/**
 * PUT /suppliers/:id
 * Update an existing supplier
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { supplier_name, phone_number, email, status } = req.body;

  // Validate ID and required fields using helpers
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  const validationError = validateRequiredFields(req.body, ['supplier_name']);
  if (validationError) {
    return handleError(res, new Error(validationError), validationError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if supplier exists using helper
    const supplierExists = await checkRecordExists(connection, 'supplier', 'supplier_id', id);
    if (!supplierExists) {
      return handleError(res, new Error('Supplier not found'), 'Supplier not found', 404);
    }

    // Check if supplier name is already taken by another supplier
    const nameCheck = await getRecords(connection,
      'SELECT supplier_id FROM supplier WHERE supplier_name = ? AND supplier_id != ?',
      [supplier_name.trim(), id]
    );

    if (nameCheck.length > 0) {
      return handleError(res, new Error('Duplicate name'), 'Supplier with this name already exists', 409);
    }

    // Update supplier
    await connection.execute(`
      UPDATE supplier SET 
        supplier_name = ?, 
        phone_number = ?, 
        email = ?, 
        status = ?,
        updated_at = NOW()
      WHERE supplier_id = ?
    `, [supplier_name.trim(), phone_number || null, email || null, status, id]);

    sendSuccess(res, {}, 'Supplier updated successfully');

  } catch (error) {
    handleError(res, error, 'Failed to update supplier');
  }
}));

/**
 * PUT /suppliers/:id/toggle-status
 * Toggle supplier active status
 */
router.put('/:id/toggle-status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter using helper
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Get current status using helper
    const supplier = await getRecords(connection,
      'SELECT supplier_id, status FROM supplier WHERE supplier_id = ?',
      [id]
    );

    if (supplier.length === 0) {
      return handleError(res, new Error('Supplier not found'), 'Supplier not found', 404);
    }

    const currentStatus = supplier[0].status;
    const newStatus = currentStatus ? 0 : 1;

    // Update status
    await connection.execute(
      'UPDATE supplier SET status = ?, updated_at = NOW() WHERE supplier_id = ?',
      [newStatus, id]
    );

    sendSuccess(res, { 
      new_status: newStatus,
      status_text: newStatus ? 'Active' : 'Inactive'
    }, `Supplier ${newStatus ? 'activated' : 'deactivated'} successfully`);

  } catch (error) {
    handleError(res, error, 'Failed to toggle supplier status');
  }
}));

/**
 * DELETE /suppliers/:id
 * Delete a supplier (with safety checks)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter using helper
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if supplier exists using helper
    const supplierExists = await checkRecordExists(connection, 'supplier', 'supplier_id', id);
    if (!supplierExists) {
      return handleError(res, new Error('Supplier not found'), 'Supplier not found', 404);
    }

    // Check if supplier has any ingredients using helper
    const ingredientCheck = await getRecords(connection,
      'SELECT COUNT(*) as count FROM ingredient WHERE supplier_id = ?',
      [id]
    );

    if (ingredientCheck[0].count > 0) {
      return handleError(res, 
        new Error('Supplier has associated ingredients'), 
        'Cannot delete supplier with associated ingredients. Please reassign or delete ingredients first.', 
        409
      );
    }

    // Check if supplier has any product orders using helper
    const orderCheck = await getRecords(connection,
      'SELECT COUNT(*) as count FROM product_order WHERE supplier_id = ?',
      [id]
    );

    if (orderCheck[0].count > 0) {
      return handleError(res, 
        new Error('Supplier has associated orders'), 
        'Cannot delete supplier with associated product orders. Please handle orders first.', 
        409
      );
    }

    // Safe to delete
    await connection.execute('DELETE FROM supplier WHERE supplier_id = ?', [id]);

    sendSuccess(res, {}, 'Supplier deleted successfully');

  } catch (error) {
    handleError(res, error, 'Failed to delete supplier');
  }
}));

module.exports = router;
