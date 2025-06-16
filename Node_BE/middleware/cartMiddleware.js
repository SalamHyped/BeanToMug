// Initialize session cart if it doesn't exist
const initializeSessionCart = (req) => {
  if (!req.session.cart) {
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
  if (quantity < 0) return false;
  if (quantity > 99) return false; // Reasonable maximum
  return true;
};

// Validate options structure
const validateOptions = (options) => {
  if (!options || typeof options !== 'object') {
    return true; // No options is valid
  }
  // Check for invalid option types
  for (const [key, value] of Object.entries(options)) {
    if (typeof value !== 'string' && typeof value !== 'boolean') {
      return false;
    }

    // Validate option key format (should be category_ingredient)
    if (!/^[a-zA-Z0-9_\s]+$/.test(key)) {
      return false;
    }
    // Validate string values (for select options)
    if (typeof value === 'string' && !/^[a-zA-Z0-9\s-]+$/.test(value)) {
      return false;
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
  
  console.log('Validating ingredients:', { options, availableIngredients });
  
  // Convert availableIngredients to a map for faster lookup
  const availableIngredientsMap = availableIngredients.reduce((acc, group) => {
    if (group.ingredients && Array.isArray(group.ingredients)) {
      group.ingredients.forEach(ing => {
        acc[ing.id] = {
          id: ing.id,
          name: ing.name,
          category: group.category,
          inStock: ing.stock > 0 && ing.status,
          required: group.required
        };
      });
    }
    return acc;
  }, {});

  console.log('Created ingredients map:', availableIngredientsMap);

  // Check for missing required ingredients
  const missingRequired = availableIngredients.filter(group => {
    if (!group.required) return false;
    
    // For select type, check if any option is selected
    if (group.type === 'select') {
      return !options[group.category] || !options[group.category][group.label];
    }
    
    // For checkbox type, check if at least one option is selected
    if (group.type === 'checkbox') {
      return !options[group.category] || 
             !group.ingredients.some(ing => options[group.category][ing.name]);
    }
    
    return false;
  });

  if (missingRequired.length > 0) {
    console.log('Missing required ingredients:', missingRequired);
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
  for (const [category, categoryOptions] of Object.entries(options)) {
    if (typeof categoryOptions === 'object') {
      for (const [optionKey, isSelected] of Object.entries(categoryOptions)) {
        if (isSelected) {
          const ingredient = availableIngredientsMap[optionKey];
          
          // Check if ingredient exists and is available
          if (!ingredient || !ingredient.inStock) {
            console.log(`Validation failed for ingredient ${optionKey}:`, {
              exists: !!ingredient,
              inStock: ingredient?.inStock
            });
            const error = new Error('Selected ingredient is not available');
            error.code = 'INGREDIENT_NOT_AVAILABLE';
            error.ingredientId = optionKey;
            throw error;
          }
        }
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

module.exports = {
  initializeSessionCart,
  validateItem,
  validateQuantity,
  validateOptions,
  validateOrderType,
  validateCartItem,
  validatePrice,
  validateIngredientSelection,
  validateCartTotal
}; 