const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { asyncHandler, handleError, sendSuccess, validateRequiredFields, getRecords, buildWhereClause } = require('../utils/routeHelpers');

// GET /ingredient-effects - Get all effects with filters
router.get('/', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { item_id, option_ingredient_id, target_ingredient_id } = req.query;
  
  const filters = {};
  if (item_id) filters.item_id = item_id;
  if (option_ingredient_id) filters.option_ingredient_id = option_ingredient_id;
  if (target_ingredient_id) filters.target_ingredient_id = target_ingredient_id;

  const filterMap = {
    item_id: (value) => ({ condition: 'ie.item_id = ?', params: [value] }),
    option_ingredient_id: (value) => ({ condition: 'ie.option_ingredient_id = ?', params: [value] }),
    target_ingredient_id: (value) => ({ condition: 'ie.target_ingredient_id = ?', params: [value] })
  };

  const { whereClause, queryParams } = buildWhereClause(filters, filterMap);

  const query = `
    SELECT 
      ie.*,
      d.item_name,
      oi.ingredient_name as option_ingredient_name,
      oit.name as option_type_name,
      ti.ingredient_name as target_ingredient_name,
      tit.name as target_type_name
    FROM ingredient_effects ie
    LEFT JOIN dish d ON ie.item_id = d.item_id
    LEFT JOIN ingredient oi ON ie.option_ingredient_id = oi.ingredient_id
    LEFT JOIN ingredient_type oit ON oi.type_id = oit.id
    LEFT JOIN ingredient ti ON ie.target_ingredient_id = ti.ingredient_id
    LEFT JOIN ingredient_type tit ON ti.type_id = tit.id
    ${whereClause}
    ORDER BY d.item_name, oi.ingredient_name, ti.ingredient_name
  `;

  const [effects] = await req.db.execute(query, queryParams);
  sendSuccess(res, { effects });
}));

// GET /ingredient-effects/options - Get available options for dropdowns
router.get('/options', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  // Get all dishes
  const [dishes] = await req.db.execute('SELECT item_id, item_name FROM dish ORDER BY item_name');
  
  // Get non-physical ingredients (options)
  const [optionIngredients] = await req.db.execute(`
    SELECT i.ingredient_id, i.ingredient_name, it.name as type_name
    FROM ingredient i
    JOIN ingredient_type it ON i.type_id = it.id
    WHERE it.is_physical = 0
    ORDER BY it.name, i.ingredient_name
  `);
  
  // Get physical ingredients (targets)
  const [targetIngredients] = await req.db.execute(`
    SELECT i.ingredient_id, i.ingredient_name, it.name as type_name
    FROM ingredient i
    JOIN ingredient_type it ON i.type_id = it.id
    WHERE it.is_physical = 1
    ORDER BY it.name, i.ingredient_name
  `);

  sendSuccess(res, {
    dishes,
    optionIngredients,
    targetIngredients
  });
}));

// POST /ingredient-effects - Create new effect
router.post('/', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { option_ingredient_id, target_ingredient_id, item_id, multiplier } = req.body;
  
  const requiredFields = ['option_ingredient_id', 'target_ingredient_id', 'item_id', 'multiplier'];
  const validationError = validateRequiredFields(req.body, requiredFields);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  // Validate multiplier is a positive number
  const mult = parseFloat(multiplier);
  if (isNaN(mult) || mult <= 0) {
    return res.status(400).json({ success: false, message: 'Multiplier must be a positive number' });
  }

  // Check if effect already exists
  const [existing] = await req.db.execute(
    'SELECT effect_id FROM ingredient_effects WHERE option_ingredient_id = ? AND target_ingredient_id = ? AND item_id = ?',
    [option_ingredient_id, target_ingredient_id, item_id]
  );
  
  if (existing.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Effect already exists for this combination'
    });
  }

  // Validate that option ingredient is non-physical
  const [optionCheck] = await req.db.execute(`
    SELECT it.is_physical
    FROM ingredient i
    JOIN ingredient_type it ON i.type_id = it.id
    WHERE i.ingredient_id = ?
  `, [option_ingredient_id]);
  
  if (optionCheck.length === 0 || optionCheck[0].is_physical !== 0) {
    return res.status(400).json({ success: false, message: 'Option ingredient must be non-physical' });
  }

  // Validate that target ingredient is physical
  const [targetCheck] = await req.db.execute(`
    SELECT it.is_physical
    FROM ingredient i
    JOIN ingredient_type it ON i.type_id = it.id
    WHERE i.ingredient_id = ?
  `, [target_ingredient_id]);
  
  if (targetCheck.length === 0 || targetCheck[0].is_physical !== 1) {
    return res.status(400).json({ success: false, message: 'Target ingredient must be physical' });
  }

  // Create the effect
  const [result] = await req.db.execute(
    'INSERT INTO ingredient_effects (option_ingredient_id, target_ingredient_id, item_id, multiplier) VALUES (?, ?, ?, ?)',
    [option_ingredient_id, target_ingredient_id, item_id, mult]
  );

  sendSuccess(res, { 
    effect_id: result.insertId,
    message: 'Ingredient effect created successfully' 
  });
}));

// PUT /ingredient-effects/:id - Update effect
router.put('/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { multiplier } = req.body;
  
  if (!multiplier) {
    return res.status(400).json({ success: false, message: 'Multiplier is required' });
  }

  const mult = parseFloat(multiplier);
  if (isNaN(mult) || mult <= 0) {
    return res.status(400).json({ success: false, message: 'Multiplier must be a positive number' });
  }

  const [result] = await req.db.execute(
    'UPDATE ingredient_effects SET multiplier = ? WHERE effect_id = ?',
    [mult, id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Effect not found' });
  }

  sendSuccess(res, { message: 'Effect updated successfully' });
}));

// DELETE /ingredient-effects/:id - Delete effect
router.delete('/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await req.db.execute(
    'DELETE FROM ingredient_effects WHERE effect_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Effect not found' });
  }

  sendSuccess(res, { message: 'Effect deleted successfully' });
}));

module.exports = router;
