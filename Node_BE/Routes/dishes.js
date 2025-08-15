const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

// Ensure dish photos directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const dishPhotosDir = path.join(uploadsDir, 'dish-photos');

if (!fs.existsSync(dishPhotosDir)) {
    fs.mkdirSync(dishPhotosDir, { recursive: true });
}

// Configure multer for dish photo uploads
const dishPhotoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dishPhotosDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'dish-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for dish photos
const dishPhotoFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const extname = path.extname(file.originalname).toLowerCase();
    const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(file.mimetype);

    if (isImage) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for dish photos!'), false);
    }
};

const uploadDishPhoto = multer({
    storage: dishPhotoStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for dish photos
    },
    fileFilter: dishPhotoFilter
});

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
        `, [dishId, ing.ingredient_id, ing.quantity_required]);
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
 * POST /dishes/upload-photo
 * Upload a photo for a dish (Admin only)
 */
router.post('/upload-photo', authenticateToken, requireRole(['admin']), uploadDishPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
    }

    // Generate the URL path for the uploaded photo
    const photoUrl = `/uploads/dish-photos/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Dish photo uploaded successfully',
      data: {
        photo_url: photoUrl,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error uploading dish photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload dish photo',
      error: error.message
    });
  }
});

/**
 * PUT /dishes/:id/photo
 * Update photo URL for an existing dish (Admin only)
 */
router.put('/:id/photo', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { item_photo_url } = req.body;

    if (!item_photo_url) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL is required'
      });
    }

    const [result] = await req.db.execute(`
      UPDATE dish 
      SET item_photo_url = ?
      WHERE item_id = ?
    `, [item_photo_url, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    res.json({
      success: true,
      message: 'Dish photo updated successfully',
      data: {
        item_id: id,
        item_photo_url: item_photo_url
      }
    });

  } catch (error) {
    console.error('Error updating dish photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update dish photo',
      error: error.message
    });
  }
});

/**
 * DELETE /dishes/:id
 * Delete a dish and its ingredient relationships (Admin only)
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Start a transaction to ensure data consistency
    await req.db.beginTransaction();

    try {
      // 1. Delete ingredient relationships first
      await req.db.execute(`
        DELETE FROM ingredients_in_item 
        WHERE dish_id = ?
      `, [id]);

      // 2. Delete the dish
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

      res.json({
        success: true,
        message: 'Dish deleted successfully'
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

module.exports = router;

