const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  handleError, sendSuccess, validateRequiredFields, validateId,
  checkRecordExists, getRecords, asyncHandler
} = require('../utils/routeHelpers');

// Apply authentication and role checking to all routes
router.use(authenticateToken, requireRole(['admin']));

// Constants for ingredient category routes
const INGREDIENT_CATEGORY_REQUIRED_FIELDS = ['name', 'type_id'];
const INGREDIENT_CATEGORY_SORT_FIELDS = ['name', 'type_name'];

/**
 * GET /ingredient-categories
 * Get all ingredient categories with optional filtering
 */
router.get('/', asyncHandler(async (req, res) => {
  const { search, type_id, sort_by = 'name', sort_order = 'asc' } = req.query;
  
  // Build WHERE clause for filtering
  const whereConditions = [];
  const queryParams = [];
  
  if (search) {
    whereConditions.push('(ic.name LIKE ? OR it.name LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }
  
  if (type_id) {
    whereConditions.push('ic.type_id = ?');
    queryParams.push(type_id);
  }
  
  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';
  
  // Validate sort fields
  const validSortBy = INGREDIENT_CATEGORY_SORT_FIELDS.includes(sort_by) ? sort_by : 'name';
  const validSortOrder = ['asc', 'desc'].includes(sort_order?.toLowerCase()) ? sort_order : 'asc';
  
  const categories = await getRecords(req.db, `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      ic.type_id,
      it.name as type_name,
      it.option_group as type_option_group,
      it.is_physical as type_is_physical,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_category ic
    LEFT JOIN ingredient_type it ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    ${whereClause}
    GROUP BY ic.id, it.id
    ORDER BY ${validSortBy === 'name' ? 'ic.name' : 'it.name'} ${validSortOrder.toUpperCase()}
  `, queryParams);

  sendSuccess(res, { categories });
}));

/**
 * GET /ingredient-categories/:id
 * Get a specific ingredient category by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const categoryId = validateId(req.params.id, 'category_id');
  
  const categories = await getRecords(req.db, `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      ic.type_id,
      it.name as type_name,
      it.option_group as type_option_group,
      it.is_physical as type_is_physical,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_category ic
    LEFT JOIN ingredient_type it ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    WHERE ic.id = ?
    GROUP BY ic.id, it.id
  `, [categoryId]);

  if (categories.length === 0) {
    return handleError(res, 'Ingredient category not found', 404);
  }

  sendSuccess(res, { category: categories[0] });
}));

/**
 * POST /ingredient-categories
 * Create a new ingredient category
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, type_id } = req.body;
  
  // Validate required fields
  validateRequiredFields(req.body, INGREDIENT_CATEGORY_REQUIRED_FIELDS);
  
  // Check if ingredient type exists
  await checkRecordExists(req.db, 'ingredient_type', 'id', type_id, 'Ingredient type not found');
  
  // Check if category name already exists for this type
  const existingCategories = await getRecords(req.db, `
    SELECT id FROM ingredient_category 
    WHERE name = ? AND type_id = ?
  `, [name, type_id]);
  
  if (existingCategories.length > 0) {
    return handleError(res, 'A category with this name already exists for this ingredient type', 400);
  }
  
  // Check if type already has a category (one-to-one relationship)
  const existingTypeCategories = await getRecords(req.db, `
    SELECT id FROM ingredient_category WHERE type_id = ?
  `, [type_id]);
  
  if (existingTypeCategories.length > 0) {
    return handleError(res, 'This ingredient type already has a category assigned', 400);
  }
  
  // Insert new ingredient category
  const [result] = await req.db.execute(`
    INSERT INTO ingredient_category (name, type_id)
    VALUES (?, ?)
  `, [name, type_id]);
  
  const newCategoryId = result.insertId;
  
  // Get the created category with full details
  const categories = await getRecords(req.db, `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      ic.type_id,
      it.name as type_name,
      it.option_group as type_option_group,
      it.is_physical as type_is_physical,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_category ic
    LEFT JOIN ingredient_type it ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    WHERE ic.id = ?
    GROUP BY ic.id, it.id
  `, [newCategoryId]);
  
  sendSuccess(res, { 
    category: categories[0],
    message: 'Ingredient category created successfully'
  }, 201);
}));

/**
 * PUT /ingredient-categories/:id
 * Update an existing ingredient category
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const categoryId = validateId(req.params.id, 'category_id');
  const { name, type_id } = req.body;
  
  // Validate required fields
  validateRequiredFields(req.body, INGREDIENT_CATEGORY_REQUIRED_FIELDS);
  
  // Check if category exists
  await checkRecordExists(req.db, 'ingredient_category', 'id', categoryId, 'Ingredient category not found');
  
  // Check if ingredient type exists
  await checkRecordExists(req.db, 'ingredient_type', 'id', type_id, 'Ingredient type not found');
  
  // Check if updated name conflicts with existing categories (excluding current category)
  const existingCategories = await getRecords(req.db, `
    SELECT id FROM ingredient_category 
    WHERE name = ? AND type_id = ? AND id != ?
  `, [name, type_id, categoryId]);
  
  if (existingCategories.length > 0) {
    return handleError(res, 'A category with this name already exists for this ingredient type', 400);
  }
  
  // Check if the new type already has a different category (unless it's the same category)
  const existingTypeCategories = await getRecords(req.db, `
    SELECT id FROM ingredient_category WHERE type_id = ? AND id != ?
  `, [type_id, categoryId]);
  
  if (existingTypeCategories.length > 0) {
    return handleError(res, 'This ingredient type already has a different category assigned', 400);
  }
  
  // Update ingredient category
  await req.db.execute(`
    UPDATE ingredient_category 
    SET name = ?, type_id = ?
    WHERE id = ?
  `, [name, type_id, categoryId]);
  
  // Get updated category with full details
  const categories = await getRecords(req.db, `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      ic.type_id,
      it.name as type_name,
      it.option_group as type_option_group,
      it.is_physical as type_is_physical,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_category ic
    LEFT JOIN ingredient_type it ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    WHERE ic.id = ?
    GROUP BY ic.id, it.id
  `, [categoryId]);
  
  sendSuccess(res, { 
    category: categories[0],
    message: 'Ingredient category updated successfully'
  });
}));

/**
 * DELETE /ingredient-categories/:id
 * Delete an ingredient category (only if no ingredients are using the related type)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const categoryId = validateId(req.params.id, 'category_id');
  
  // Check if category exists and get its type_id
  const categories = await getRecords(req.db, `
    SELECT type_id FROM ingredient_category WHERE id = ?
  `, [categoryId]);
  
  if (categories.length === 0) {
    return handleError(res, 'Ingredient category not found', 404);
  }
  
  const typeId = categories[0].type_id;
  
  // Check if any ingredients are using the related type
  const ingredientsUsingType = await getRecords(req.db, `
    SELECT ingredient_id FROM ingredient WHERE type_id = ? LIMIT 1
  `, [typeId]);
  
  if (ingredientsUsingType.length > 0) {
    return handleError(res, 'Cannot delete category as ingredients are using the related ingredient type', 400);
  }
  
  // Delete the ingredient category
  await req.db.execute('DELETE FROM ingredient_category WHERE id = ?', [categoryId]);
  
  sendSuccess(res, { message: 'Ingredient category deleted successfully' });
}));

/**
 * GET /ingredient-categories/available-types
 * Get ingredient types that don't have categories assigned yet
 */
router.get('/available-types', asyncHandler(async (req, res) => {
  const availableTypes = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name as type_name,
      it.option_group,
      it.is_physical
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    WHERE ic.id IS NULL
    ORDER BY it.option_group, it.name
  `);

  sendSuccess(res, { availableTypes });
}));

module.exports = router;
