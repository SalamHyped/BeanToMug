const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

/**
 * GET /dishes
 * Get all dishes with category information (Admin only)
 */
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('Fetching dishes...');
    
    const [dishes] = await req.db.execute(`
      SELECT 
        d.item_id,
        d.item_name,
        d.status,
        d.price,
        d.category_id,
        d.item_photo_url,
        c.category_name
      FROM dish d
      LEFT JOIN category c ON d.category_id = c.category_id
      ORDER BY d.item_id DESC
    `);

    console.log(`Found ${dishes.length} dishes`);
    
    res.json({
      success: true,
      dishes: dishes
    });

  } catch (error) {
    console.error('Error fetching dishes:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error Code:', error.errno);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dishes',
      details: error.message,
      sqlState: error.sqlState,
      errno: error.errno
    });
  }
});

/**
 * GET /dishes/categories
 * Get all available categories for dishes (Admin only)
 */
router.get('/categories', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [categories] = await req.db.execute(`
      SELECT category_id, category_name, category_photo_url
      FROM category
      ORDER BY category_name
    `);

    res.json({
      success: true,
      categories: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
});

/**
 * GET /dishes/ingredients
 * Get all available ingredients for dish creation (Admin only)
 */
router.get('/ingredients', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [ingredients] = await req.db.execute(`
      SELECT 
        i.ingredient_id,
        i.ingredient_name,
        i.price,
        i.unit,
        i.status,
        it.name as type_name,
        it.option_group,
        it.is_physical,
        ic.name as category_name
      FROM ingredient i
      LEFT JOIN ingredient_type it ON i.type_id = it.id
      LEFT JOIN ingredient_category ic ON it.id = ic.type_id
      WHERE i.status = 1
      ORDER BY ic.name, i.ingredient_name
    `);
    
    res.json({
      success: true,
      ingredients: ingredients
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ingredients' 
    });
  }
});

/**
 * POST /dishes
 * Create a new dish with ingredients (Admin only)
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      item_name, 
      price, 
      category_id, 
      item_type = 'drink',
      item_photo_url = null,
      ingredients = [] // Array of {ingredient_id, quantity_required}
    } = req.body;

    // 1. Create the dish
    const [dishResult] = await req.db.execute(`
      INSERT INTO dish (item_name, price, category_id, item_type, item_photo_url, status)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [item_name, price, category_id, item_type, item_photo_url]);

    const dishId = dishResult.insertId;

    // 2. Add ingredients to the dish
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await req.db.execute(`
          INSERT INTO ingredients_in_item (dish_id, ingredient_id, quantity_required)
          VALUES (?, ?, ?)
        `, [dishId, ing.ingredient_id, ing.quantity_required]);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      dish_id: dishId
    });

  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create dish' 
    });
  }
});

module.exports = router;

