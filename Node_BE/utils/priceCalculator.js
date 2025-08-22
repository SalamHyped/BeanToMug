/**
 * Price Calculator Utility
 * Shared utility for calculating item prices with required and optional ingredients
 * Now includes VAT calculations
 */

/**
 * Get current VAT rate from database
 * @param {Object} connection - Database connection
 * @returns {number} Current VAT rate as percentage
 */
async function getVATRate(connection) {
  try {
    const [vatConfig] = await connection.execute(
      "SELECT vat_rate FROM vat_config ORDER BY id DESC LIMIT 1"
    );
    
    if (vatConfig.length === 0) {
      console.warn('No VAT rate found, using default 15%');
      return 15.00;
    }
    
    return parseFloat(vatConfig[0].vat_rate) || 15.00;
  } catch (error) {
    console.error('Error fetching VAT rate:', error);
    return 15.00; // Default fallback
  }
}

/**
 * Calculate VAT amount for a given subtotal
 * @param {number} subtotal - Price before VAT
 * @param {number} vatRate - VAT rate as percentage
 * @returns {number} VAT amount
 */
function calculateVATAmount(subtotal, vatRate) {
  return (subtotal * vatRate) / 100;
}

/**
 * Calculate VAT breakdown for an entire order
 * @param {Object} connection - Database connection
 * @param {number} subtotal - Order subtotal before VAT
 * @param {number} vatRate - Optional VAT rate (avoids DB call if provided)
 * @returns {Object} VAT breakdown with subtotal, vatAmount, vatRate, and totalWithVAT
 */
async function calculateOrderVAT(connection, subtotal, vatRate = null) {
  try {
    // Use provided VAT rate or fetch from DB
    const rate = vatRate !== null ? vatRate : await getVATRate(connection);
    const vatAmount = calculateVATAmount(subtotal, rate);
    const totalWithVAT = subtotal + vatAmount;

    return {
      subtotal: subtotal,
      vatAmount: vatAmount,
      vatRate: rate,
      totalWithVAT: totalWithVAT
    };
  } catch (error) {
    console.error('Error calculating order VAT:', error);
    return {
      subtotal: subtotal,
      vatAmount: 0,
      vatRate: 0,
      totalWithVAT: subtotal
    };
  }
}

/**
 * Calculate prices for multiple items efficiently
 * @param {Object} connection - Database connection
 * @param {Array} items - Array of items with itemId and options
 * @param {boolean} includeVAT - Whether to include VAT
 * @returns {Object} Total breakdown with individual items and order totals
 */
async function calculateMultipleItemsPrices(connection, items, includeVAT = true) {
  try {
    // Get VAT rate once for all items
    const vatRate = includeVAT ? await getVATRate(connection) : 0;
    
    let orderSubtotal = 0;
    const itemBreakdowns = [];

    // Calculate each item's price
    for (const item of items) {
      const itemDetails = await calculateItemPriceWithOptions(
        connection, 
        item.itemId, 
        item.options || {}, 
        true, // returnDetails
        false // don't include VAT here, we'll do it at order level
      );

      const itemTotal = itemDetails.subtotal * (item.quantity || 1);
      orderSubtotal += itemTotal;

      itemBreakdowns.push({
        ...itemDetails,
        quantity: item.quantity || 1,
        itemTotal: itemTotal
      });
    }

    // Calculate VAT at order level (more efficient)
    const vatBreakdown = includeVAT ? 
      await calculateOrderVAT(connection, orderSubtotal, vatRate) :
      { subtotal: orderSubtotal, vatAmount: 0, vatRate: 0, totalWithVAT: orderSubtotal };

    return {
      items: itemBreakdowns,
      orderBreakdown: vatBreakdown
    };
  } catch (error) {
    console.error('Error calculating multiple items prices:', error);
    throw error;
  }
}

/**
 * Calculate total price for an item including customization options and VAT
 * 
 * This utility calculates the accurate price for a menu item by:
 * - Fetching the base item price from the database
 * - Automatically including required ingredients (no extra charge)
 * - Adding costs for selected optional customization options (ingredients)
 * - Calculating VAT on the subtotal
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
 * @param {boolean} includeVAT - Whether to include VAT in calculations (default: true)
 * @returns {number|Object} Total price or detailed breakdown object
 * @throws {Error} If item not found or invalid prices detected
 */
async function calculateItemPriceWithOptions(connection, itemId, options = {}, returnDetails = false, includeVAT = true) {

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
      // Required ingredients - check if they have a price
      const ingredientPrice = parseFloat(ingredient.price);
      const isSelected = options[ingredient.ingredient_id] && options[ingredient.ingredient_id].selected;
      
      // Required ingredients are automatically included
      requiredIngredients.push({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        price: ingredient.price,
        quantity_required: ingredient.quantity_required,
        category: ingredient.category_name,
        is_required: true
      });
      
      // If required ingredient has a price AND is selected, add to total
      if (isSelected && !isNaN(ingredientPrice) && ingredientPrice > 0) {
        optionalPrice += ingredientPrice;
      }
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
  
  // Final validation of calculated subtotal
  if (isNaN(totalPrice) || totalPrice < 0) {
    console.error('Invalid subtotal calculated:', {
      itemId,
      totalPrice,
      basePrice: parseFloat(dbItem[0].price),
      optionalPrice,
      options
    });
    throw new Error(`Invalid subtotal calculated for item ${itemId}`);
  }

  // Calculate VAT if requested
  let vatAmount = 0;
  let vatRate = 0;
  let finalTotal = totalPrice;

  if (includeVAT) {
    try {
      vatRate = await getVATRate(connection);
      vatAmount = calculateVATAmount(totalPrice, vatRate);
      finalTotal = totalPrice + vatAmount;
    } catch (error) {
      console.error('Error calculating VAT:', error);
      // Continue without VAT if there's an error
      vatAmount = 0;
      vatRate = 0;
      finalTotal = totalPrice;
    }
  }
  
  // Return based on returnDetails flag
  if (returnDetails) {
    return {
      subtotal: totalPrice,
      vatAmount: vatAmount,
      vatRate: vatRate,
      totalWithVAT: finalTotal,
      basePrice: parseFloat(dbItem[0].price),
      optionalPrice: optionalPrice,
      requiredIngredients,
      optionalIngredients,
      allIngredients: [...requiredIngredients, ...optionalIngredients]
    };
  } else {
    return finalTotal;
  }
}

module.exports = {
  calculateItemPriceWithOptions,
  getVATRate,
  calculateVATAmount,
  calculateOrderVAT,
  calculateMultipleItemsPrices
}; 