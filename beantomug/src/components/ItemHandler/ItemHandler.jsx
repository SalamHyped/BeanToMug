import classes from "./itemHandler.module.css";
import { useState, useContext, useEffect, useMemo, useCallback } from "react";
import { CartContext } from "../CartItems/CartContext";
import Modal from "../modal/Modal";

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

  // Create lookup maps for efficient option finding
  const optionLookups = useMemo(() => {
    if (!item?.options) return { valueToType: new Map(), categoryTypes: new Map() };
    
    const valueToType = new Map(); // valueId -> { category, type, value }
    const categoryTypes = new Map(); // category -> types array
    
    Object.entries(item.options).forEach(([category, optionGroup]) => {
      categoryTypes.set(category, optionGroup.types);
      
      optionGroup.types.forEach(type => {
        type.values.forEach(value => {
          valueToType.set(value.id, { category, type, value });
        });
      });
    });
    
    return { valueToType, categoryTypes };
  }, [item?.options]);

  // Memoize option extra price calculation
  const optionExtraPrice = useMemo(() => {
    let extra = 0;
    if (!item?.options) return 0;

    Object.entries(item.options).forEach(([category, optionGroup]) => {
      optionGroup.types.forEach(type => {
        if (type.type === "select" || type.type === "radio") {
          const selectedValue = type.values.find(v => selectedOptions[v.id]);
          if (selectedValue) {
            extra += parseFloat(selectedValue.price || 0);
          }
        } else if (type.type === "checkbox") {
          type.values.forEach(value => {
            if (selectedOptions[value.id]) {
              extra += parseFloat(value.price || 0);
            }
          });
        }
      });
    });
    return extra;
  }, [item?.options, selectedOptions]);

  // Memoize total price
  const totalPrice = useMemo(() => {
    return parseFloat(price || 0) + optionExtraPrice;
  }, [price, optionExtraPrice]);

  // Initialize options when item changes
  useEffect(() => {
    if (item?.options) {
      const initialOptions = {};
      
      Object.entries(item.options).forEach(([category, optionGroup]) => {
        optionGroup.types.forEach(type => {
          // For required options, select the first available value
          if (type.required && type.values.length > 0) {
            // Find first available value (in stock)
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

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  // Optimized option change handlers
  const handleSelectChange = useCallback((category, typeLabel, e) => {
    const valueId = e.target.value;
    
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      
      // Remove all options of this type
      Object.keys(newOptions).forEach(key => {
        if (newOptions[key]?.label === typeLabel) {
          delete newOptions[key];
        }
      });

      // Add the new selection if a value was selected
      if (valueId) {
        const type = optionLookups.categoryTypes.get(category)?.find(t => t.label === typeLabel);
        const selectedValue = type?.values.find(v => v.id === parseInt(valueId));
        
        if (selectedValue) {
          newOptions[valueId] = {
            selected: true,
            label: typeLabel,
            value: selectedValue.name
          };
        }
      }
      
      return newOptions;
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
      
      // Remove all options of this type (radio buttons are mutually exclusive)
      Object.keys(newOptions).forEach(key => {
        if (newOptions[key]?.label === typeLabel) {
          delete newOptions[key];
        }
      });

      // Add the new selection
      const valueInfo = optionLookups.valueToType.get(valueId);
      if (valueInfo && valueInfo.type.label === typeLabel) {
        newOptions[valueId] = {
          selected: true,
          label: typeLabel,
          value: valueInfo.value.name
        };
      }
      
      return newOptions;
    });
    setLocalError(null);
  }, [optionLookups.valueToType]);

  const handleAddToCart = useCallback(async () => {
    console.log('=== Add to Cart Debug ===');
    console.log('Current selected options:', selectedOptions);
    console.log('Item options:', item.options);
    
    // Safety check: Ensure required options are selected
    let updatedOptions = { ...selectedOptions };
    let optionsChanged = false;
    
    Object.entries(item.options || {}).forEach(([category, optionGroup]) => {
      optionGroup.types.forEach(type => {
        if (type.required) {
          const hasSelection = type.values.some(value => updatedOptions[value.id]);
          if (!hasSelection && type.values.length > 0) {
            // Auto-select first available option
            const firstAvailable = type.values.find(v => v.inStock) || type.values[0];
            if (firstAvailable) {
              updatedOptions[firstAvailable.id] = {
                selected: true,
                label: type.label,
                value: firstAvailable.name
              };
              optionsChanged = true;
              console.log(`Auto-selected required option: ${firstAvailable.name} for ${type.label}`);
            }
          }
        }
      });
    });
    
    // Update state if we made changes
    if (optionsChanged) {
      setSelectedOptions(updatedOptions);
      console.log('Updated options due to missing required selections:', updatedOptions);
    }
    
    // Optimized validation
    const missingRequired = Object.entries(item.options || {}).some(([category, optionGroup]) => {
      return optionGroup.types.some(type => {
        if (!type.required) return false;
        
        const hasSelection = type.values.some(value => updatedOptions[value.id]);
        console.log(`Required type "${type.label}": ${hasSelection ? 'SELECTED' : 'MISSING'}`);
        return !hasSelection;
      });
    });

    if (missingRequired) {
      console.error('Missing required options detected');
      setLocalError("Please select all required options");
      return;
    }

    if (!isAvailable) {
      setLocalError("This item is currently unavailable");
      return;
    }

    try {
      if (!item.item_id) {
        throw new Error('Invalid item: missing item_id');
      }
      
      const cartData = {
        item_id: parseInt(item.item_id),
        quantity: quantity,
        options: updatedOptions
      };

      console.log('Sending cart data:', cartData);
      await addToCart(cartData);
      setLocalError(null);
      
      if (onAddToCartComplete) {
        onAddToCartComplete();
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setLocalError(err.message || 'Failed to add item to cart');
    }
  }, [item, selectedOptions, isAvailable, quantity, addToCart, onAddToCartComplete, onClose]);

  // Optimized quantity controls
  const incrementQuantity = useCallback(() => setQuantity(prev => prev + 1), []);
  const decrementQuantity = useCallback(() => setQuantity(prev => prev > 1 ? prev - 1 : prev), []);

  // Memoized option rendering
  const renderOptions = useMemo(() => {
    if (!item?.options) return null;
    
    return Object.entries(item.options).map(([category, optionGroup]) => (
      <div key={category} className={classes.optionGroup}>
        <fieldset className={classes.fieldset}>
          <legend className={classes.legend}>{category}</legend>
          {optionGroup.types.map((type, index) => (
            <div key={`${category}-${index}`} className={classes.optionType}>
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
    ));
  }, [item?.options, selectedOptions, handleSelectChange, handleCheckboxChange, handleRadioChange]);

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
          <img src={item_photo_url} alt={item_name} />
        </div>
        
        <div className={classes.itemDetails}>
          <h2 className={classes.itemName}>{item_name}</h2>
          <p className={classes.itemPrice}>${Number(price || 0).toFixed(2)}</p>
          
          {/* Error Messages */}
          {(error || localError) && (
            <div className={classes.errorMessage}>
              <p>{error || localError}</p>
              <button 
                className={classes.closeError}
                onClick={() => setLocalError(null)}
              >
                ×
              </button>
            </div>
          )}
          
          {/* Options */}
          {renderOptions}
          
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