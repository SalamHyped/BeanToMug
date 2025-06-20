const express = require('express');
const dbSingleton = require('../dbSingleton');
const router = express.Router();

/**
 * GET /menu
 * Retrieves all menu categories and initializes cart session if needed
 * 
 * This endpoint serves as the main menu entry point:
 * - Initializes an empty cart in the session if it doesn't exist
 * - Fetches all categories from the database
 * - Returns categories for display in the menu interface
 */
router.get('/', async (req, res) => { 
    try {
        // Initialize cart session if it doesn't exist
        // This ensures every user has a cart object in their session
        if (!req.session.cart) {
           req.session.cart = {
            items: [],
            orderType: 'Dine In'  // Default order type
           };
        }
        
        // Query to fetch all categories from the database
        const strQuery = 'SELECT * FROM category';
        const [results] = await req.db.query(strQuery);
       
        // Return all categories as JSON response
        res.json(results);
    } catch (error) {
       console.error(error);
       res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /menu/items/:id
 * Retrieves detailed information about a specific menu item
 * 
 * This endpoint provides comprehensive item details including:
 * - Basic item information (name, price, photo, status)
 * - Category information
 * - Available customization options and ingredients
 * - Stock availability for physical ingredients
 * - Item availability status based on ingredient stock
 * 
 * @param {string} id - The item ID from the URL parameter
 */
router.get("/items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Validate that the ID parameter exists and is a valid number
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    // Query 1: Get basic item details with category information
    // Joins dish table with category table to get category details
    const [itemResult] = await req.db.query(
      `SELECT d.item_id, d.item_name, d.price, d.item_photo_url, d.status,
              c.category_name, c.category_photo_url
       FROM dish d
       LEFT JOIN category c ON d.category_id = c.category_id
       WHERE d.item_id = ?`,
      [id]
    );

    // Check if the item exists in the database
    if (itemResult.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const item = itemResult[0];

    // Check if the item is active/available for ordering
    if (!item.status) {
      return res.status(404).json({ error: "Item is not available" });
    }

    // Query 2: Get all ingredient and customization data in a single complex query
    // This query joins multiple tables to get complete ingredient information:
    // - ingredients_in_item: Links items to their required ingredients
    // - ingredient: Basic ingredient information (name, price, stock, etc.)
    // - ingredient_category: Categorizes ingredients (e.g., "Milk", "Syrups")
    // - ingredient_type: Defines ingredient types (e.g., "Milk Type", "Size")
    // - item_option_type: Defines how ingredients are presented as options
    const [allData] = await req.db.query(
      `SELECT 
        i.ingredient_id, i.ingredient_name, i.price, i.quantity_in_stock, i.status,
        i.unit, ic.name as category_name, i.type_id,
        it.name as type_name, it.option_group, it.is_physical,
        iot.is_required, iot.is_multiple, ii.quantity_required
       FROM ingredients_in_item ii
       JOIN ingredient i ON ii.ingredient_id = i.ingredient_id
       JOIN ingredient_category ic ON i.type_id = ic.type_id
       JOIN ingredient_type it ON i.type_id = it.id
       JOIN item_option_type iot ON iot.type_id = it.id AND iot.item_id = ?
       WHERE ii.item_id = ?`,
      [id, id]
    );

    // Process the raw data into a structured format
    // Group ingredients by their type (e.g., all milk options together)
    const typeMap = allData.reduce((acc, row) => {
      if (!acc[row.type_id]) {
        acc[row.type_id] = {
          name: row.type_name,           // e.g., "Milk Type"
          option_group: row.option_group, // e.g., "Choose your milk"
          is_physical: row.is_physical,   // Whether this ingredient has physical stock
          is_required: row.is_required,   // Whether this option is mandatory
          is_multiple: row.is_multiple,   // Whether multiple selections are allowed
          ingredients: []
        };
      }
      
      // Add ingredient details to the type group
      acc[row.type_id].ingredients.push({
        id: row.ingredient_id,
        name: row.ingredient_name,
        price: row.price,
        quantity_in_stock: row.quantity_in_stock,
        status: row.status,
        unit: row.unit,
        category: row.category_name,
        quantity_required: row.quantity_required
      });
      return acc;
    }, {});

    const options = {};      // For frontend customization options
    const ingredients = [];  // For ingredient list display

    // Process each ingredient type and create frontend-friendly data structures
    Object.entries(typeMap).forEach(([typeId, typeInfo]) => {
      const isPhysical = typeInfo.is_physical;
      
      // Filter ingredients based on availability
      // For physical ingredients: check stock and status
      // For non-physical ingredients (like "No ice"): always available
      const availableIngredients = typeInfo.ingredients.filter(ing => 
        isPhysical ? (ing.quantity_in_stock > 0 && ing.status) : true
      );

      // Only add options if there are available ingredients
      if (availableIngredients.length > 0) {
        // Group options by ingredient category (e.g., "Milk", "Syrups")
        if (!options[availableIngredients[0].category]) {
          options[availableIngredients[0].category] = {
            types: []
          };
        }

        // Add option type to the category
        options[availableIngredients[0].category].types.push({
          placeholder: typeInfo.option_group,  // Display text for the option group
          label: typeInfo.name,                // Option type name
          type: typeInfo.is_multiple ? 'select' : 'checkbox', // UI control type
          required: typeInfo.is_required,      // Whether selection is mandatory
          values: availableIngredients.map(ing => ({
            id: ing.id,
            name: ing.name,
            price: ing.price,
            inStock: isPhysical ? (ing.quantity_in_stock > 0 && ing.status) : true
          }))
        });

        // Add ingredients to the ingredients list for display
        ingredients.push(...availableIngredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity_required,
          category: ing.category,
          inStock: isPhysical ? (ing.quantity_in_stock > 0 && ing.status) : true
        })));
      }
    });

    // Determine overall item availability
    // Item is available only if ALL required ingredients are in stock
    const isAvailable = ingredients.every(ing => ing.inStock);

    // Combine all data into the final response
    const response = {
      ...item,           // Basic item details
      options,           // Customization options for frontend
      ingredients,       // Ingredient list
      isAvailable        // Overall availability status
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /menu/:category
 * Retrieves all dishes/items within a specific category
 * 
 * This endpoint allows filtering menu items by category:
 * - Validates the category parameter
 * - Looks up the category ID by name
 * - Returns all dishes belonging to that category
 * 
 * @param {string} category - The category name from the URL parameter
 */
router.get('/:category', async (req, res) => {
  try {
    const categoryName = req.params.category;

    // Validate that the category parameter is provided and is a string
    if (!categoryName || typeof categoryName !== 'string') {
      return res.status(400).json({ error: 'Invalid category parameter' });
    }

    // Step 1: Get the category ID by looking up the category name
    // This converts the human-readable category name to the database ID
    const [categoryResult] = await req.db.query(
      'SELECT category_id FROM category WHERE category_name = ?',
      [categoryName]
    );

    // Check if the category exists
    if (categoryResult.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryId = categoryResult[0].category_id;

    // Step 2: Get all dishes that belong to this category
    // Returns all items in the specified category
    const [dishesResult] = await req.db.query(
      'SELECT * FROM dish WHERE category_id = ?',
      [categoryId]
    );

    // Return the list of dishes in the category
    res.json(dishesResult);
  } catch (err) {
    console.error('Error fetching category or dishes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;