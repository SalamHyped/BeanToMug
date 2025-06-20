/**
 * Price Calculator Utility
 * Shared utility for calculating item prices with required and optional ingredients
 */

/**
 * Calculate total price for an item including customization options
 * 
 * This utility calculates the accurate price for a menu item by:
 * - Fetching the base item price from the database
 * - Automatically including required ingredients (no extra charge)
 * - Adding costs for selected optional customization options (ingredients)
 * - Validating all prices to ensure accuracy
 * - Handling edge cases and invalid data
 * 
 * Required ingredients are automatically included in the base price
 * and should not add extra cost. Only optional customizations add to the price.
 * 
 * @param {Object} connection - Database connection
 * @param {number} itemId - The menu item ID
 * @param {Object} options - Customization options with selected ingredients
 * @param {boolean} returnDetails - Whether to return detailed breakdown (default: false)
 * @returns {number|Object} Total price or detailed breakdown object
 * @throws {Error} If item not found or invalid prices detected
 */
async function calculateItemPriceWithOptions(connection, itemId, options = {}, returnDetails = false) {
  // Validate inputs
  if (!itemId || isNaN(itemId)) {
    throw new Error(`Invalid item ID: ${itemId}`);
  }

  // Get base item price from database
  const [dbItem] = await connection.execute(
    "SELECT price FROM dish WHERE item_id = ?",
    [itemId]
  );
  
  if (dbItem.length === 0) {
    throw new Error(`Item ${itemId} not found`);
  }
  
  let totalPrice = parseFloat(dbItem[0].price);
  
  // Validate base price
  if (isNaN(totalPrice) || totalPrice < 0) {
    console.error('Invalid base price from database:', {
      itemId,
      dbPrice: dbItem[0].price,
      parsedPrice: totalPrice
    });
    throw new Error(`Invalid base price for item ${itemId}`);
  }
  
  // Get all ingredients for this item (both required and optional)
  const [allIngredients] = await connection.execute(`
    SELECT 
      i.ingredient_id, 
      i.ingredient_name, 
      i.price, 
      i.quantity_in_stock, 
      i.status,
      i.unit,
      ic.name as category_name,
      i.type_id,
      it.name as type_name,
      it.option_group,
      it.is_physical,
      iot.is_required,
      iot.is_multiple,
      ii.quantity_required
    FROM ingredients_in_item ii
    JOIN ingredient i ON ii.ingredient_id = i.ingredient_id
    JOIN ingredient_category ic ON i.type_id = ic.type_id
    JOIN ingredient_type it ON i.type_id = it.id
    JOIN item_option_type iot ON iot.type_id = it.id AND iot.item_id = ?
    WHERE ii.item_id = ?
  `, [itemId, itemId]);
  
  const requiredIngredients = [];
  const optionalIngredients = [];
  let optionalPrice = 0;
  
  // Process all ingredients
  for (const ingredient of allIngredients) {
    if (ingredient.is_required) {
      // Required ingredients are automatically included (no extra charge)
      requiredIngredients.push({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        price: ingredient.price,
        quantity_required: ingredient.quantity_required,
        category: ingredient.category_name,
        is_required: true
      });
    } else {
      // Optional ingredients - check if selected by customer
      const isSelected = options[ingredient.ingredient_id] && options[ingredient.ingredient_id].selected;
      if (isSelected) {
        const optionPrice = parseFloat(ingredient.price);
        if (!isNaN(optionPrice) && optionPrice >= 0) {
          optionalPrice += optionPrice;
          optionalIngredients.push({
            ingredient_id: ingredient.ingredient_id,
            ingredient_name: ingredient.ingredient_name,
            price: ingredient.price,
            quantity_required: ingredient.quantity_required,
            category: ingredient.category_name,
            is_required: false
          });
        } else {
          console.warn('Invalid option price, skipping:', {
            ingredient_id: ingredient.ingredient_id,
            price: ingredient.price,
            parsedPrice: optionPrice
          });
        }
      }
    }
  }
  
  // Add optional ingredient costs to total
  totalPrice += optionalPrice;
  
  // Final validation of calculated total
  if (isNaN(totalPrice) || totalPrice < 0) {
    console.error('Invalid total price calculated:', {
      itemId,
      totalPrice,
      basePrice: parseFloat(dbItem[0].price),
      optionalPrice,
      options
    });
    throw new Error(`Invalid total price calculated for item ${itemId}`);
  }
  
  // Return based on returnDetails flag
  if (returnDetails) {
    return {
      totalPrice,
      basePrice: parseFloat(dbItem[0].price),
      optionalPrice,
      requiredIngredients,
      optionalIngredients,
      allIngredients: [...requiredIngredients, ...optionalIngredients]
    };
  } else {
    return totalPrice;
  }
}

module.exports = {
  calculateItemPriceWithOptions
}; 