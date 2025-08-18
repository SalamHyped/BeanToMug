import React, { useState, useEffect } from 'react';
import styles from './ingredientCategoryForm.module.css';

const IngredientCategoryForm = ({ 
  category = null, 
  availableTypes = [],
  onSubmit, 
  onCancel,
  loading = false,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type_id: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when category changes
  useEffect(() => {
    if (category && isEditing) {
      setFormData({
        name: category.category_name || '',
        type_id: category.type_id || ''
      });
    } else {
      setFormData({
        name: '',
        type_id: ''
      });
    }
    setErrors({});
  }, [category, isEditing]);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }

    // Type ID validation
    if (!formData.type_id) {
      newErrors.type_id = 'Ingredient type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        type_id: parseInt(formData.type_id)
      };

      const result = await onSubmit(submitData);
      
      if (!result?.success) {
        // Handle server-side errors
        if (result?.error) {
          if (result.error.includes('name')) {
            setErrors({ name: result.error });
          } else if (result.error.includes('type')) {
            setErrors({ type_id: result.error });
          } else {
            setErrors({ general: result.error });
          }
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const isFormDisabled = loading || isSubmitting;
  const selectedType = availableTypes.find(type => type.id === parseInt(formData.type_id));

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{isEditing ? 'Edit Ingredient Category' : 'Add New Ingredient Category'}</h2>
        <p className={styles.formDescription}>
          {isEditing ? 
            'Modify the details of this ingredient category. Note that changing the linked type will affect ingredient organization.' :
            'Create a new ingredient category by linking it to an available ingredient type. This creates a one-to-one relationship.'
          }
        </p>
      </div>

      {errors.general && (
        <div className={styles.generalError}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Category Name */}
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Category Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="e.g., Dairy Products, Coffee Syrups, Cup Sizes"
            disabled={isFormDisabled}
            maxLength={50}
          />
          {errors.name && (
            <span className={styles.errorText}>{errors.name}</span>
          )}
          <div className={styles.inputHelp}>
            A descriptive name for this category (2-50 characters)
          </div>
        </div>

        {/* Ingredient Type Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="type_id" className={styles.label}>
            Linked Ingredient Type *
          </label>
          <select
            id="type_id"
            value={formData.type_id}
            onChange={(e) => handleChange('type_id', e.target.value)}
            className={`${styles.select} ${errors.type_id ? styles.inputError : ''}`}
            disabled={isFormDisabled}
          >
            <option value="">Select an ingredient type...</option>
            {availableTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.option_group}) - {type.is_physical ? 'Physical' : 'Non-Physical'}
              </option>
            ))}
          </select>
          {errors.type_id && (
            <span className={styles.errorText}>{errors.type_id}</span>
          )}
          <div className={styles.inputHelp}>
            Choose an unassigned ingredient type to link to this category
          </div>
          
          {availableTypes.length === 0 && (
            <div className={styles.noTypesWarning}>
              <span className={styles.warningIcon}>⚠️</span>
              <span className={styles.warningText}>
                No unassigned ingredient types available. All types already have categories assigned.
              </span>
            </div>
          )}
        </div>

        {/* Selected Type Preview */}
        {selectedType && (
          <div className={styles.typePreview}>
            <h4>Selected Type Details</h4>
            <div className={styles.typeDetails}>
              <div className={styles.typeDetail}>
                <strong>Name:</strong> {selectedType.name}
              </div>
              <div className={styles.typeDetail}>
                <strong>Option Group:</strong> {selectedType.option_group}
              </div>
              <div className={styles.typeDetail}>
                <strong>Type:</strong> 
                <span className={`${styles.typeBadge} ${styles[selectedType.is_physical ? 'physical' : 'nonPhysical']}`}>
                  {selectedType.is_physical ? 'Physical' : 'Non-Physical'}
                </span>
              </div>
              <div className={styles.typeDetail}>
                <strong>Current Ingredients:</strong> {selectedType.ingredient_count || 0}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isFormDisabled || availableTypes.length === 0}
          >
            {isSubmitting ? (
              <>
                <span className={styles.submitSpinner}>⟳</span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Category' : 'Create Category'
            )}
          </button>
        </div>
      </form>

      {/* Information Panel */}
      <div className={styles.infoPanel}>
        <h4>About Ingredient Categories</h4>
        <div className={styles.infoContent}>
          <div className={styles.infoItem}>
            <strong>Purpose:</strong> Categories provide a organized way to group ingredient types
          </div>
          <div className={styles.infoItem}>
            <strong>One-to-One Relationship:</strong> Each category links to exactly one ingredient type
          </div>
          <div className={styles.infoItem}>
            <strong>Ingredient Organization:</strong> All ingredients of the linked type belong to this category
          </div>
          <div className={styles.infoItem}>
            <strong>Unlinking:</strong> Deleting a category unlinks the type, making it available for other categories
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientCategoryForm;

