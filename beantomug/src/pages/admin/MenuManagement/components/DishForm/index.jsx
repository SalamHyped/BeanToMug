import React, { useState } from 'react';
import { useCategories, useIngredients, useDishes } from '../../hooks';
import styles from './index.module.css';

const DishForm = ({ onDishCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    price: '',
    category_id: '',
    item_photo_url: ''
  });

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use hooks for data fetching
  const { categories } = useCategories();
  const { 
    groupedIngredients, 
    categoryNames, 
    getTypesByCategory, 
    getIngredientsByCategoryAndType 
  } = useIngredients();
  const { createDish } = useDishes();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddIngredient = () => {
    const newIngredient = {
      ingredient_id: '',
      quantity_required: '',
      category: '',
      type: '',
      unit: ''
    };
    setSelectedIngredients(prev => [...prev, newIngredient]);
  };

  const handleIngredientChange = (index, field, value) => {
    setSelectedIngredients(prev => {
      const updated = prev.map((ing, i) => {
        if (i === index) {
          const newIng = { ...ing, [field]: value };
          
          // Reset dependent fields when category or type changes
          if (field === 'category') {
            newIng.type = '';
            newIng.ingredient_id = '';
          } else if (field === 'type') {
            newIng.ingredient_id = '';
          }
          
          return newIng;
        }
        return ing;
      });
      return updated;
    });
  };

  const handleRemoveIngredient = (index) => {
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.item_name || !formData.price || !formData.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dishData = {
        ...formData,
        price: parseFloat(formData.price),
        ingredients: selectedIngredients
          .filter(ing => ing.ingredient_id && ing.quantity_required)
          .map(ing => ({
            ingredient_id: parseInt(ing.ingredient_id),
            quantity_required: parseFloat(ing.quantity_required)
          }))
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
        setSelectedIngredients([]);
        
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
              <label htmlFor="item_photo_url">Photo URL</label>
              <input
                type="url"
                id="item_photo_url"
                name="item_photo_url"
                value={formData.item_photo_url}
                onChange={handleInputChange}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Ingredients</h3>
          <p className={styles.sectionDescription}>
            Add the ingredients required for this dish
          </p>
          
          {selectedIngredients.map((ingredient, index) => (
            <div key={index} className={styles.ingredientRow}>
              {/* Category Selection */}
              <div className={styles.ingredientSelect}>
                <select
                  value={ingredient.category}
                  onChange={(e) => handleIngredientChange(index, 'category', e.target.value)}
                  required
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
                  onChange={(e) => handleIngredientChange(index, 'type', e.target.value)}
                  required
                  disabled={!ingredient.category}
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
                  onChange={(e) => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                  required
                  disabled={!ingredient.type}
                >
                  <option value="">Select Ingredient</option>
                  {ingredient.category && ingredient.type && 
                    getIngredientsByCategoryAndType(ingredient.category, ingredient.type).map(ing => (
                      <option key={ing.ingredient_id} value={ing.ingredient_id}>
                        {ing.ingredient_name} ({ing.unit})
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className={styles.quantityInput}>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ingredient.quantity_required}
                  onChange={(e) => handleIngredientChange(index, 'quantity_required', e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  disabled={!ingredient.ingredient_id}
                />
              </div>
              
              <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddIngredient}
            className={styles.addIngredientButton}
          >
            + Add Ingredient
          </button>
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
