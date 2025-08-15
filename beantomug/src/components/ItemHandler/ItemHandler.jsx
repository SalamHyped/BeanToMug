import React, { useState, useContext, useEffect, useMemo, useCallback, useRef } from "react";
import { CartContext } from "../CartItems/CartContext";
import Modal from "../modal/Modal";
import classes from "./itemHandler.module.css";
import RoundedPhoto from '../roundedPhoto/RoundedPhoto';

export default function ItemHandler({ item, onClose, onAddToCartComplete }) {
  if (!item) {
    return null;
  }

  const { item_name, item_photo_url, price, isAvailable } = item;
  
  const { addToCart, error } = useContext(CartContext);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [localError, setLocalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Use ref to avoid unnecessary re-renders for stable values
  const itemRef = useRef(item);
  const addToCartRef = useRef(addToCart);
  const onCloseRef = useRef(onClose);
  const onAddToCartCompleteRef = useRef(onAddToCartComplete);

  // Update refs when props change
  useEffect(() => {
    itemRef.current = item;
    addToCartRef.current = addToCart;
    onCloseRef.current = onClose;
    onAddToCartCompleteRef.current = onAddToCartComplete;
  });

  // Create lookup maps for efficient option finding - optimized with Set for faster lookups
  const optionLookups = useMemo(() => {
    if (!item?.options) return { 
      valueToType: new Map(), 
      categoryTypes: new Map(),
      selectedValueIds: new Set(),
      requiredTypes: new Set()
    };
    
    const valueToType = new Map(); // valueId -> { category, type, value }
    const categoryTypes = new Map(); // category -> types array
    const selectedValueIds = new Set(); // Set for O(1) lookups
    const requiredTypes = new Set(); // Track required types
    
    Object.entries(item.options).forEach(([category, optionGroup]) => {
      categoryTypes.set(category, optionGroup.types);
      
      optionGroup.types.forEach(type => {
        if (type.required) {
          requiredTypes.add(type.label);
        }
        type.values.forEach(value => {
          valueToType.set(value.id, { category, type, value });
        });
      });
    });
    
    return { valueToType, categoryTypes, selectedValueIds, requiredTypes };
  }, [item?.options]);

  // Optimized price calculation with early returns and reduced iterations
  const optionExtraPrice = useMemo(() => {
    if (!item?.options || !selectedOptions) return 0;

    let extra = 0;
    const selectedKeys = Object.keys(selectedOptions);
    
    // Use Set for O(1) lookups instead of nested loops
    const selectedSet = new Set(selectedKeys);
    
    Object.entries(item.options).forEach(([category, optionGroup]) => {
      optionGroup.types.forEach(type => {
        if (type.type === "select" || type.type === "radio") {
          // Find selected value more efficiently
          const selectedValue = type.values.find(v => selectedSet.has(v.id.toString()));
          if (selectedValue) {
            extra += parseFloat(selectedValue.price || 0);
          }
        } else if (type.type === "checkbox") {
          // Only iterate through values that are actually selected
          type.values.forEach(value => {
            if (selectedSet.has(value.id.toString())) {
              extra += parseFloat(value.price || 0);
            }
          });
        }
      });
    });
    return extra;
  }, [item?.options, selectedOptions]);

  // Memoize total price calculation
  const totalPrice = useMemo(() => {
    const perItemPrice = parseFloat(price || 0) + optionExtraPrice;
    return perItemPrice * quantity;
  }, [price, optionExtraPrice, quantity]);

  // Optimized initialization with better data structure
  useEffect(() => {
    if (item?.options) {
      const initialOptions = {};
      
      Object.entries(item.options).forEach(([category, optionGroup]) => {
        optionGroup.types.forEach(type => {
          if (type.required && type.values.length > 0) {
            // Find first available value more efficiently
            const firstAvailableValue = type.values.find(v => v.inStock) || type.values[0];
            
            if (firstAvailableValue) {
              initialOptions[firstAvailableValue.id] = {
                selected: true,
                label: type.label,
                value: firstAvailableValue.name
              };
            }
          }
        });
      });
      
      setSelectedOptions(initialOptions);
    }
  }, [item]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    if (onCloseRef.current) onCloseRef.current();
  }, []);

  // Optimized option change handlers with better state updates
  const handleSelectChange = useCallback((category, typeLabel, e) => {
    const valueId = e.target.value;
    
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      
      // More efficient removal using filter
      const filteredOptions = Object.fromEntries(
        Object.entries(newOptions).filter(([key, option]) => option.label !== typeLabel)
      );

      // Add the new selection if a value was selected
      if (valueId) {
        const type = optionLookups.categoryTypes.get(category)?.find(t => t.label === typeLabel);
        const selectedValue = type?.values.find(v => v.id === parseInt(valueId));
        
        if (selectedValue) {
          filteredOptions[valueId] = {
            selected: true,
            label: typeLabel,
            value: selectedValue.name
          };
        }
      }
      
      return filteredOptions;
    });
    setLocalError(null);
  }, [optionLookups.categoryTypes]);

  const handleCheckboxChange = useCallback((valueId, e) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      const valueInfo = optionLookups.valueToType.get(valueId);
      
      if (valueInfo) {
        if (e.target.checked) {
          newOptions[valueId] = {
            selected: true,
            label: valueInfo.type.label,
            value: valueInfo.value.name
          };
        } else {
          delete newOptions[valueId];
        }
      }
      
      return newOptions;
    });
    setLocalError(null);
  }, [optionLookups.valueToType]);

  const handleRadioChange = useCallback((category, typeLabel, valueId, e) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      
      // More efficient removal using filter
      const filteredOptions = Object.fromEntries(
        Object.entries(newOptions).filter(([key, option]) => option.label !== typeLabel)
      );

      // Add the new selection
      const valueInfo = optionLookups.valueToType.get(valueId);
      if (valueInfo && valueInfo.type.label === typeLabel) {
        filteredOptions[valueId] = {
          selected: true,
          label: typeLabel,
          value: valueInfo.value.name
        };
      }
      
      return filteredOptions;
    });
    setLocalError(null);
  }, [optionLookups.valueToType]);

  // Optimized add to cart with better validation
  const handleAddToCart = useCallback(async () => {
    // Safety check: Ensure required options are selected
    let updatedOptions = { ...selectedOptions };
    let optionsChanged = false;
    
    // Use the pre-computed required types for faster validation
    const missingRequired = optionLookups.requiredTypes.size > 0 && 
      Array.from(optionLookups.requiredTypes).some(requiredType => {
        const hasSelection = Object.values(updatedOptions).some(option => 
          option.selected && option.label === requiredType
        );
        
        if (!hasSelection) {
          // Auto-select first available option for missing required type
          Object.entries(itemRef.current.options || {}).forEach(([category, optionGroup]) => {
            optionGroup.types.forEach(type => {
              if (type.label === requiredType && type.values.length > 0) {
                const firstAvailable = type.values.find(v => v.inStock) || type.values[0];
                if (firstAvailable) {
                  updatedOptions[firstAvailable.id] = {
                    selected: true,
                    label: requiredType,
                    value: firstAvailable.name
                  };
                  optionsChanged = true;
                }
              }
            });
          });
        }
        return !hasSelection;
      });

    if (missingRequired) {
      setLocalError("Please select all required options");
      return;
    }

    // Update state if we made changes
    if (optionsChanged) {
      setSelectedOptions(updatedOptions);
    }

    if (!isAvailable) {
      setLocalError("This item is currently unavailable");
      return;
    }

    try {
      if (!itemRef.current.item_id) {
        throw new Error('Invalid item: missing item_id');
      }
      
      const cartData = {
        item_id: parseInt(itemRef.current.item_id),
        quantity: quantity,
        options: updatedOptions
      };

      await addToCartRef.current(cartData);
      setLocalError(null);
      
      if (onAddToCartCompleteRef.current) {
        onAddToCartCompleteRef.current();
      } else {
        onCloseRef.current();
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to add item to cart');
    }
  }, [selectedOptions, isAvailable, quantity, optionLookups.requiredTypes]);

  // Optimized quantity controls
  const incrementQuantity = useCallback(() => setQuantity(prev => prev + 1), []);
  const decrementQuantity = useCallback(() => setQuantity(prev => prev > 1 ? prev - 1 : prev), []);

  // Memoized option rendering with better key strategy
  const renderOptions = useMemo(() => {
    if (!item?.options) return null;
    
    return Object.entries(item.options).map(([category, optionGroup]) => {
      // Check if there's only one type in this category
      const hasMultipleTypes = optionGroup.types.length > 1;
      
      return (
        <div key={category} className={classes.optionGroup}>
          <fieldset className={classes.fieldset}>
            {/* Only show category legend if there are multiple types */}
            {hasMultipleTypes && <legend className={classes.legend}>{category}</legend>}
            {optionGroup.types.map((type) => (
              <div key={`${category}-${type.label}`} className={classes.optionType}>
                <fieldset className={classes.typeFieldset}>
                  <legend className={classes.typeLegend}>
                    {type.label}
                    {type.required && <span className={classes.required}>*</span>}
                  </legend>
                  {type.type === 'select' ? (
                    <select
                      onChange={(e) => handleSelectChange(category, type.label, e)}
                      required={type.required}
                      className={classes.select}
                      placeholder={type.placeholder}
                      value={type.values.find(v => selectedOptions[v.id]?.selected)?.id || ""}
                    >
                      <option value="">{type.placeholder || `Select ${type.label}`}</option>
                      {type.values.map((value) => (
                        <option 
                          key={value.id} 
                          value={value.id}
                          disabled={!value.inStock}
                        >
                          {value.name} {value.inStock ? `(+$${value.price})` : '(Out of Stock)'}
                        </option>
                      ))}
                    </select>
                  ) : type.type === 'checkbox' ? (
                    <div className={classes.checkboxGroup}>
                      {type.values.map((value) => (
                        <label key={value.id} className={classes.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedOptions[value.id]?.selected || false}
                            onChange={(e) => handleCheckboxChange(value.id, e)}
                            required={type.required}
                            disabled={!value.inStock}
                          />
                          {value.name} {value.inStock ? `(+$${value.price})` : '(Out of Stock)'}
                        </label>
                      ))}
                    </div>
                  ) : type.type === 'radio' ? (
                    <div className={classes.radioGroup}>
                      {type.values.map((value) => (
                        <label key={value.id} className={classes.radioLabel}>
                          <input
                            type="radio"
                            checked={selectedOptions[value.id]?.selected || false}
                            onChange={(e) => handleRadioChange(category, type.label, value.id, e)}
                            required={type.required}
                            disabled={!value.inStock}
                          />
                          {value.name} {value.inStock ? `(+$${value.price})` : '(Out of Stock)'}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </fieldset>
              </div>
            ))}
          </fieldset>
        </div>
      );
    });
  }, [item?.options, selectedOptions, handleSelectChange, handleCheckboxChange, handleRadioChange]);

  // Memoized error display
  const errorDisplay = useMemo(() => {
    if (!error && !localError) return null;
    
    return (
      <div className={classes.errorMessage}>
        <p>{error || localError}</p>
        <button 
          className={classes.closeError}
          onClick={() => setLocalError(null)}
        >
          ×
        </button>
      </div>
    );
  }, [error, localError]);

  return (
    <Modal 
      isOpen={isModalOpen} 
      onClose={handleClose}
      footerButtons={[
        {
          label: "Close",
          onClick: handleClose,
          className: "bg-green-500 text-white px-4 py-2 rounded",
        },
      ]}
    >
      <div className={classes.itemHandler}>
        <div className={classes.itemImage}>
          <RoundedPhoto 
            src={item_photo_url} 
            alt={item_name} 
            size={200}
          />
        </div>
        
        <div className={classes.itemDetails}>
          <h2 className={classes.itemName}>{item_name}</h2>
          <p className={classes.itemPrice}>${Number(price || 0).toFixed(2)}</p>
          
          {/* Error Messages */}
          {errorDisplay}
          
          {/* Options */}
          <div className={classes.optionsContainer}>
            {renderOptions}
          </div>
          
          {/* Quantity Controls */}
          <div className={classes.quantityControls}>
            <button 
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className={classes.quantityButton}
            >
              -
            </button>
            <span className={classes.quantity}>{quantity}</span>
            <button 
              onClick={incrementQuantity}
              className={classes.quantityButton}
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            className={classes.addToCartBtn}
            disabled={!isAvailable}
          >
            {isAvailable ? `Add to Cart - $${totalPrice.toFixed(2)}` : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </Modal>
  );
}