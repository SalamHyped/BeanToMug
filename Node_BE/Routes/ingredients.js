const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
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
  asyncHandler
} = require('../utils/routeHelpers');

// Apply authentication and role checking to all routes
router.use(authenticateToken, requireRole(['admin']));

// Constants
const INGREDIENT_REQUIRED_FIELDS = ['ingredient_name', 'price', 'brand', 'expiration', 'unit', 'type_id'];
const INGREDIENT_SORT_FIELDS = ['ingredient_name', 'price', 'brand', 'quantity_in_stock', 'expiration', 'status'];
const INGREDIENT_SELECT_QUERY = `
  SELECT 
    i.ingredient_id,
    i.ingredient_name,
    i.price,
    i.brand,
    i.status,
    i.expiration,
    i.unit,
    i.supplier_id,
    i.quantity_in_stock,
    i.low_stock_threshold,
    i.type_id,
    it.name as type_name,
    ic.name as category_name
  FROM ingredient i
  LEFT JOIN ingredient_type it ON i.type_id = it.id
  LEFT JOIN ingredient_category ic ON ic.type_id = it.id`;

// Filter mapping for building WHERE clauses
const INGREDIENT_FILTERS = {
  search: (value) => ({
    condition: '(i.ingredient_name LIKE ? OR i.brand LIKE ?)',
    params: [`%${value}%`, `%${value}%`]
  }),
  category: (value) => ({ condition: 'ic.name = ?', params: [value] }),
  type: (value) => ({ condition: 'it.name = ?', params: [value] }),
  status: (value) => {
    if (value === 'active') return { condition: 'i.status = 1', params: [] };
    if (value === 'inactive') return { condition: 'i.status = 0', params: [] };
    if (value === 'low_stock') return { condition: 'i.quantity_in_stock <= i.low_stock_threshold', params: [] };
    return null;
  }
};

/**
 * GET /ingredients
 * Get all ingredients with filtering and search capabilities
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    search = '', category = '', type = '', status = 'all',
    sortBy = 'ingredient_name', sortOrder = 'asc',
    page = 1, limit = 50
  } = req.query;

  // Build WHERE clause
  const filters = { search, category, type, status: status !== 'all' ? status : null };
  const { whereClause, queryParams } = buildWhereClause(filters, INGREDIENT_FILTERS);

  // Validate and sanitize sort parameters
  const { sortField, order } = validateSort(sortBy, sortOrder, INGREDIENT_SORT_FIELDS, 'ingredient_name');

  // Calculate pagination
  const { offset, limit: sanitizedLimit, page: sanitizedPage } = calculatePagination(page, limit, 100);

  // Get ingredients with pagination
  const ingredients = await getRecords(
    req.db,
    `${INGREDIENT_SELECT_QUERY} ${whereClause} ORDER BY i.${sortField} ${order} LIMIT ? OFFSET ?`,
    [...queryParams, sanitizedLimit, offset]
  );

  // Get total count for pagination
  const countResults = await getRecords(
    req.db,
    `SELECT COUNT(*) as total FROM ingredient i 
     LEFT JOIN ingredient_type it ON i.type_id = it.id
     LEFT JOIN ingredient_category ic ON ic.type_id = it.id ${whereClause}`,
    queryParams
  );

  const totalCount = countResults[0].total;
  const pagination = createPaginationResponse(sanitizedPage, sanitizedLimit, totalCount);

  sendSuccess(res, { ingredients, pagination });
}));

/**
 * GET /ingredients/:id
 * Get a single ingredient by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter
  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ success: false, message: idError });
  }

  const ingredients = await getRecords(
    req.db,
    `${INGREDIENT_SELECT_QUERY} WHERE i.ingredient_id = ?`,
    [id]
  );

  if (ingredients.length === 0) {
    return res.status(404).json({ success: false, message: 'Ingredient not found' });
  }

  sendSuccess(res, { ingredient: ingredients[0] });
}));

/**
 * POST /ingredients
 * Create a new ingredient
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    ingredient_name, price, brand, expiration, unit,
    supplier_id = null, quantity_in_stock = 0, low_stock_threshold = 100,
    type_id, status = 1
  } = req.body;

  // Validate and normalize status
  const statusError = validateStatus(status);
  if (statusError) {
    return res.status(400).json({ success: false, message: statusError });
  }
  const normalizedStatus = normalizeStatus(status, 1);

  // Validate required fields
  const validationError = validateRequiredFields(req.body, INGREDIENT_REQUIRED_FIELDS);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  // Check if ingredient type exists
  const typeExists = await checkRecordExists(req.db, 'ingredient_type', 'id', type_id);
  if (!typeExists) {
    return res.status(400).json({ success: false, message: 'Invalid ingredient type ID' });
  }

  // Normalize supplier_id: validate and set to NULL if invalid
  let finalSupplierId = null;
  if (supplier_id) {
    const supplierIdNum = parseInt(supplier_id);
    if (supplierIdNum > 0) {
      const supplierExists = await checkRecordExists(req.db, 'supplier', 'supplier_id', supplierIdNum);
      finalSupplierId = supplierExists ? supplierIdNum : null;
    }
  }

  // Insert new ingredient
  const [result] = await req.db.execute(`
    INSERT INTO ingredient (
      ingredient_name, price, brand, status, expiration, unit, 
      supplier_id, quantity_in_stock, low_stock_threshold, type_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ingredient_name, price, brand, normalizedStatus, expiration, unit,
    finalSupplierId, quantity_in_stock, low_stock_threshold, type_id
  ]);

  sendSuccess(res, { ingredient_id: result.insertId }, 'Ingredient created successfully', 201);
}));

/**
 * PUT /ingredients/:id
 * Update an existing ingredient
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    ingredient_name, price, brand, expiration, unit,
    supplier_id, quantity_in_stock, low_stock_threshold, type_id, status
  } = req.body;

  // Validate ID parameter
  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ success: false, message: idError });
  }

  // Check if ingredient exists
  const ingredientExists = await checkRecordExists(req.db, 'ingredient', 'ingredient_id', id);
  if (!ingredientExists) {
    return res.status(404).json({ success: false, message: 'Ingredient not found' });
  }

  // Validate and normalize status
  const statusError = validateStatus(status);
  if (statusError) {
    return res.status(400).json({ success: false, message: statusError });
  }
  const normalizedStatus = normalizeStatus(status, 1);

  // Validate required fields
  const validationError = validateRequiredFields(req.body, INGREDIENT_REQUIRED_FIELDS);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  // Check if ingredient type exists
  const typeExists = await checkRecordExists(req.db, 'ingredient_type', 'id', type_id);
  if (!typeExists) {
    return res.status(400).json({ success: false, message: 'Invalid ingredient type ID' });
  }

  // Normalize supplier_id: validate and set to NULL if invalid
  let finalSupplierId = null;
  if (supplier_id) {
    const supplierIdNum = parseInt(supplier_id);
    if (supplierIdNum > 0) {
      const supplierExists = await checkRecordExists(req.db, 'supplier', 'supplier_id', supplierIdNum);
      finalSupplierId = supplierExists ? supplierIdNum : null;
    }
  }

  // Update ingredient
  await req.db.execute(`
    UPDATE ingredient SET 
      ingredient_name = ?, price = ?, brand = ?, expiration = ?, unit = ?, 
      supplier_id = ?, quantity_in_stock = ?, low_stock_threshold = ?, 
      type_id = ?, status = ?
    WHERE ingredient_id = ?
  `, [
    ingredient_name, price, brand, expiration, unit,
    finalSupplierId, quantity_in_stock, low_stock_threshold, type_id, normalizedStatus, id
  ]);

  sendSuccess(res, {}, 'Ingredient updated successfully');
}));

/**
 * PATCH /ingredients/:id/status
 * Update ingredient status (activate/deactivate)
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate ID parameter
  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ success: false, message: idError });
  }

  // Validate and normalize status
  const statusError = validateStatus(status);
  if (statusError) {
    return res.status(400).json({ success: false, message: statusError });
  }
  const normalizedStatus = normalizeStatus(status);

  // Check if ingredient exists
  const ingredientExists = await checkRecordExists(req.db, 'ingredient', 'ingredient_id', id);
  if (!ingredientExists) {
    return res.status(404).json({ success: false, message: 'Ingredient not found' });
  }

  // Update status
  await req.db.execute('UPDATE ingredient SET status = ? WHERE ingredient_id = ?', [normalizedStatus, id]);

  const message = `Ingredient ${normalizedStatus === 1 ? 'activated' : 'deactivated'} successfully`;
  sendSuccess(res, {}, message);
}));

/**
 * PATCH /ingredients/:id/stock
 * Update ingredient stock quantity
 */
