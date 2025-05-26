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
    const [itemResult] = await req.db.query(
      "SELECT item_id, item_name, price, item_photo_url FROM dish WHERE item_id = ?",
      [id]
    );

    if (itemResult.length === 0) {
      return res.status(404).json({ error: "Item not found" });
      
    }

    const item = itemResult[0];

    const [optionResult] = await req.db.query(
      `SELECT \`key\`, type, label, values_json, price_json
       FROM dish_option
       WHERE item_id = ?`,
      [id]
    );
   

    const options = {};
    for (const row of optionResult) {
      options[row.key] = {
        label: row.label,
        type: row.type,
      };

      if (row.values_json) {
        options[row.key].values = JSON.parse(row.values_json);
      }

      if (row.price_json) {
        options[row.key].prices = JSON.parse(row.price_json);
      }
    }

    item.options = options;
  
    res.json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ error: err });
  }
});

module.exports = router;