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
const INGREDIENT_CATEGORY_REQUIRED_FIELDS = ['name']; // type_id or type_ids will be validated separately
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
 * GET /ingredient-categories/available-types
 * Get all ingredient types (now supports multiple categories per type)
 */
router.get('/available-types', asyncHandler(async (req, res) => {
  const availableTypes = await getRecords(req.db, `
    SELECT 
      it.id as type_id,
      it.name as type_name,
      it.option_group,
      it.is_physical,
      COUNT(ic.id) as category_count
    FROM ingredient_type it
    LEFT JOIN ingredient_category ic ON ic.type_id = it.id
    GROUP BY it.id, it.name, it.option_group, it.is_physical
    ORDER BY it.option_group, it.name
  `);

  sendSuccess(res, { availableTypes });
}));

/**
 * GET /ingredient-categories/:id
 * Get a specific ingredient category by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const categoryIdError = validateId(req.params.id);
  if (categoryIdError) {
    return handleError(res, categoryIdError, 400);
  }
  const categoryId = parseInt(req.params.id);
  
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
  const { name, type_id, type_ids } = req.body;
  
  // Support both single type_id and multiple type_ids
  const typeIds = type_ids ? (Array.isArray(type_ids) ? type_ids : [type_ids]) : [type_id];
  
  // Validate required fields (name is required, at least one type must be provided)
  if (!name || !name.trim()) {
    return handleError(res, 'Category name is required', 400);
  }
  
  if (!typeIds || typeIds.length === 0 || typeIds.some(id => !id)) {
    return handleError(res, 'At least one ingredient type is required', 400);
  }
  
  // Check if all ingredient types exist
  for (const currentTypeId of typeIds) {
    const typeExists = await checkRecordExists(req.db, 'ingredient_type', 'id', currentTypeId);
    if (!typeExists) {
      return handleError(res, `Ingredient type with ID ${currentTypeId} not found`, 404);
    }
  }
  
  // Check if category name already exists for any of these types
  const existingCategories = await getRecords(req.db, `
    SELECT type_id FROM ingredient_category 
    WHERE name = ? AND type_id IN (${typeIds.map(() => '?').join(',')})
  `, [name, ...typeIds]);
  
  if (existingCategories.length > 0) {
    const conflictingTypeIds = existingCategories.map(cat => cat.type_id);
    return handleError(res, `A category with this name already exists for type ID(s): ${conflictingTypeIds.join(', ')}`, 400);
  }
  
  // Insert multiple category records (one for each type)
  const createdCategories = [];
  
  for (const currentTypeId of typeIds) {
    const [result] = await req.db.execute(`
      INSERT INTO ingredient_category (name, type_id)
      VALUES (?, ?)
    `, [name.trim(), currentTypeId]);
    
    createdCategories.push(result.insertId);
  }
  
  // Get all created categories with full details
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
    WHERE ic.id IN (${createdCategories.map(() => '?').join(',')})
    GROUP BY ic.id, it.id
    ORDER BY it.option_group, it.name
  `, createdCategories);
  
  sendSuccess(res, { 
    categories: categories,
    category: categories[0], // For backward compatibility
    message: `Ingredient category created successfully with ${typeIds.length} type${typeIds.length > 1 ? 's' : ''}`
  }, 201);
}));

/**
 * PUT /ingredient-categories/:id
 * Update an existing ingredient category
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const categoryIdError = validateId(req.params.id);
  if (categoryIdError) {
    return handleError(res, categoryIdError, 400);
  }
  const categoryId = parseInt(req.params.id);
  const { name, type_id, type_ids } = req.body;
  
  // Support both single type_id and multiple type_ids for updates
  const typeIds = type_ids ? (Array.isArray(type_ids) ? type_ids : [type_ids]) : [type_id];
  
  // Validate required fields
  if (!name || !name.trim()) {
    return handleError(res, 'Category name is required', 400);
  }
  
  if (!typeIds || typeIds.length === 0 || typeIds.some(id => !id)) {
    return handleError(res, 'At least one ingredient type is required', 400);
  }
  
  // Check if category exists
  const categoryExists = await checkRecordExists(req.db, 'ingredient_category', 'id', categoryId);
  if (!categoryExists) {
    return handleError(res, 'Ingredient category not found', 404);
  }
  
  // For multiple types, we'll delete the current category and create new ones
  if (typeIds.length > 1) {
    // Get the current category name for comparison
    const currentCategory = await getRecords(req.db, `
      SELECT name FROM ingredient_category WHERE id = ?
    `, [categoryId]);
    
    // Delete the current category
    await req.db.execute('DELETE FROM ingredient_category WHERE id = ?', [categoryId]);
    
    // Create new categories for each type
    const createdCategories = [];
    for (const currentTypeId of typeIds) {
      const typeExists = await checkRecordExists(req.db, 'ingredient_type', 'id', currentTypeId);
      if (!typeExists) {
        return handleError(res, `Ingredient type with ID ${currentTypeId} not found`, 404);
      }
      
      const [result] = await req.db.execute(`
        INSERT INTO ingredient_category (name, type_id)
        VALUES (?, ?)
      `, [name.trim(), currentTypeId]);
      
      createdCategories.push(result.insertId);
    }
    
    // Get all created categories
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
      WHERE ic.id IN (${createdCategories.map(() => '?').join(',')})
      GROUP BY ic.id, it.id
      ORDER BY it.option_group, it.name
    `, createdCategories);
    
    return sendSuccess(res, { 
      categories: categories,
      category: categories[0], // For backward compatibility
      message: `Category updated and expanded to ${typeIds.length} types`
    });
  } else {
    // Single type update (original behavior)
    const typeId = typeIds[0];
    
    // Check if ingredient type exists
    const typeExists = await checkRecordExists(req.db, 'ingredient_type', 'id', typeId);
    if (!typeExists) {
      return handleError(res, 'Ingredient type not found', 404);
    }
    
    // Check if updated name conflicts with existing categories (excluding current category)
    const existingCategories = await getRecords(req.db, `
      SELECT id FROM ingredient_category 
      WHERE name = ? AND type_id = ? AND id != ?
    `, [name, typeId, categoryId]);
    
    if (existingCategories.length > 0) {
      return handleError(res, 'A category with this name already exists for this ingredient type', 400);
    }
    
    // Update ingredient category
    await req.db.execute(`
      UPDATE ingredient_category 
      SET name = ?, type_id = ?
      WHERE id = ?
    `, [name.trim(), typeId, categoryId]);
    
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
    
    return sendSuccess(res, { 
      category: categories[0],
      message: 'Ingredient category updated successfully'
    });
  }
}));

/**
 * DELETE /ingredient-categories/:id
 * Delete an ingredient category (only if no ingredients are using the related type)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const categoryIdError = validateId(req.params.id);
  if (categoryIdError) {
    return handleError(res, categoryIdError, 400);
  }
  const categoryId = parseInt(req.params.id);
  
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



module.exports = router;
