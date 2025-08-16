import React, { useState, useEffect } from 'react';
import styles from './ingredientForm.module.css';

const IngredientForm = ({ 
  ingredient = null, // null for new ingredient, object for editing
  ingredientTypes = [],
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEditMode = !!ingredient;

  const [formData, setFormData] = useState({
    ingredient_name: '',
    price: '',
    brand: '',
    expiration: '',
    unit: 'ml',
    supplier_id: '',
    quantity_in_stock: '',
    low_stock_threshold: '',
    type_id: '',
    status: 1
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (ingredient) {
      setFormData({
        ingredient_name: ingredient.ingredient_name || '',
        price: ingredient.price || '',
        brand: ingredient.brand || '',
        expiration: ingredient.expiration ? ingredient.expiration.split('T')[0] : '', // Format date for input
        unit: ingredient.unit || 'ml',
        supplier_id: ingredient.supplier_id || '',
        quantity_in_stock: ingredient.quantity_in_stock || '',
        low_stock_threshold: ingredient.low_stock_threshold || '',
        type_id: ingredient.type_id || '',
        status: ingredient.status !== undefined ? ingredient.status : 1
      });
    }
  }, [ingredient]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    // Handle different input types
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = e.target.checked ? 1 : 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.ingredient_name.trim()) {
      newErrors.ingredient_name = 'Ingredient name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.expiration) {
      newErrors.expiration = 'Expiration date is required';
    } else {
      // Check if expiration date is in the future
      const expirationDate = new Date(formData.expiration);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      
      if (expirationDate < today) {
        newErrors.expiration = 'Expiration date must be in the future';
      }
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.type_id) {
      newErrors.type_id = 'Ingredient type is required';
    }

    if (formData.quantity_in_stock !== '' && formData.quantity_in_stock < 0) {
      newErrors.quantity_in_stock = 'Quantity cannot be negative';
    }

    if (formData.low_stock_threshold !== '' && formData.low_stock_threshold < 0) {
      newErrors.low_stock_threshold = 'Threshold cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle submit error (could set a general error state)
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEditMode) {
      // Reset to original values
      setFormData({
        ingredient_name: ingredient.ingredient_name || '',
        price: ingredient.price || '',
        brand: ingredient.brand || '',
        expiration: ingredient.expiration ? ingredient.expiration.split('T')[0] : '',
        unit: ingredient.unit || 'ml',
        supplier_id: ingredient.supplier_id || '',
        quantity_in_stock: ingredient.quantity_in_stock || '',
        low_stock_threshold: ingredient.low_stock_threshold || '',
        type_id: ingredient.type_id || '',
        status: ingredient.status !== undefined ? ingredient.status : 1
      });
    } else {
      // Reset to default values
      setFormData({
        ingredient_name: '',
        price: '',
        brand: '',
        expiration: '',
        unit: 'ml',
        supplier_id: '',
        quantity_in_stock: '',
        low_stock_threshold: '',
        type_id: '',
        status: 1
      });
    }
    setErrors({});
  };

  // Group ingredient types by category for better organization
  const groupedTypes = ingredientTypes.reduce((groups, type) => {
    const category = type.category_name || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(type);
    return groups;
  }, {});

  const isFormDisabled = loading || submitting;

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h3>{isEditMode ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
        <p className={styles.formDescription}>
          {isEditMode 
            ? 'Update the ingredient information below'
            : 'Fill in the details to add a new ingredient to your inventory'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Basic Information */}
          <div className={styles.formSection}>
            <h4>Basic Information</h4>
            
            <div className={styles.formGroup}>
              <label htmlFor="ingredient_name">Ingredient Name *</label>
              <input
                type="text"
                id="ingredient_name"
                name="ingredient_name"
                value={formData.ingredient_name}
                onChange={handleInputChange}
                disabled={isFormDisabled}
                className={errors.ingredient_name ? styles.errorInput : ''}
                placeholder="e.g., Premium Coffee Beans"
              />
              {errors.ingredient_name && (
                <span className={styles.errorMessage}>{errors.ingredient_name}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="brand">Brand *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                disabled={isFormDisabled}
                className={errors.brand ? styles.errorInput : ''}
                placeholder="e.g., Starbucks, Lavazza"
              />
              {errors.brand && (
                <span className={styles.errorMessage}>{errors.brand}</span>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="price">Price per Unit ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className={errors.price ? styles.errorInput : ''}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                {errors.price && (
                  <span className={styles.errorMessage}>{errors.price}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="unit">Unit *</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className={errors.unit ? styles.errorInput : ''}
                >
                  <option value="ml">Milliliters (ml)</option>
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="l">Liters (l)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="cup">Cups</option>
                  <option value="tsp">Teaspoons</option>
                  <option value="tbsp">Tablespoons</option>
                  <option value="serving">Servings</option>
                  <option value="shot">Shots</option>
                  <option value="piece">Pieces</option>
                </select>
                {errors.unit && (
                  <span className={styles.errorMessage}>{errors.unit}</span>
                )}
              </div>
            </div>
          </div>

          {/* Type and Category */}
          <div className={styles.formSection}>
            <h4>Classification</h4>
            
            <div className={styles.formGroup}>
              <label htmlFor="type_id">Ingredient Type *</label>
              <select
                id="type_id"
                name="type_id"
                value={formData.type_id}
                onChange={handleInputChange}
                disabled={isFormDisabled}
                className={errors.type_id ? styles.errorInput : ''}
              >
                <option value="">Select ingredient type</option>
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <optgroup key={category} label={category}>
                    {types.map(type => (
                      <option key={type.type_id} value={type.type_id}>
                        {type.name} {type.is_physical ? '(Physical)' : '(Non-physical)'}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.type_id && (
                <span className={styles.errorMessage}>{errors.type_id}</span>
              )}
            </div>
          </div>

          {/* Stock Management */}
          <div className={styles.formSection}>
            <h4>Stock Management</h4>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="quantity_in_stock">Current Stock Quantity</label>
                <input
                  type="number"
                  id="quantity_in_stock"
                  name="quantity_in_stock"
                  value={formData.quantity_in_stock}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className={errors.quantity_in_stock ? styles.errorInput : ''}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                {errors.quantity_in_stock && (
                  <span className={styles.errorMessage}>{errors.quantity_in_stock}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="low_stock_threshold">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  id="low_stock_threshold"
                  name="low_stock_threshold"
                  value={formData.low_stock_threshold}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className={errors.low_stock_threshold ? styles.errorInput : ''}
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                />
                {errors.low_stock_threshold && (
                  <span className={styles.errorMessage}>{errors.low_stock_threshold}</span>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className={styles.formSection}>
            <h4>Additional Information</h4>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="expiration">Expiration Date *</label>
                <input
                  type="date"
                  id="expiration"
                  name="expiration"
                  value={formData.expiration}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className={errors.expiration ? styles.errorInput : ''}
                />
                {errors.expiration && (
                  <span className={styles.errorMessage}>{errors.expiration}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="supplier_id">Supplier ID (Optional)</label>
                <input
                  type="number"
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  placeholder="Supplier ID"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status === 1}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                />
                <span className={styles.checkboxText}>Active (ingredient is available for use)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isFormDisabled}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isFormDisabled}
            className={styles.resetButton}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isFormDisabled}
            className={styles.submitButton}
          >
            {submitting ? 'Saving...' : (isEditMode ? 'Update Ingredient' : 'Add Ingredient')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IngredientForm;
