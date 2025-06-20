// Initialize session cart if it doesn't exist
const initializeSessionCart = (req) => {
  if (!req.session.cart) {
    console.log('Creating new session cart');
    req.session.cart = {
      items: [],
      orderType: 'Dine In'
    };
  }
  return req.session.cart;
};
  
// Validate item structure
const validateItem = (item) => {
  if (!item) return false;
  
  const requiredFields = ['item_id', 'item_name', 'price'];
  return requiredFields.every(field => item[field] !== undefined);
};

// Validate quantity
const validateQuantity = (quantity) => {
  if (quantity === undefined || quantity === null) return false;
  if (typeof quantity !== 'number') return false;
  if (quantity < 1) return false; // Changed from 0 to 1 as minimum
  if (quantity > 99) return false; // Reasonable maximum
  return true;
};

// Validate options structure
const validateOptions = (options) => {
  if (!options || typeof options !== 'object') {
    return true; // No options is valid
  }

  // Check each option
  for (const [optionId, optionInfo] of Object.entries(options)) {
    // Check if optionId is valid
    if (!/^[a-zA-Z0-9_-]+$/.test(optionId)) {
      return false;
    }

    // Validate option info structure
    if (!optionInfo || typeof optionInfo !== 'object') {
      return false;
    }

    // Check required fields - make them more flexible
    if (!optionInfo.hasOwnProperty('selected')) {
      return false;
    }

    // Validate selected field type
    if (typeof optionInfo.selected !== 'boolean') {
      return false;
    }

    // If selected is true, require label and value
    if (optionInfo.selected) {
      if (!optionInfo.hasOwnProperty('label') || !optionInfo.hasOwnProperty('value')) {
        return false;
      }

      // Validate field types
      if (typeof optionInfo.label !== 'string' || typeof optionInfo.value !== 'string') {
        return false;
      }

      // Validate string content
      if (!/^[a-zA-Z0-9\s-]+$/.test(optionInfo.label) ||
          !/^[a-zA-Z0-9\s-]+$/.test(optionInfo.value)) {
        return false;
      }
    }
  }

  return true;
};

// Validate order type
const validateOrderType = (orderType) => {
  return orderType && ['Dine In', 'Take Away'].includes(orderType);
};

// Validate cart item structure
const validateCartItem = (item) => {
  if (!item) return false;
  
  const requiredFields = ['item_id', 'quantity'];
  if (!requiredFields.every(field => item[field] !== undefined)) {
    return false;
  }
  
  if (!validateQuantity(item.quantity)) {
    return false;
  }
  
  if (item.options && !validateOptions(item.options)) {
    return false;
  }
  
  return true;
};

// Validate price
const validatePrice = (price) => {
  if (price === undefined || price === null) return false;
  
  if (isNaN(price)) return false;
  if (price < 0) return false;
  if (price > 9999.99) return false; // Reasonable maximum
  return true;
};

// Validate ingredient selection
const validateIngredientSelection = (options, availableIngredients) => {
  if (!options || !availableIngredients) return true;
  
  // Convert availableIngredients to a map for faster lookup
  const availableIngredientsMap = availableIngredients.reduce((acc, group) => {
    if (group.ingredients && Array.isArray(group.ingredients)) {
      group.ingredients.forEach(ing => {
        acc[ing.id] = {
          id: ing.id,
          name: ing.name,
          category: group.category,
          label: group.label,
          inStock: ing.stock > 0 && ing.status,
          required: group.required,
          isPhysical: group.isPhysical // Add isPhysical flag
        };
      });
    }
    return acc;
  }, {});

  // Check for missing required ingredients
  const missingRequired = availableIngredients.filter(group => {
    if (!group.required) return false;
    
    // Check if any required ingredient from this group is selected
    const hasSelectedRequired = Object.entries(options).some(([optionId, optionInfo]) => {
      const ingredient = availableIngredientsMap[optionId];
      return ingredient && 
             ingredient.category === group.category && 
             optionInfo.selected;
    });
    
    return !hasSelectedRequired;
  });

  if (missingRequired.length > 0) {
    const error = new Error('Required ingredients are missing');
    error.code = 'MISSING_REQUIRED_INGREDIENTS';
    error.missingIngredients = missingRequired.map(group => ({
      category: group.category,
      type: group.type,
      label: group.label
    }));
    throw error;
  }

  // Validate each selected option
  for (const [optionId, optionInfo] of Object.entries(options)) {
    if (optionInfo.selected) {
      const ingredient = availableIngredientsMap[optionId];
      
      // Check if ingredient exists
      if (!ingredient) {
        const error = new Error('Selected ingredient is not available');
        error.code = 'INGREDIENT_NOT_AVAILABLE';
        error.ingredientId = optionId;
        error.ingredientLabel = optionInfo.label;
        error.ingredientValue = optionInfo.value;
        throw error;
      }

      // Only check stock for physical ingredients
      if (ingredient.isPhysical && !ingredient.inStock) {
        const error = new Error('Selected ingredient is out of stock');
        error.code = 'INGREDIENT_OUT_OF_STOCK';
        error.ingredientId = optionId;
        error.ingredientLabel = optionInfo.label;
        error.ingredientValue = optionInfo.value;
        throw error;
      }

      // Validate that the label and value match what's in the database
      if (ingredient.label !== optionInfo.label || ingredient.name !== optionInfo.value) {
        const error = new Error('Invalid option data');
        error.code = 'INVALID_OPTION_DATA';
        error.ingredientId = optionId;
        error.expected = { label: ingredient.label, value: ingredient.name };
        error.received = { label: optionInfo.label, value: optionInfo.value };
        throw error;
      }
    }
  }

  return true;
};

// Validate cart total
const validateCartTotal = (items) => {
  if (!Array.isArray(items)) return false;
  
  const total = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);
  
  return total >= 0 && total <= 99999.99; // Reasonable maximum
};




// Validate cart data structure for general operations (flexible)
const validateCartDataFlexible = (cartData, requireQuantity = true) => {
  console.log("cartData", cartData)
  if (!cartData || typeof cartData !== 'object') {
    return false;
  }

  const { item_id, quantity, options } = cartData;

  if (!item_id) {
    return false;
  }

  if (requireQuantity && !validateQuantity(quantity)) {
    return false;
  }
  if (options && !validateOptions(options)) {
    return false;
  }
console.log("im here")

  return true;
};

module.exports = {
  initializeSessionCart,
  validateItem,
  validateQuantity,
  validateOptions,
  validateOrderType,
  validateCartItem,
  validatePrice,
  validateIngredientSelection,
  validateCartTotal,

  validateCartDataFlexible
}; 