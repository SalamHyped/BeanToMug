import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useCategories from '../../hooks/useCategories';
import useIngredients from '../../hooks/useIngredients';
import useDishes from '../../hooks/useDishes';
import useOptionTypes from '../../hooks/useOptionTypes';
import styles from './index.module.css';
import RoundedPhoto from '../../../../../components/roundedPhoto/RoundedPhoto';
import { getApiConfig } from '../../../../../utils/config';

const DishForm = ({ onDishCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    price: '',
    category_id: '',
    item_photo_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Use hooks for data fetching
  const { categories } = useCategories();
  const { 
    groupedIngredients, 
    categoryNames, 
    getTypesByCategory, 
    getIngredientsByCategoryAndType, 
    ingredientTypes,
    selectedIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    clearIngredients,
    getValidIngredients
  } = useIngredients();
  const { createDish } = useDishes();
  const { 
    relevantOptionTypes
  } = useOptionTypes(ingredientTypes, selectedIngredients);

  // Helper function to check if an ingredient type is physical
  const isIngredientTypePhysical = useCallback((typeId) => {
    const type = ingredientTypes.find(t => t.type_id === typeId);
    return type ? type.is_physical : false;
  }, [ingredientTypes]);

  // Simple derived state for option type slots based on unique ingredient types
  const optionTypeSlots = useMemo(() => {
    const uniqueTypeIds = [...new Set(selectedIngredients.map(ing => ing.type_id).filter(Boolean))];
    return Array.from({ length: uniqueTypeIds.length }, (_, index) => ({
      type_id: '',
      is_required: false,
      is_multiple: false
    }));
  }, [selectedIngredients]);

  // Simple state for option types that gets reset when slots change
  const [optionTypes, setOptionTypes] = useState([]);

  // Reset option types when slots change
  useEffect(() => {
    setOptionTypes(optionTypeSlots);
  }, [optionTypeSlots]);

  const updateOptionType = useCallback((index, field, value) => {
    setOptionTypes(prev => prev.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    ));
  }, []);

  const getValidOptionTypes = useCallback(() => {
    return optionTypes.filter(option => option.type_id);
  }, [optionTypes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      setError('');
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      
      const response = await fetch(`${getApiConfig().baseURL}/dishes/upload-photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success) {
        const photoUrl = data.data.photo_url;
        // Update form data to show the uploaded photo
        setFormData(prev => ({ ...prev, item_photo_url: photoUrl }));
        return photoUrl;
      } else {
        throw new Error(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo: ' + error.message);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic required field validation
    if (!formData.item_name || !formData.price || !formData.category_id) {
      setError('Please fill in all required fields (Dish Name, Price, and Category)');
      return;
    }

    // Validate price is a positive number
    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid positive price');
      return;
    }

    // Validate that at least one ingredient is selected
    if (selectedIngredients.length === 0) {
      setError('Please add at least one ingredient to the dish');
      return;
    }

    // Validate that all selected ingredients are complete
    const incompleteIngredients = selectedIngredients.filter(ingredient => 
      !ingredient.category || !ingredient.type || !ingredient.ingredient_id
    );
    
    if (incompleteIngredients.length > 0) {
      setError('Please complete all ingredient selections (Category, Type, and Ingredient)');
      return;
    }

    // Validate that physical ingredient types have quantities
    const hasInvalidIngredients = selectedIngredients.some(ingredient => {
      if (!ingredient.ingredient_id) return false; // Skip incomplete ingredients
      
      // If ingredient type is physical, quantity is required
      if (ingredient.type_id && isIngredientTypePhysical(ingredient.type_id)) {
        if (!ingredient.quantity_required || ingredient.quantity_required <= 0) {
          return true; // Invalid - physical ingredient type missing quantity
        }
      }
      
      return false; // Valid
    });

    if (hasInvalidIngredients) {
      setError('Please provide valid quantities (greater than 0) for all physical ingredient types');
      return;
    }

    // Validate option types if any are selected
    const invalidOptionTypes = optionTypes.filter(option => 
      option.type_id && (!option.type_id || option.type_id === '')
    );
    
    if (invalidOptionTypes.length > 0) {
      setError('Please complete all option type selections or remove incomplete ones');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload photo first if one is selected
      let photoUrl = formData.item_photo_url;
      if (photoFile) {
        photoUrl = await uploadPhoto();
        if (!photoUrl) {
          setLoading(false);
          return; // Error already set by uploadPhoto
        }
      }

      const dishData = {
        ...formData,
        price: parseFloat(formData.price),
        item_photo_url: photoUrl,
        ingredients: getValidIngredients(),
        optionTypes: getValidOptionTypes()
      };

      const result = await createDish(dishData);

      if (result.success) {
        // Reset form
        setFormData({
          item_name: '',
          price: '',
          category_id: '',
          item_photo_url: ''
        });
        clearIngredients();
        setOptionTypes([]);
        setPhotoFile(null);
       
        if (onDishCreated) {
          onDishCreated(result.dish_id);
        }
      } else {
        setError(result.error || 'Failed to create dish');
      }
    } catch (err) {
      console.error('Error creating dish:', err);
      setError('Failed to create dish. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dishForm}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h3>Basic Information</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="item_name">Dish Name *</label>
              <input
                type="text"
                id="item_name"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                placeholder="Enter dish name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="price">Price *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category_id">Category *</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="item_photo">Dish Photo</label>
              <div className={styles.photoUpload}>
                <input
                  type="file"
                  id="item_photo"
                  name="item_photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className={styles.fileInput}
                />
                <label htmlFor="item_photo" className={styles.fileInputLabel}>
                  {photoFile ? photoFile.name : 'Choose Photo'}
                </label>
                {uploadingPhoto && <span className={styles.uploadingText}>Uploading...</span>}
              </div>
              
              {/* Photo preview */}
              {photoFile && (
                <div className={styles.photoPreview}>
                  <img 
                    src={URL.createObjectURL(photoFile)} 
                    alt="Preview" 
                    className={styles.previewImage}
                  />
                  <button 
                    type="button" 
                    onClick={() => setPhotoFile(null)}
                    className={styles.removePhotoBtn}
                  >
                    Remove
                  </button>
                </div>
              )}
              
              {/* Show uploaded photo URL if available */}
              {formData.item_photo_url && !photoFile && (
                <div className={styles.photoPreview}>
                  <RoundedPhoto 
                    src={formData.item_photo_url}
                    alt="Uploaded Photo" 
                    size={150}
                  />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, item_photo_url: '' }))}
                    className={styles.removePhotoBtn}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Ingredients</h3>
          <p className={styles.sectionDescription}>
            Add the ingredients required for this dish. 
            <br />
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              📦 Physical ingredient types (flour, milk, etc.) require quantities | ⚙️ Non-physical ingredient types (cooking methods, temperatures) don't need quantities
            </span>
          </p>
          
          {selectedIngredients.map((ingredient, index) => (
            <div key={index} className={styles.ingredientRow}>
              {/* Category Selection */}
              <div className={styles.ingredientSelect}>
                <select
                  value={ingredient.category}
                  onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                  required
                  disabled={!!ingredient.ingredient_id} // Disable if ingredient is selected
                >
                  <option value="">Select Category</option>
                  {categoryNames.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Selection */}
              <div className={styles.ingredientSelect}>
                <select
                  value={ingredient.type}
                  onChange={(e) => updateIngredient(index, 'type', e.target.value)}
                  required
                  disabled={!ingredient.category || !!ingredient.ingredient_id} // Disable if no category or ingredient is selected
                >
                  <option value="">Select Type</option>
                  {ingredient.category && getTypesByCategory(ingredient.category).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingredient Selection */}
              <div className={styles.ingredientSelect}>
                <select
                  value={ingredient.ingredient_id}
                  onChange={(e) => updateIngredient(index, 'ingredient_id', e.target.value)}
                  required
                  disabled={!ingredient.type}
                >
                  <option value="">Select Ingredient</option>
                  {ingredient.category && ingredient.type && 
                    getIngredientsByCategoryAndType(ingredient.category, ingredient.type).map(ing => (
                      <option key={ing.ingredient_id} value={ing.ingredient_id}>
                        {ing.ingredient_name} ({ing.unit}) {isIngredientTypePhysical(ingredient.type_id) ? '📦' : '⚙️'}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              {/* Quantity Input - Only show for physical ingredient types */}
              {ingredient.type_id && isIngredientTypePhysical(ingredient.type_id) && (
                <div className={styles.quantityInput}>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={ingredient.quantity_required}
                    onChange={(e) => updateIngredient(index, 'quantity_required', e.target.value)}
                    step="0.01"
                    min="0"
                    required
                    disabled={!ingredient.ingredient_id}
                  />
                </div>
              )}
              
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addIngredient}
            className={styles.addIngredientButton}
          >
            + Add Ingredient
          </button>
        </div>

        {/* Option Types Section */}
        <div className={styles.formSection}>
          <h3>Customer Options</h3>
          <p className={styles.sectionDescription}>
            Define what options customers can choose when ordering this dish (e.g., temperature, size, milk alternatives).
            <br />
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              ℹ️ Option type slots are automatically created based on unique ingredient types to avoid duplicates
            </span>
          </p>
          
          {selectedIngredients.length === 0 && (
            <div className={styles.infoMessage}>
              <p>⚠️ Add ingredients first to see relevant customer options</p>
            </div>
          )}
          
          {optionTypes.map((option, index) => (
            <div key={index} className={styles.optionTypeRow}>
              <div className={styles.optionTypeSelect}>
                <select
                  value={option.type_id}
                  onChange={(e) => updateOptionType(index, 'type_id', e.target.value)}
                  required
                >
                  <option value="">Select Option Type</option>
                  {relevantOptionTypes.map(type => (
                    <option key={type.type_id} value={type.type_id}>
                      {type.name} ({type.option_group})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.optionTypeCheckboxes}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={option.is_required}
                    onChange={(e) => updateOptionType(index, 'is_required', e.target.checked)}
                  />
                  Required
                </label>
                
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={option.is_multiple}
                    onChange={(e) => updateOptionType(index, 'is_multiple', e.target.checked)}
                  />
                  Multiple Selection
                </label>
              </div>
              
              <button
                type="button"
                onClick={() => setOptionTypes(prev => prev.filter((_, i) => i !== index))}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
          
          {relevantOptionTypes.length === 0 && selectedIngredients.length > 0 && (
            <div className={styles.infoMessage}>
              <p>ℹ️ No relevant option types found for the selected ingredients</p>
            </div>
          )}
          
          {selectedIngredients.length > 0 && (
            <div className={styles.infoMessage}>
              <p>ℹ️ {optionTypes.length} option type slots created for {[...new Set(selectedIngredients.map(ing => ing.type_id).filter(Boolean))].length} unique ingredient types</p>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Dish'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DishForm;
