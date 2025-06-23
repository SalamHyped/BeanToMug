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
    if (!/^\d+$/.test(optionId)) {
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
  
  // Build lookup maps in a single pass
  const ingredientMap = new Map(); // ingredientId -> ingredient data
  const requiredTypes = new Set(); // type label -> true if required
  const typeRules = new Map(); // type label -> {isMultiple, group, label}
  
  // Single pass to build all necessary data structures
  for (const group of availableIngredients) {

    if (group.ingredients && Array.isArray(group.ingredients)) {
      for (const ing of group.ingredients) {
        ingredientMap.set(ing.id, {
          id: ing.id,
          name: ing.name,
          category: group.category,
          label: group.label,
          inStock: group.isPhysical ? (ing.stock > 0 && ing.status) : true,
          isPhysical: group.isPhysical
        });
      }
      
      // Store type rules
      typeRules.set(group.label, {
        isMultiple: group.isMultiple,
        group: group.group,
        label: group.label
      });
      
      // Mark type as required if this group is required
      if (group.required) {
        requiredTypes.add(group.label);
        console.log(`Added required type: ${group.label}`);
      }
    }
  }


  // Validate selections in a single pass
  const selectedIngredients = new Set();
  const selectionsByType = new Map(); // type label -> selected ingredients
  
  for (const [optionId, optionInfo] of Object.entries(options)) {
    if (!optionInfo.selected) {
      continue;
    }
    
    const ingredient = ingredientMap.get(parseInt(optionId));
    console.log(`Found ingredient for ${optionId}:`, ingredient);
    
    // Validate ingredient exists
    if (!ingredient) {
      console.error(`Ingredient ${optionId} not found in ingredientMap`);
      throw new Error('Selected ingredient is not available');
    }

    // Validate stock for physical ingredients
    if (ingredient.isPhysical && !ingredient.inStock) {
      throw new Error('Selected ingredient is out of stock');
    }

    // Validate label and value match
    if (ingredient.label !== optionInfo.label || ingredient.name !== optionInfo.value) {
      console.error('Label/value mismatch:', {
        ingredientLabel: ingredient.label,
        optionLabel: optionInfo.label,
        ingredientName: ingredient.name,
        optionValue: optionInfo.value
      });
      throw new Error('Invalid option data');
    }
    
    // Track selections
    selectedIngredients.add(ingredient.id);

    
    if (!selectionsByType.has(ingredient.label)) {
      selectionsByType.set(ingredient.label, []);
    }
    selectionsByType.get(ingredient.label).push(ingredient);
  }

  console.log('Selected ingredients:', Array.from(selectedIngredients));

  // Check missing required types (only one selection per type is needed)
  const missingRequired = [];
  for (const requiredType of requiredTypes) {
    const selections = selectionsByType.get(requiredType) || [];
    if (selections.length === 0) {
      // Get the first ingredient from this type for error reporting
      const firstIngredient = Array.from(ingredientMap.values()).find(ing => ing.label === requiredType);
      missingRequired.push({
        category: firstIngredient ? firstIngredient.category : requiredType,
        type: requiredType,
        label: requiredType,
        ingredientName: firstIngredient ? firstIngredient.name : 'Any option'
      });
      console.log(`Missing required type: ${requiredType}`);
    }
  }

  if (missingRequired.length > 0) {
    console.error('Missing required types:', missingRequired);
    const error = new Error('Required types are missing');
    error.code = 'MISSING_REQUIRED_TYPES';
    error.missingTypes = missingRequired;
    throw error;
  }

  // Check multiple selection rules
  for (const [type, selections] of selectionsByType) {
    const typeRule = typeRules.get(type);
    if (typeRule && !typeRule.isMultiple && selections.length > 1) {
      const error = new Error('Multiple selections not allowed for this option');
      error.code = 'MULTIPLE_SELECTIONS_NOT_ALLOWED';
      error.type = type;
      error.selections = selections.map(s => s.name);
      throw error;
    }
  }

  console.log('Validation passed successfully');
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