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

// Constants for ingredient type routes
const INGREDIENT_TYPE_REQUIRED_FIELDS = ['name', 'option_group'];
const INGREDIENT_TYPE_SORT_FIELDS = ['name', 'option_group', 'is_physical'];

/**
 * GET /ingredient-types
 * Get all ingredient types with optional filtering
 */
router.get('/', asyncHandler(async (req, res) => {
  const { search, is_physical, sort_by = 'name', sort_order = 'asc' } = req.query;
  
  // Build WHERE clause for filtering
  const whereConditions = [];
  const queryParams = [];
  
  if (search) {
    whereConditions.push('(it.name LIKE ? OR it.option_group LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }
  
  if (is_physical !== undefined) {
    whereConditions.push('it.is_physical = ?');
    queryParams.push(is_physical === 'true' ? 1 : 0);
  }
  
  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';
  
  // Validate sort fields
  const validSortBy = INGREDIENT_TYPE_SORT_FIELDS.includes(sort_by) ? sort_by : 'name';
  const validSortOrder = ['asc', 'desc'].includes(sort_order?.toLowerCase()) ? sort_order : 'asc';
  
  const types = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name,
      it.option_group,
      it.is_physical,
      ic.id as category_id,
      ic.name as category_name,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    ${whereClause}
    GROUP BY it.id, ic.id
    ORDER BY it.${validSortBy} ${validSortOrder.toUpperCase()}
  `, queryParams);

  sendSuccess(res, { types });
}));

/**
 * GET /ingredient-types/:id
 * Get a specific ingredient type by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const typeId = validateId(req.params.id, 'type_id');
  
  const types = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name,
      it.option_group,
      it.is_physical,
      ic.id as category_id,
      ic.name as category_name,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    WHERE it.id = ?
    GROUP BY it.id, ic.id
  `, [typeId]);

  if (types.length === 0) {
    return handleError(res, 'Ingredient type not found', 404);
  }

  sendSuccess(res, { type: types[0] });
}));

/**
 * POST /ingredient-types
 * Create a new ingredient type
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, option_group, is_physical = true } = req.body;
  
  // Validate required fields
  validateRequiredFields(req.body, INGREDIENT_TYPE_REQUIRED_FIELDS);
  
  // Check if type name already exists in the same option group
  const existingTypes = await getRecords(req.db, `
    SELECT id FROM ingredient_type 
    WHERE name = ? AND option_group = ?
  `, [name, option_group]);
  
  if (existingTypes.length > 0) {
    return handleError(res, 'An ingredient type with this name already exists in this option group', 400);
  }
  
  // Insert new ingredient type
  const [result] = await req.db.execute(`
    INSERT INTO ingredient_type (name, option_group, is_physical)
    VALUES (?, ?, ?)
  `, [name, option_group, is_physical ? 1 : 0]);
  
  const newTypeId = result.insertId;
  
  // Get the created type with full details
  const types = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name,
      it.option_group,
      it.is_physical,
      ic.id as category_id,
      ic.name as category_name,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    WHERE it.id = ?
    GROUP BY it.id, ic.id
  `, [newTypeId]);
  
  sendSuccess(res, { 
    type: types[0],
    message: 'Ingredient type created successfully'
  }, 201);
}));

/**
 * PUT /ingredient-types/:id
 * Update an existing ingredient type
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const typeId = validateId(req.params.id, 'type_id');
  const { name, option_group, is_physical } = req.body;
  
  // Validate required fields
  validateRequiredFields(req.body, INGREDIENT_TYPE_REQUIRED_FIELDS);
  
  // Check if type exists
  await checkRecordExists(req.db, 'ingredient_type', 'id', typeId, 'Ingredient type not found');
  
  // Check if updated name conflicts with existing types (excluding current type)
  const existingTypes = await getRecords(req.db, `
    SELECT id FROM ingredient_type 
    WHERE name = ? AND option_group = ? AND id != ?
  `, [name, option_group, typeId]);
  
  if (existingTypes.length > 0) {
    return handleError(res, 'An ingredient type with this name already exists in this option group', 400);
  }
  
  // Update ingredient type
  await req.db.execute(`
    UPDATE ingredient_type 
    SET name = ?, option_group = ?, is_physical = ?
    WHERE id = ?
  `, [name, option_group, is_physical ? 1 : 0, typeId]);
  
  // Get updated type with full details
  const types = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name,
      it.option_group,
      it.is_physical,
      ic.id as category_id,
      ic.name as category_name,
      COUNT(i.ingredient_id) as ingredient_count
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    LEFT JOIN ingredient i ON i.type_id = it.id
    WHERE it.id = ?
    GROUP BY it.id, ic.id
  `, [typeId]);
  
  sendSuccess(res, { 
    type: types[0],
    message: 'Ingredient type updated successfully'
  });
}));

/**
 * DELETE /ingredient-types/:id
 * Delete an ingredient type (only if no ingredients are using it)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const typeId = validateId(req.params.id, 'type_id');
  
  // Check if type exists
  await checkRecordExists(req.db, 'ingredient_type', 'id', typeId, 'Ingredient type not found');
  
  // Check if any ingredients are using this type
  const ingredientsUsingType = await getRecords(req.db, `
    SELECT ingredient_id FROM ingredient WHERE type_id = ? LIMIT 1
  `, [typeId]);
  
  if (ingredientsUsingType.length > 0) {
    return handleError(res, 'Cannot delete ingredient type as it is being used by existing ingredients', 400);
  }
  
  // Check if any categories are linked to this type
  const categoriesUsingType = await getRecords(req.db, `
    SELECT id FROM ingredient_category WHERE type_id = ? LIMIT 1
  `, [typeId]);
  
  if (categoriesUsingType.length > 0) {
    return handleError(res, 'Cannot delete ingredient type as it is linked to existing categories', 400);
  }
  
  // ✅ NEW: Check if any dishes are using this type in their option types
  const dishesUsingType = await getRecords(req.db, `
    SELECT DISTINCT iot.item_id, d.item_name
    FROM item_option_type iot
    JOIN dish d ON iot.item_id = d.item_id
    WHERE iot.type_id = ?
    LIMIT 5
  `, [typeId]);
  
  if (dishesUsingType.length > 0) {
    const dishNames = dishesUsingType.map(dish => dish.item_name).join(', ');
    return handleError(res, `Cannot delete ingredient type as it is being used as an option type in dishes: ${dishNames}`, 400);
  }
  
  // Delete the ingredient type
  await req.db.execute('DELETE FROM ingredient_type WHERE id = ?', [typeId]);
  
  sendSuccess(res, { message: 'Ingredient type deleted successfully' });
}));

/**
 * GET /ingredient-types/:id/dependencies
 * Check what's preventing deletion of an ingredient type
 */
router.get('/:id/dependencies', asyncHandler(async (req, res) => {
  const typeId = validateId(req.params.id, 'type_id');
  
  // Check if type exists
  await checkRecordExists(req.db, 'ingredient_type', 'id', typeId, 'Ingredient type not found');
  
  const dependencies = [];
  
  // Check ingredients
  const ingredientsUsingType = await getRecords(req.db, `
    SELECT COUNT(*) as count FROM ingredient WHERE type_id = ?
  `, [typeId]);
  
  if (ingredientsUsingType[0].count > 0) {
    dependencies.push({
      type: 'ingredients',
      count: ingredientsUsingType[0].count,
      message: `${ingredientsUsingType[0].count} ingredients use this type`
    });
  }
  
  // Check categories
  const categoriesUsingType = await getRecords(req.db, `
    SELECT id, name FROM ingredient_category WHERE type_id = ?
  `, [typeId]);
  
  if (categoriesUsingType.length > 0) {
    dependencies.push({
      type: 'categories',
      count: categoriesUsingType.length,
      message: `Category "${categoriesUsingType[0].name}" is linked to this type`,
      details: categoriesUsingType
    });
  }
  
  // Check dishes
  const dishesUsingType = await getRecords(req.db, `
    SELECT DISTINCT iot.item_id, d.item_name
    FROM item_option_type iot
    JOIN dish d ON iot.item_id = d.item_id
    WHERE iot.type_id = ?
    LIMIT 10
  `, [typeId]);
  
  if (dishesUsingType.length > 0) {
    dependencies.push({
      type: 'dishes',
      count: dishesUsingType.length,
      message: `Used in ${dishesUsingType.length} dishes`,
      details: dishesUsingType
    });
  }

  sendSuccess(res, { 
    canDelete: dependencies.length === 0,
    dependencies 
  });
}));

/**
 * GET /ingredient-types/option-groups/all
 * Get all unique option groups
 */
router.get('/option-groups/all', asyncHandler(async (req, res) => {
  const optionGroups = await getRecords(req.db, `
    SELECT DISTINCT option_group as name, COUNT(*) as type_count
    FROM ingredient_type 
    GROUP BY option_group
    ORDER BY option_group
  `);

  sendSuccess(res, { optionGroups });
}));

module.exports = router;
