const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getDishDetails } = require('../services/dishService');
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
 * POST /dishes/categories
 * Create a new category (Admin only)
 */
router.post('/categories', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { category_name, category_photo_url } = req.body;
    
    // Validate required fields
    if (!category_name || !category_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    // Check if category name already exists
    const [existingCategories] = await req.db.execute(
      'SELECT category_id FROM category WHERE category_name = ?',
      [category_name.trim()]
    );
    
    if (existingCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    // Insert new category
    const [result] = await req.db.execute(`
      INSERT INTO category (category_name, category_photo_url)
      VALUES (?, ?)
    `, [category_name.trim(), category_photo_url || '']);
    
    // Get the newly created category
    const [newCategory] = await req.db.execute(`
      SELECT category_id, category_name, category_photo_url
      FROM category WHERE category_id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: newCategory[0]
    });
    
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

/**
 * PUT /dishes/categories/:categoryId
 * Update an existing category (Admin only)
 */
router.put('/categories/:categoryId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { category_name, category_photo_url } = req.body;
    
    // Validate required fields
    if (!category_name || !category_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    // Check if category exists
    const [existingCategory] = await req.db.execute(
      'SELECT category_id FROM category WHERE category_id = ?',
      [categoryId]
    );
    
    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if new name conflicts with existing categories (excluding current category)
    const [conflictingCategories] = await req.db.execute(
      'SELECT category_id FROM category WHERE category_name = ? AND category_id != ?',
      [category_name.trim(), categoryId]
    );
    
    if (conflictingCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    // Update category
    await req.db.execute(`
      UPDATE category 
      SET category_name = ?, category_photo_url = ?
      WHERE category_id = ?
    `, [category_name.trim(), category_photo_url || '', categoryId]);
    
    // Get the updated category
    const [updatedCategory] = await req.db.execute(`
      SELECT category_id, category_name, category_photo_url
      FROM category WHERE category_id = ?
    `, [categoryId]);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory[0]
    });
    
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

/**
 * DELETE /dishes/categories/:categoryId
 * Delete a category (Admin only)
 */
router.delete('/categories/:categoryId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Check if category exists
    const [existingCategory] = await req.db.execute(
      'SELECT category_id FROM category WHERE category_id = ?',
      [categoryId]
    );
    
    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if category has associated dishes
    const [associatedDishes] = await req.db.execute(
      'SELECT item_id FROM dish WHERE category_id = ? LIMIT 1',
      [categoryId]
    );
    
    if (associatedDishes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category: it has associated dishes. Please reassign or delete the dishes first.'
      });
    }
    
    // Delete category
    await req.db.execute('DELETE FROM category WHERE category_id = ?', [categoryId]);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

/**
 * GET /dishes/ingredients
 * Get all available ingredients and ingredient types for dish creation (Admin only)
 */
router.get('/ingredients', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get ingredients
    const [ingredients] = await req.db.execute(`
      SELECT 
        i.ingredient_id,
        i.ingredient_name,
        i.price,
        i.unit,
        i.status,
        it.name as type_name,
        it.id as type_id,
        ic.name as category_name
      FROM ingredient i
      LEFT JOIN ingredient_type it ON i.type_id = it.id
      LEFT JOIN ingredient_category ic ON ic.type_id = it.id
      WHERE i.status = 1
      ORDER BY ic.name, it.name, i.ingredient_name
    `);
    
    // Get ingredient types for dish options
    const [ingredientTypes] = await req.db.execute(`
      SELECT 
        it.id as type_id,
        it.name,
        it.option_group,
        it.is_physical,
        ic.name as category_name
      FROM ingredient_type it
      LEFT JOIN ingredient_category ic ON ic.type_id = it.id
      ORDER BY it.option_group, it.name
    `);
    
    // 1. Check if we got any results
    if (!ingredients || ingredients.length === 0) {
      console.log('No ingredients found in database');
      return res.json({
        success: true,
        groupedIngredients: {},
        ingredientTypes: ingredientTypes || []
      });
    }
    
    
    // 2. Validate data integrity - filter out invalid ingredients
    const validIngredients = ingredients.filter(ing => {
      const isValid = ing.ingredient_id && 
                     ing.ingredient_name && 
                     ing.type_name && 
                     ing.category_name;
      
      if (!isValid) {
        console.warn(`Invalid ingredient data found:`, {
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          type_name: ing.type_name,
          category_name: ing.category_name
        });
      }
      
      return isValid;
    });
    
    // 3. Log validation results
    if (validIngredients.length !== ingredients.length) {
      const invalidCount = ingredients.length - validIngredients.length;
      console.warn(`Found ${invalidCount} invalid ingredients out of ${ingredients.length} total`);
    }
    
    console.log(`Proceeding with ${validIngredients.length} valid ingredients`);
    
    // 4. Safe grouping with error handling
    let grouped;
    try {
      grouped = {};
      
      for (const ing of validIngredients) {
        const category = ing.category_name;
        const type = ing.type_name;
        
        // Initialize category if it doesn't exist
        if (!grouped[category]) {
          grouped[category] = {};
        }
        
        // Initialize type if it doesn't exist
        if (!grouped[category][type]) {
          grouped[category][type] = [];
        }
        
        // Add ingredient to the appropriate group
        grouped[category][type].push({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          price: ing.price,
          unit: ing.unit,
          status: ing.status,
          type_id: ing.type_id
        });
      }
      
      console.log(`Successfully grouped ingredients into ${Object.keys(grouped).length} categories`);
      
    } catch (groupingError) {
      console.error('Error during ingredient grouping:', groupingError);
      return res.status(500).json({
        success: false,
        message: 'Error processing ingredients data',
        error: groupingError.message
      });
    }
    
    res.json({
      success: true,
      groupedIngredients: grouped,
      ingredientTypes: ingredientTypes
    });
    
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ingredients',
      error: error.message
    });
  }
});

/**
 * GET /dishes/:id
 * Get a single dish with its ingredients and option types (Admin only)
 * Uses shared dishService to avoid duplication
 */
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Use shared service with admin view options
    const result = await getDishDetails(req.db, id, {
      adminView: true         // Get admin-friendly data structure
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      dish: result.dish
    });

  } catch (error) {
    console.error('Error fetching dish:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dish',
      error: error.message
    });
  }
});

/**
 * POST /dishes
 * Create a new dish with ingredients and option types (Admin only)
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      item_name, 
      price, 
      category_id, 
      item_photo_url = null,
      ingredients = [], // Array of {ingredient_id, quantity_required}
      optionTypes = [] // Array of {type_id, is_required, is_multiple}
    } = req.body;

    // 1. Create the dish
    const [dishResult] = await req.db.execute(`
      INSERT INTO dish (item_name, price, category_id, item_photo_url, status)
      VALUES (?, ?, ?, ?, ?)
    `, [item_name, price, category_id, item_photo_url, 1]);

    const dishId = dishResult.insertId;

    // 2. Add ingredients to the dish
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await req.db.execute(`
          INSERT INTO ingredients_in_item (item_id, ingredient_id, quantity_required)
          VALUES (?, ?, ?)
        `, [dishId, ing.ingredient_id || null, ing.quantity_required || null]);
      }
    }

    // 3. Add option types for the dish (what customers can choose)
    if (optionTypes && optionTypes.length > 0) {
      for (const option of optionTypes) {
        await req.db.execute(`
          INSERT INTO item_option_type (item_id, type_id, is_required, is_multiple)
          VALUES (?, ?, ?, ?)
        `, [dishId, option.type_id, option.is_required || 0, option.is_multiple || 0]);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Dish created successfully with options',
      dish_id: dishId
    });

  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create dish',
      error: error.message
    });
  }
});

/**
 * PUT /dishes/:id
 * Update an existing dish with ingredients and option types (Admin only)
 */
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      item_name, 
      price, 
      category_id, 
      item_photo_url = null,
      ingredients = [], // Array of {ingredient_id, quantity_required}
      optionTypes = [] // Array of {type_id, is_required, is_multiple}
    } = req.body;

    // Validate required fields
    if (!item_name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'item_name, price, and category_id are required'
      });
    }

    // Check if dish exists
    const [existingDish] = await req.db.execute(`
      SELECT item_id FROM dish WHERE item_id = ?
    `, [id]);

    if (existingDish.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    // Start transaction for data consistency
    await req.db.beginTransaction();

    try {
      // 1. Update the dish basic information
      await req.db.execute(`
        UPDATE dish 
        SET item_name = ?, price = ?, category_id = ?, item_photo_url = ?
        WHERE item_id = ?
      `, [item_name, price, category_id, item_photo_url, id]);

      // 2. Delete existing ingredient relationships
      await req.db.execute(`
        DELETE FROM ingredients_in_item WHERE item_id = ?
      `, [id]);

      // 3. Delete existing option type relationships
      await req.db.execute(`
        DELETE FROM item_option_type WHERE item_id = ?
      `, [id]);

      // 4. Add new ingredient relationships
      if (ingredients && ingredients.length > 0) {
        for (const ing of ingredients) {
          await req.db.execute(`
            INSERT INTO ingredients_in_item (item_id, ingredient_id, quantity_required)
            VALUES (?, ?, ?)
          `, [id, ing.ingredient_id || null, ing.quantity_required || null]);
        }
      }

      // 5. Add new option type relationships
      if (optionTypes && optionTypes.length > 0) {
        for (const option of optionTypes) {
          await req.db.execute(`
            INSERT INTO item_option_type (item_id, type_id, is_required, is_multiple)
            VALUES (?, ?, ?, ?)
          `, [id, option.type_id, option.is_required || 0, option.is_multiple || 0]);
        }
      }

      // Commit transaction
      await req.db.commit();

      res.json({
        success: true,
        message: 'Dish updated successfully'
      });

    } catch (error) {
      // Rollback on error
      await req.db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update dish',
      error: error.message
    });
  }
});

/**
 * PATCH /dishes/:id/status
 * Toggle dish status (activate/deactivate) (Admin only)
 */
router.patch('/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Status must be 0 (inactive) or 1 (active)'
      });
    }

    // Update dish status
    const [result] = await req.db.execute(`
      UPDATE dish 
      SET status = ?
      WHERE item_id = ?
    `, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    const statusText = status === 1 ? 'activated' : 'deactivated';
    
    res.json({
      success: true,
      message: `Dish ${statusText} successfully`,
      data: {
        item_id: id,
        status: status
      }
    });

  } catch (error) {
    console.error('Error updating dish status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update dish status',
      error: error.message
    });
  }
});

/**
 * DELETE /dishes/:id - DISABLED
 * This route has been disabled to prevent accidental data loss.
 * Use the PATCH /dishes/:id/status route to deactivate dishes instead.
 * 
 * If permanent deletion is absolutely necessary, it can be done via direct database access.
 */
/*
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the dish info to find the photo URL
    const [dishInfo] = await req.db.execute(`
      SELECT item_photo_url FROM dish WHERE item_id = ?
    `, [id]);

    if (dishInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    const photoUrl = dishInfo[0].item_photo_url;

    // Start a transaction to ensure data consistency
    await req.db.beginTransaction();

    try {
      // 1. Delete ingredient relationships first
      await req.db.execute(`
        DELETE FROM ingredients_in_item 
        WHERE dish_id = ?
      `, [id]);

      // 2. Delete option type relationships
      await req.db.execute(`
        DELETE FROM option_types_for_items 
        WHERE item_id = ?
      `, [id]);

      // 3. Delete the dish
      const [result] = await req.db.execute(`
        DELETE FROM dish 
        WHERE item_id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        await req.db.rollback();
        return res.status(404).json({
          success: false,
          message: 'Dish not found'
        });
      }

      // Commit the transaction
      await req.db.commit();

      // 4. Clean up photo file if it exists and is a local upload
      if (photoUrl && photoUrl.startsWith('/uploads/dish-photos/')) {
        try {
          const fs = require('fs');
          const path = require('path');
          const photoPath = path.join(__dirname, '..', photoUrl);
          
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
            console.log('🗑️ Deleted dish photo:', photoPath);
          }
        } catch (photoError) {
          console.error('Warning: Could not delete photo file:', photoError);
          // Don't fail the entire operation if photo deletion fails
        }
      }

      res.json({
        success: true,
        message: 'Dish and associated data deleted successfully'
      });

    } catch (error) {
      // Rollback on error
      await req.db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete dish',
      error: error.message
    });
  }
});
*/

module.exports = router;