router.patch('/:id/stock', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity_in_stock, operation = 'set' } = req.body;

  // Validate ID parameter
  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ success: false, message: idError });
  }

  if (quantity_in_stock === undefined || quantity_in_stock === null) {
    return res.status(400).json({ success: false, message: 'quantity_in_stock is required' });
  }

  // Get current stock quantity
  const existing = await getRecords(
    req.db,
    'SELECT ingredient_id, quantity_in_stock FROM ingredient WHERE ingredient_id = ?',
    [id]
  );

  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Ingredient not found' });
  }

  const currentQuantity = parseFloat(existing[0].quantity_in_stock);
  let newQuantity;

  switch (operation) {
    case 'add':
      newQuantity = currentQuantity + parseFloat(quantity_in_stock);
      break;
    case 'subtract':
      newQuantity = Math.max(0, currentQuantity - parseFloat(quantity_in_stock));
      break;
    case 'set':
    default:
      newQuantity = parseFloat(quantity_in_stock);
      break;
  }

  // Update stock quantity
  await req.db.execute('UPDATE ingredient SET quantity_in_stock = ? WHERE ingredient_id = ?', [newQuantity, id]);

  sendSuccess(res, {
    previous_quantity: currentQuantity,
    new_quantity: newQuantity
  }, 'Stock quantity updated successfully');
}));

/**
 * GET /ingredients/types/all
 * Get all ingredient types (DEPRECATED - use /ingredient-types/ instead)
 * Kept for backward compatibility with existing frontend code
 */
router.get('/types/all', asyncHandler(async (req, res) => {
  const types = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name,
      it.option_group,
      it.is_physical,
      ic.name as category_name
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    ORDER BY ic.name, it.name
  `);

  sendSuccess(res, { types });
}));

/**
 * GET /ingredients/categories/all
 * Get all ingredient categories (DEPRECATED - use /ingredient-categories/ instead)
 * Kept for backward compatibility with existing frontend code
 */
router.get('/categories/all', asyncHandler(async (req, res) => {
  const categories = await getRecords(req.db, `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      ic.type_id
    FROM ingredient_category ic
    ORDER BY ic.name
  `);

  sendSuccess(res, { categories });
}));

module.exports = router;