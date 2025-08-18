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
    type_ids: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when category changes
  useEffect(() => {
    if (category && isEditing) {
      setFormData({
        name: category.category_name || '',
        type_ids: category.type_id ? [category.type_id] : []
      });
    } else {
      setFormData({
        name: '',
        type_ids: []
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

  // Handle type selection (toggle)
  const handleTypeToggle = (typeId) => {
    const currentIds = formData.type_ids || [];
    const isSelected = currentIds.includes(typeId) || currentIds.includes(typeId.toString());
    
    let newTypeIds;
    // Allow multiple selection for both creating and editing
    if (isSelected) {
      // Remove from selection
      newTypeIds = currentIds.filter(id => id != typeId);
    } else {
      // Add to selection
      newTypeIds = [...currentIds, typeId];
    }
    
    handleChange('type_ids', newTypeIds);
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

    // Type IDs validation
    if (!formData.type_ids || formData.type_ids.length === 0) {
      newErrors.type_ids = 'At least one ingredient type is required';
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
        type_ids: formData.type_ids.map(id => parseInt(id))
      };

      const result = await onSubmit(submitData);
      
      if (!result?.success) {
        // Handle server-side errors
        if (result?.error) {
          if (result.error.includes('name')) {
            setErrors({ name: result.error });
          } else if (result.error.includes('type')) {
            setErrors({ type_ids: result.error });
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
  const selectedTypes = availableTypes.filter(type => 
    formData.type_ids.includes(type.type_id) || formData.type_ids.includes(type.type_id.toString())
  );

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{isEditing ? 'Edit Ingredient Category' : 'Add New Ingredient Category'}</h2>
        <p className={styles.formDescription}>
          {isEditing ? 
            'Modify this category. You can change the name and add/remove ingredient types. Selecting multiple types will expand this category to cover all selected types.' :
            'Create a new ingredient category by selecting one or more ingredient types. This will create separate category records for each selected type with the same name.'
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
          <label className={styles.label}>
            Linked Ingredient Types *
          </label>
          <div className={styles.typeSelectionContainer}>
            {availableTypes.length > 0 ? (
              <div className={styles.typeCheckboxList}>
                {availableTypes.map(type => {
                  const isSelected = formData.type_ids.includes(type.type_id) || 
                                   formData.type_ids.includes(type.type_id.toString());
                  return (
                    <div key={type.type_id} className={styles.typeCheckboxItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTypeToggle(type.type_id)}
                          disabled={isFormDisabled}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          <strong>{type.type_name}</strong> ({type.option_group})
                          <br />
                          <small className={styles.typeDetails}>
                            {type.is_physical ? 'Physical' : 'Non-Physical'}
                            {type.category_count > 0 ? ` • ${type.category_count} existing categories` : ' • No existing categories'}
                          </small>
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noTypesWarning}>
                <span className={styles.warningIcon}>⚠️</span>
                <span className={styles.warningText}>
                  No ingredient types available. Please create ingredient types first.
                </span>
              </div>
            )}
          </div>
          
          {errors.type_ids && (
            <span className={styles.errorText}>{errors.type_ids}</span>
          )}
          <div className={styles.inputHelp}>
            Select one or more ingredient types for this category. Multiple types will create separate records with the same category name.
          </div>
          
          {formData.type_ids.length > 0 && (
            <div className={styles.selectedTypesInfo}>
              <strong>Selected:</strong> {formData.type_ids.length} type{formData.type_ids.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Selected Types Preview */}
        {selectedTypes.length > 0 && (
          <div className={styles.typePreview}>
            <h4>Selected Types Summary ({selectedTypes.length})</h4>
            <div className={styles.selectedTypesList}>
              {selectedTypes.map(type => (
                <div key={type.type_id} className={styles.selectedTypeItem}>
                  <div className={styles.typeHeader}>
                    <strong>{type.type_name}</strong>
                    <span className={`${styles.typeBadge} ${styles[type.is_physical ? 'physical' : 'nonPhysical']}`}>
                      {type.is_physical ? 'Physical' : 'Non-Physical'}
                    </span>
                  </div>
                  <div className={styles.typeSubInfo}>
                    Option Group: {type.option_group} • Existing Categories: {type.category_count || 0}
                  </div>
                </div>
              ))}
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
            <strong>Flexible Relationship:</strong> Multiple categories can be linked to the same ingredient type
          </div>
          <div className={styles.infoItem}>
            <strong>Ingredient Organization:</strong> All ingredients of the linked type can belong to multiple categories
          </div>
          <div className={styles.infoItem}>
            <strong>Flexibility:</strong> You can create specialized categories for different use cases of the same ingredient type
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientCategoryForm;

