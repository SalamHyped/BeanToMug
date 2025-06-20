const express = require('express');
const dbSingleton = require('../dbSingleton');
const router = express.Router();

router.get('/', async (req, res) => { 
    try {
        if (!req.session.cart) {
           req.session.cart = {
            items: [],
            orderType: 'Dine In'
           };
        }
        const strQuery = 'SELECT * FROM category';
        const [results] = await req.db.query(strQuery);
       
        res.json(results);
    } catch (error) {
       console.error(error);
       res.status(500).json({ error: 'Internal server error' });
    }
});

// Move specific route before parameterized route
router.get("/items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Validate id parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    // Get item details with category information
    const [itemResult] = await req.db.query(
      `SELECT d.item_id, d.item_name, d.price, d.item_photo_url, d.status,
              c.category_name, c.category_photo_url
       FROM dish d
       LEFT JOIN category c ON d.category_id = c.category_id
       WHERE d.item_id = ?`,
      [id]
    );

    if (itemResult.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const item = itemResult[0];

    // Check if item is active
    if (!item.status) {
      return res.status(404).json({ error: "Item is not available" });
    }

    // Get all necessary data in one query
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

    // Create a map of type information
    const typeMap = allData.reduce((acc, row) => {
      if (!acc[row.type_id]) {
        acc[row.type_id] = {
          name: row.type_name,
          option_group: row.option_group,
          is_physical: row.is_physical,
          is_required: row.is_required,
          is_multiple: row.is_multiple,
          ingredients: []
        };
      }
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

    const options = {};
    const ingredients = [];

    // Process the data
    Object.entries(typeMap).forEach(([typeId, typeInfo]) => {
      const isPhysical = typeInfo.is_physical;
      
      // Filter available ingredients
      const availableIngredients = typeInfo.ingredients.filter(ing => 
        isPhysical ? (ing.quantity_in_stock > 0 && ing.status) : true
      );

      if (availableIngredients.length > 0) {
        // Add to options
        if (!options[availableIngredients[0].category]) {
          options[availableIngredients[0].category] = {
            types: []
          };
        }

        options[availableIngredients[0].category].types.push({
          placeholder: typeInfo.option_group,
          label: typeInfo.name,
          type: typeInfo.is_multiple ? 'select' : 'checkbox',
          required: typeInfo.is_required,
          values: availableIngredients.map(ing => ({
            id: ing.id,
            name: ing.name,
            price: ing.price,
            inStock: isPhysical ? (ing.quantity_in_stock > 0 && ing.status) : true
          }))
        });

        // Add to ingredients list
        ingredients.push(...availableIngredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity_required,
          category: ing.category,
          inStock: isPhysical ? (ing.quantity_in_stock > 0 && ing.status) : true
        })));
      }
    });

    // Combine all data
    const response = {
      ...item,
      options,
      ingredients,
      isAvailable: ingredients.every(ing => ing.inStock)
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

router.get('/:category', async (req, res) => {
  try {
    const categoryName = req.params.category;

    // Validate category parameter
    if (!categoryName || typeof categoryName !== 'string') {
      return res.status(400).json({ error: 'Invalid category parameter' });
    }

    // 1. Get category ID by name
    const [categoryResult] = await req.db.query(
      'SELECT category_id FROM category WHERE category_name = ?',
      [categoryName]
    );

    if (categoryResult.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryId = categoryResult[0].category_id;

    // 2. Get dishes by category_id
    const [dishesResult] = await req.db.query(
      'SELECT * FROM dish WHERE category_id = ?',
      [categoryId]
    );

    res.json(dishesResult);
  } catch (err) {
    console.error('Error fetching category or dishes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;