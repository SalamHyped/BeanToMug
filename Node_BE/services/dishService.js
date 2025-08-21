/**
 * Dish Service - Centralized dish data retrieval functions
 * 
 * This service provides reusable functions for fetching dish information
 * to avoid duplication across different routes (menu, dishes, cart)
 * Uses existing cartService functions where appropriate
 */

const { getAvailableIngredients } = require('./cartService');
const { calculateItemPriceWithOptions } = require('../utils/priceCalculator');

/**
 * Get detailed dish information with ingredients and options
 * Leverages existing getAvailableIngredients function to avoid duplication
 * 
 * @param {Object} db - Database connection
 * @param {number} dishId - The dish ID
 * @param {Object} options - Configuration options
 * @param {boolean} options.adminView - Whether this is for admin view (includes all data)
 * @returns {Object} Dish details with ingredients and options
 */
async function getDishDetails(db, dishId, options = {}) {
  const { adminView = false } = options;

  try {
    // Get basic dish information
    const [dishes] = await db.execute(`
      SELECT 
        d.item_id,
        d.item_name,
        d.status,
        d.price,
        d.category_id,
        d.item_photo_url,
        c.category_name,
        c.category_photo_url
      FROM dish d
      LEFT JOIN category c ON d.category_id = c.category_id
      WHERE d.item_id = ?
    `, [dishId]);

    if (dishes.length === 0) {
      return { success: false, error: 'Dish not found' };
    }

    const dish = dishes[0];

    // For public menu, check if dish is active
    if (!adminView && !dish.status) {
      return { success: false, error: 'Dish is not available' };
    }

    if (adminView) {
      // Admin view: Get ingredients with edit-friendly data structure
      const [ingredients] = await db.execute(`
        SELECT 
          iii.ingredient_id,
          iii.quantity_required,
          i.ingredient_name,
          i.type_id,
          it.name as type_name,
          ic.name as category_name,
          i.price,
          i.unit,
          i.status
        FROM ingredients_in_item iii
        JOIN ingredient i ON iii.ingredient_id = i.ingredient_id
        LEFT JOIN ingredient_type it ON i.type_id = it.id
        LEFT JOIN ingredient_category ic ON i.type_id = ic.type_id
        WHERE iii.item_id = ?
        ORDER BY it.name, i.ingredient_name
      `, [dishId]);

      // Get dish option types
      const [optionTypes] = await db.execute(`
        SELECT 
          iot.type_id,
          iot.is_required,
          iot.is_multiple,
          it.name as type_name,
          it.option_group
        FROM item_option_type iot
        JOIN ingredient_type it ON iot.type_id = it.id
        WHERE iot.item_id = ?
        ORDER BY it.option_group, it.name
      `, [dishId]);

      return { 
        success: true, 
        dish: { ...dish, ingredients, optionTypes }
      };
    } else {
      // Public view: Use existing cart service function
      const availableIngredients = await getAvailableIngredients(dishId);
      
      // Transform to match the EXACT old menu structure
      const options = {};      // For frontend customization options
      const ingredients = [];  // For ingredient list display

      availableIngredients.forEach(group => {
        const isPhysical = group.isPhysical;
        
        // Filter ingredients based on availability for options (customization controls)
        const availableIngs = group.ingredients.filter(ing => 
          isPhysical ? (ing.stock > 0 && ing.status) : true
        );

        // Add ALL ingredients to the ingredients list (including unavailable ones)
        ingredients.push(...group.ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantityRequired,
          category: group.category,
          inStock: isPhysical ? (ing.stock > 0 && ing.status) : true,
          isRequired: group.required  // Add required flag for availability checking
        })));

        // Only add options if there are available ingredients for customization
        if (availableIngs.length > 0) {
          // Group options by ingredient category (e.g., "Milk", "Syrups")
          if (!options[group.category]) {
            options[group.category] = {
              types: []
            };
          }

          // Add option type to the category
          options[group.category].types.push({
            placeholder: group.group,     // Display text for the option group
            label: group.label,           // Option type name
            type: group.label.toLowerCase().includes('size') ? 'radio' : 
                  (group.isMultiple ? 'checkbox' : 'select'), // UI control type
            required: group.required,     // Whether selection is mandatory
            values: availableIngs.map(ing => ({
              id: ing.id,
              name: ing.name,
              price: ing.price,
              inStock: isPhysical ? (ing.stock > 0 && ing.status) : true
            }))
          });
        }
      });

      // Calculate availability using the EXACT old logic
      const itemActive = dish.status === 1;
      
      const requiredIngredientsAvailable = ingredients
        .filter(ing => ing.isRequired)
        .every(ing => {
          // If it's a required ingredient type, at least one option should be available
          const sameTypeIngredients = ingredients.filter(other => 
            other.category === ing.category && other.isRequired
          );
          return sameTypeIngredients.some(other => other.inStock);
        });
      
      const isAvailable = itemActive && requiredIngredientsAvailable;

      // Calculate VAT-inclusive price with no options (base price + VAT)
      let priceWithVAT = dish.price;
      try {
        priceWithVAT = await calculateItemPriceWithOptions(
          db, 
          dishId, 
          {}, // No options for base price
          false, // Don't need details
          true   // Include VAT
        );
      } catch (error) {
        console.warn(`Failed to calculate VAT price for dish ${dishId}:`, error);
        // Fallback: calculate VAT manually with 15% rate
        priceWithVAT = dish.price * 1.15;
      }

      return { 
        success: true, 
        dish: { 
          ...dish, 
          priceWithVAT,      // VAT-inclusive base price
          options,           // Customization options for frontend
          ingredients,       // Ingredient list
          isAvailable        // Overall availability status
        }
      };
    }

  } catch (error) {
    console.error('Error in getDishDetails:', error);
    return { 
      success: false, 
      error: 'Failed to fetch dish details',
      details: error.message 
    };
  }
}

