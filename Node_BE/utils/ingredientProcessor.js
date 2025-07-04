/**
 * Enhanced Ingredient Processing Utility
 * Handles validation, price calculation, and automatic required ingredient addition
 */

const { validateIngredientSelection } = require('../middleware/cartMiddleware');

/**
 * Process ingredient selections with validation, price calculation, and auto-addition of required ingredients
 * 
 * @param {Object} options - User selections from frontend
 * @param {Array} availableIngredients - Available ingredients from getAvailableIngredients
 * @param {number} basePrice - Base item price
 * @returns {Object} Processed result with validation, price, and ingredients
 */
const processIngredientSelections = (options, availableIngredients, basePrice) => {
  // Step 1: Validate user selections (this will throw error if validation fails)
  validateIngredientSelection(options, availableIngredients);
  
  // Step 2: Build ingredient maps and calculate price
  const ingredientMap = new Map();
  const requiredTypes = new Set();
  const typeRules = new Map();
  let totalPrice = parseFloat(basePrice) || 0;
  const selectedIngredients = [];
  const autoAddedIngredients = [];
  
  // Build data structures
  for (const group of availableIngredients) {
    if (group.ingredients && Array.isArray(group.ingredients)) {
      for (const ing of group.ingredients) {
        ingredientMap.set(ing.id, {
          id: ing.id,
          name: ing.name,
          price: parseFloat(ing.price) || 0,
          category: group.category,
          label: group.label,
          inStock: group.isPhysical ? (ing.stock > 0 && ing.status) : true,
          isPhysical: group.isPhysical
        });
      }
      
      typeRules.set(group.label, {
        isMultiple: group.isMultiple,
        group: group.group,
        label: group.label
      });
      
      if (group.required) {
        requiredTypes.add(group.label);
      }
    }
  }
  
  // Step 3: Process user selections and calculate price
  const selectionsByType = new Map();
  
  for (const [optionId, optionInfo] of Object.entries(options)) {
    if (!optionInfo.selected) continue;
    
    const ingredient = ingredientMap.get(parseInt(optionId));
    if (!ingredient) continue;
    
    // Add to price
    totalPrice += ingredient.price;
    selectedIngredients.push({
      ingredient_id: ingredient.id,
      price: ingredient.price,
      name: ingredient.name,
      label: ingredient.label
    });
    
    // Track selections by type
    if (!selectionsByType.has(ingredient.label)) {
      selectionsByType.set(ingredient.label, []);
    }
    selectionsByType.get(ingredient.label).push(ingredient);
  }
  
  // Step 4: Auto-add required ingredients that weren't selected
  for (const requiredType of requiredTypes) {
    const selections = selectionsByType.get(requiredType) || [];
    if (selections.length === 0) {
      // Find first available ingredient for this required type
      const firstIngredient = Array.from(ingredientMap.values()).find(ing => 
        ing.label === requiredType && ing.inStock
      );
      
      if (firstIngredient) {
        // Auto-add the first available required ingredient
        autoAddedIngredients.push({
          ingredient_id: firstIngredient.id,
          price: firstIngredient.price,
          name: firstIngredient.name,
          label: firstIngredient.label,
          autoAdded: true
        });
        
        // Add to total price (required ingredients are usually included in base price)
        // totalPrice += firstIngredient.price; // Uncomment if required ingredients add cost
        
        console.log(`Auto-added required ingredient: ${firstIngredient.name} (${firstIngredient.label})`);
      }
    }
  }
  
  // Step 5: Combine all ingredients (user selected + auto-added required)
  const allIngredients = [...selectedIngredients, ...autoAddedIngredients];
  
  return {
    validation: {
      isValid: true,
      selectedCount: selectedIngredients.length,
      autoAddedCount: autoAddedIngredients.length
    },
    pricing: {
      basePrice: parseFloat(basePrice) || 0,
      ingredientPrice: totalPrice - (parseFloat(basePrice) || 0),
      totalPrice: totalPrice
    },
    ingredients: {
      selected: selectedIngredients,
      autoAdded: autoAddedIngredients,
      all: allIngredients
    },
    summary: {
      totalIngredients: allIngredients.length,
      userSelections: selectedIngredients.length,
      requiredAutoAdded: autoAddedIngredients.length
    }
  };
};

/**
 * Get ingredient details for cart storage
 * 
 * @param {Array} processedIngredients - Result from processIngredientSelections
 * @returns {Array} Ingredients formatted for database storage
 */
const getIngredientsForStorage = (processedIngredients) => {
  return processedIngredients.ingredients.all.map(ing => ({
    ingredient_id: ing.ingredient_id,
    price: ing.price,
    name: ing.name,
    label: ing.label,
    autoAdded: ing.autoAdded || false
  }));
};

/**
 * Create options object for cart display
 * 
 * @param {Array} processedIngredients - Result from processIngredientSelections
 * @returns {Object} Options object for cart display
 */
const createOptionsForDisplay = (processedIngredients) => {
  const options = {};
  
  // Only include user-selected ingredients (not auto-added required ones)
  processedIngredients.ingredients.selected.forEach(ing => {
    options[ing.ingredient_id] = {
      selected: true,
      label: ing.label,
      value: ing.name,
      price: ing.price
    };
  });
  
  return options;
};

module.exports = {
  processIngredientSelections,
  getIngredientsForStorage,
  createOptionsForDisplay
}; 