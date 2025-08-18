import React, { useState, useEffect } from 'react';
import styles from './ingredientTypeForm.module.css';

const IngredientTypeForm = ({ 
  type = null, 
  optionGroups = [],
  onSubmit, 
  onCancel,
  loading = false,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    option_group: '',
    is_physical: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when type changes
  useEffect(() => {
    if (type && isEditing) {
      setFormData({
        name: type.name || '',
        option_group: type.option_group || '',
        is_physical: type.is_physical !== undefined ? type.is_physical : true
      });
    } else {
      setFormData({
        name: '',
        option_group: '',
        is_physical: true
      });
    }
    setErrors({});
  }, [type, isEditing]);

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
      newErrors.name = 'Type name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Type name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Type name must be less than 50 characters';
    }

    // Option group validation
    if (!formData.option_group.trim()) {
      newErrors.option_group = 'Option group is required';
    } else if (formData.option_group.trim().length < 2) {
      newErrors.option_group = 'Option group must be at least 2 characters';
    } else if (formData.option_group.trim().length > 30) {
      newErrors.option_group = 'Option group must be less than 30 characters';
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
        option_group: formData.option_group.trim(),
        is_physical: formData.is_physical
      };

      const result = await onSubmit(submitData);
      
      if (!result?.success) {
        // Handle server-side errors
        if (result?.error) {
          if (result.error.includes('name')) {
            setErrors({ name: result.error });
          } else if (result.error.includes('option_group')) {
            setErrors({ option_group: result.error });
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

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{isEditing ? 'Edit Ingredient Type' : 'Add New Ingredient Type'}</h2>
        <p className={styles.formDescription}>
          {isEditing ? 
            'Modify the details of this ingredient type. Changes will affect how ingredients are grouped and used in dishes.' :
            'Create a new ingredient type to categorize ingredients and define how they\'re used in dish customization.'
          }
        </p>
      </div>

      {errors.general && (
        <div className={styles.generalError}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Type Name */}
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Type Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="e.g., Milk Type, Syrup Flavor, Coffee Size"
            disabled={isFormDisabled}
            maxLength={50}
          />
          {errors.name && (
            <span className={styles.errorText}>{errors.name}</span>
          )}
          <div className={styles.inputHelp}>
            A descriptive name for this ingredient type (2-50 characters)
          </div>
        </div>

        {/* Option Group */}
        <div className={styles.formGroup}>
          <label htmlFor="option_group" className={styles.label}>
            Option Group *
          </label>
          <div className={styles.optionGroupContainer}>
            <input
              id="option_group"
              type="text"
              value={formData.option_group}
              onChange={(e) => handleChange('option_group', e.target.value)}
              className={`${styles.input} ${errors.option_group ? styles.inputError : ''}`}
              placeholder="e.g., Milk Options, Sizes, Add-ons"
              disabled={isFormDisabled}
              maxLength={30}
              list="existing-option-groups"
            />
            <datalist id="existing-option-groups">
              {optionGroups.map(group => (
                <option key={group.name} value={group.name} />
              ))}
            </datalist>
          </div>
          {errors.option_group && (
            <span className={styles.errorText}>{errors.option_group}</span>
          )}
          <div className={styles.inputHelp}>
            Groups related types together in dish customization (2-30 characters)
          </div>
          
          {/* Show existing option groups */}
          {optionGroups.length > 0 && (
            <div className={styles.existingGroups}>
              <span className={styles.existingGroupsLabel}>Existing groups:</span>
              <div className={styles.groupBadges}>
                {optionGroups.slice(0, 5).map(group => (
                  <button
                    key={group.name}
                    type="button"
                    className={styles.groupBadge}
                    onClick={() => handleChange('option_group', group.name)}
                    disabled={isFormDisabled}
                  >
                    {group.name} ({group.type_count})
                  </button>
                ))}
                {optionGroups.length > 5 && (
                  <span className={styles.moreGroups}>
                    +{optionGroups.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Physical Type Toggle */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Type Category</label>
          <div className={styles.radioGroup}>
            <div className={styles.radioOption}>
              <input
                type="radio"
                id="physical"
                name="is_physical"
                checked={formData.is_physical === true}
                onChange={() => handleChange('is_physical', true)}
                disabled={isFormDisabled}
                className={styles.radioInput}
              />
              <label htmlFor="physical" className={styles.radioLabel}>
                <div className={styles.radioContent}>
                  <strong>Physical Ingredient</strong>
                  <span>Has inventory stock (e.g., Milk, Syrup, Beans)</span>
                </div>
              </label>
            </div>
            
            <div className={styles.radioOption}>
              <input
                type="radio"
                id="non-physical"
                name="is_physical"
                checked={formData.is_physical === false}
                onChange={() => handleChange('is_physical', false)}
                disabled={isFormDisabled}
                className={styles.radioInput}
              />
              <label htmlFor="non-physical" className={styles.radioLabel}>
                <div className={styles.radioContent}>
                  <strong>Configuration Option</strong>
                  <span>No inventory needed (e.g., Extra Shot, No Ice, Temperature)</span>
                </div>
              </label>
            </div>
          </div>
          <div className={styles.inputHelp}>
            Physical ingredients track inventory, while configuration options are modifiers
          </div>
        </div>

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
            disabled={isFormDisabled}
          >
            {isSubmitting ? (
              <>
                <span className={styles.submitSpinner}>⟳</span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Type' : 'Create Type'
            )}
          </button>
        </div>
      </form>

      {/* Information Panel */}
      <div className={styles.infoPanel}>
        <h4>About Ingredient Types</h4>
        <div className={styles.infoContent}>
          <div className={styles.infoItem}>
            <strong>Purpose:</strong> Types organize ingredients into logical groups for dish customization
          </div>
          <div className={styles.infoItem}>
            <strong>Option Groups:</strong> Determine how types appear together in customer options
          </div>
          <div className={styles.infoItem}>
            <strong>Physical vs Configuration:</strong> Physical types track inventory, configuration types are modifiers
          </div>
          <div className={styles.infoItem}>
            <strong>Examples:</strong> "Milk Type" (Whole, Oat, Almond), "Size" (Small, Medium, Large), "Temperature" (Hot, Iced)
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientTypeForm;