/**
 * Enhance basic dish arrays with availability info and VAT prices
 * This function can take an array of basic dishes and optionally add availability and VAT pricing
 * 
 * @param {Object} db - Database connection
 * @param {Array} dishes - Array of basic dish objects
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeAvailability - Whether to check and include availability
 * @param {boolean} options.includeVAT - Whether to calculate and include VAT prices
 * @returns {Array} Enhanced dishes array
 */
async function enhanceDishesArray(db, dishes, options = {}) {
  const { includeAvailability = false, includeVAT = false } = options;
  
  if ((!includeAvailability && !includeVAT) || !dishes || dishes.length === 0) {
    return dishes; // Return as-is if no enhancement needed
  }

  try {
    // For each dish, check availability and calculate VAT prices as needed
    const enhancedDishes = await Promise.all(
      dishes.map(async (dish) => {
        try {
          let enhancedDish = { ...dish };

          // Calculate VAT price if requested
          if (includeVAT) {
            try {
              const priceWithVAT = await calculateItemPriceWithOptions(
                db, 
                dish.item_id, 
                {}, // No options for base price
                false, // Don't need details
                true   // Include VAT
              );
              enhancedDish.priceWithVAT = priceWithVAT;
            } catch (error) {
              console.warn(`Failed to calculate VAT price for dish ${dish.item_id}:`, error);
              // Fallback: calculate VAT manually with 15% rate
              enhancedDish.priceWithVAT = dish.price * 1.15;
            }
          }

          // Check availability if requested
          if (includeAvailability) {
            const availableIngredients = await getAvailableIngredients(dish.item_id);
            
            // Quick availability check based on required ingredients
            const isAvailable = dish.status && availableIngredients
              .filter(group => group.required)
              .every(group => group.ingredients.some(ing => 
                group.isPhysical ? ing.stock > 0 : true
              ));
            
            enhancedDish.isAvailable = isAvailable;
          }
          
          return enhancedDish;
        } catch (error) {
          console.warn(`Failed to enhance dish ${dish.item_id}:`, error);
          // Fallback enhancement
          const fallbackDish = { ...dish };
          if (includeAvailability) {
            fallbackDish.isAvailable = dish.status;
          }
          if (includeVAT) {
            fallbackDish.priceWithVAT = dish.price * 1.15; // 15% VAT fallback
          }
          return fallbackDish;
        }
      })
    );

    return enhancedDishes;
  } catch (error) {
    console.error('Error enhancing dishes array:', error);
    return dishes; // Return original array on error
  }
}

/**
 * Get basic dish information (lightweight)
 * 
 * @param {Object} db - Database connection
 * @param {number} dishId - The dish ID
 * @returns {Object} Basic dish information
 */
async function getBasicDishInfo(db, dishId) {
  try {
    const [dishes] = await db.execute(`
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
      WHERE d.item_id = ?
    `, [dishId]);

    if (dishes.length === 0) {
      return { success: false, error: 'Dish not found' };
    }

    return { success: true, dish: dishes[0] };
  } catch (error) {
    console.error('Error in getBasicDishInfo:', error);
    return { 
      success: false, 
      error: 'Failed to fetch dish info',
      details: error.message 
    };
  }
}

module.exports = {
  getDishDetails,
  getBasicDishInfo,
  enhanceDishesArray
};
