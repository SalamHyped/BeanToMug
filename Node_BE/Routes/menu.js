const express = require('express');
const dbSingleton = require('../dbSingleton');
const router = express.Router();


router.get('/',async (req, res) => { 
    try{
        if (!req.session.cart) {
    
    req.session.cart = [];
    
  }
    const strQuery = 'SELECT * FROM category';
    const[results]=await req.db.query(strQuery)
       
        res.json(results);
    
}
    catch (error) {
       console.log(error); // Pass the error to the error handling middleware
       res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:category', async (req, res) => {
  try {
    const categoryName = req.params.category;

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






router.get("/items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get item details with category information
    const [itemResult] = await req.db.query(
      `SELECT d.item_id, d.item_name, d.price, d.item_photo_url, d.status, d.item_type,
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

    // Get item options based on ingredient types
    const [optionTypesResult] = await req.db.query(
      `SELECT iot.type_id, iot.is_required, iot.is_multiple,
              it.name as type_name, it.option_group
       FROM item_option_type iot
       JOIN ingredient_type it ON iot.type_id = it.id
       WHERE iot.item_id = ?`,
      [id]
    );


    const options = {};
    
    // For each option type, get the available ingredients
    optionTypesResult.forEach(async (optionType) => {
     
      const [ingredientsResult] = await req.db.query(
        `SELECT i.ingredient_id, i.ingredient_name, i.price, i.quantity_in_stock, i.status,
                ic.name as category_name
         FROM ingredients_in_item iii
         JOIN ingredient i ON iii.ingredient_id = i.ingredient_id
         JOIN ingredient_category ic ON i.type_id = ic.type_id
         WHERE iii.item_id = ? AND i.type_id = ?`,
        [id, optionType.type_id]
      );
      
      // Filter out ingredients that are out of stock or inactive
      const availableIngredients = ingredientsResult.filter(ing => 
        ing.quantity_in_stock > 0 && ing.status
      );
   
      if (availableIngredients.length > 0) {
        // Initialize the option group if it doesn't exist
        if (!options[availableIngredients[0].category_name]) {
          options[availableIngredients[0].category_name] = {
            types: []
          };
        }
        
        // Add the type to the option group
        options[availableIngredients[0].category_name].types.push({
          placeholder: optionType.group_name,
          label: optionType.type_name,
          type: optionType.is_multiple ? 'select': 'checkbox',
          required: optionType.is_required,
          values: availableIngredients.map(ing => ({
            id: ing.ingredient_id,
            name: ing.ingredient_name,
            price: ing.price,
            inStock: ing.quantity_in_stock > 0 && ing.status
          })),
          prices: availableIngredients.reduce((acc, ing) => {
            acc[ing.ingredient_id] = ing.price;
            return acc;
          }, {})
        });
      }
    });
    // Get all ingredients for the item
    const [ingredientsResult] = await req.db.query(
      `SELECT i.ingredient_name, i.quantity_in_stock, i.status,
              ii.quantity_required, ic.name as category_name
       FROM ingredients_in_item ii
       JOIN ingredient i ON ii.ingredient_id = i.ingredient_id
       JOIN ingredient_category ic ON i.type_id = ic.type_id
       WHERE ii.item_id = ?`,
      [id]
    );

    const ingredients = ingredientsResult.map(ing => ({
      name: ing.ingredient_name,
      quantity: ing.quantity_required,
      category: ing.category_name,
      inStock: ing.quantity_in_stock > 0 && ing.status
    }));

    




    // Combine all data
    const response = {
      ...item,
      options,
      ingredients,
      isAvailable: ingredients.every(ing => ing.inStock)
    };
    console.log(response);

    res.json(response);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;