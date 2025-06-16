import classes from "./itemHandler.module.css";
import { useState, useContext, useEffect, useMemo } from "react";
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

  // Memoize grouped options
  const groupedOptions = useMemo(() => {
    if (!item?.options) return {};
    
    return Object.entries(item.options).reduce((acc, [category, option]) => {
      if (!acc[category]) {
        acc[category] = {
          types: option.types.map(type => ({
            label: type.label,
            type: type.type,
            required: type.required,
            values: type.values,
            prices: type.prices
          }))
        };
      }
      return acc;
    }, {});
  }, [item?.options]);

  // Memoize option extra price calculation
  const optionExtraPrice = useMemo(() => {
    let extra = 0;
    if (!item?.options) return 0;

    Object.entries(item.options).forEach(([category, optionGroup]) => {
      optionGroup.types.forEach(type => {
        if (type.type === "select") {
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

  // Memoize option selection check
  const isOptionSelected = useMemo(() => {
    return (valueId) => !!selectedOptions[valueId];
  }, [selectedOptions]);

  useEffect(() => {
    if (item?.options) {
      const defaults = {};
      Object.entries(item.options).forEach(([category, optionGroup]) => {
        optionGroup.types.forEach(type => {
          if (type.required) {
            if (type.type === "select" && type.values.length > 0) {
              defaults[type.values[0].id] = true;
            }
          }
        });
      });
      setSelectedOptions(defaults);
    }
  }, [item]);

  const handleClose = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  const handleAddToCart = async () => {
    // Validate required options
    const missingRequired = Object.entries(item.options || {})
      .filter(([_, optionGroup]) => {
        return optionGroup.types.some(type => type.required);
      })
      .some(([category, optionGroup]) => {
        return optionGroup.types.some(type => {
          if (type.required) {
            if (type.type === "select") {
              return !type.values.some(value => selectedOptions[value.id]);
            } else if (type.type === "checkbox") {
              return !type.values.some(value => selectedOptions[value.id]);
            }
          }
          return false;
        });
      });

    if (missingRequired) {
      setLocalError("Please select all required options");
      return;
    }

    if (!isAvailable) {
      setLocalError("This item is currently unavailable");
      return;
    }

    try {
      await addToCart(item, quantity, selectedOptions);
      setLocalError(null);
      
      if (onAddToCartComplete) {
        onAddToCartComplete();
      } else {
        onClose();
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to add item to cart');
    }
  };

  // Quantity controls
  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  // Update handleSelectChange to properly handle checked state
  const handleSelectChange = (category, typeLabel, e) => {
    const valueId = e.target.value;
    
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      
      // Find the specific type in the specific category
      const type = item.options[category]?.types.find(t => t.label === typeLabel);
      
      if (type) {
        // Remove any previously selected value for this type
        type.values.forEach(v => {
          delete newOptions[v.id];
        });
      }

      // Add the new selection if a value was selected
      if (valueId) {
        newOptions[valueId] = true;
      }
      
      return newOptions;
    });
    setLocalError(null);
  };

  // Update handleCheckboxChange to properly handle checked state
  const handleCheckboxChange = (valueId, e) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      if (e.target.checked) {
        newOptions[valueId] = true;
      } else {
        delete newOptions[valueId];
      }
      return newOptions;
    });
    setLocalError(null);
  };

  // Render options dynamically based on item.options
  const renderOptions = () => {
    if (!item?.options) return null;
    
    return Object.entries(groupedOptions).map(([category, optionGroup]) => (
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
                    value={type.values.find(v => isOptionSelected(v.id))?.id || ""}
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
                ) : (
                  <div className={classes.checkboxGroup}>
                    {type.values.map((value) => (
                      <label key={value.id} className={classes.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isOptionSelected(value.id)}
                          onChange={(e) => handleCheckboxChange(value.id, e)}
                          required={type.required}
                          disabled={!value.inStock}
                        />
                        {value.name} {value.inStock ? `(+$${value.price})` : '(Out of Stock)'}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>
          ))}
        </fieldset>
      </div>
    ));
  };

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
                onClick={() => {
                  setLocalError(null);
                }}
              >
                ×
              </button>
            </div>
          )}
          
          {/* Options */}
          {renderOptions()}
          
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