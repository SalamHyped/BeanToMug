import React, { useState, useEffect } from 'react';
import useIngredientEffects from './MenuManagement/hooks/useIngredientEffects';
import styles from './IngredientEffectsManagement.module.css';

const IngredientEffectsManagement = () => {
  const { effects, options, loading, error, createEffect, deleteEffect } = useIngredientEffects();
  const [formData, setFormData] = useState({
    item_id: '',
    option_ingredient_id: '',
    target_ingredient_id: '',
    multiplier: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    
    const result = await createEffect(formData);
    if (result.success) {
      setFormData({ item_id: '', option_ingredient_id: '', target_ingredient_id: '', multiplier: '' });
      setSubmitSuccess('Effect created successfully!');
    } else {
      setSubmitError(result.error || 'Failed to create effect');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (effectId) => {
    if (!confirm('Are you sure you want to delete this effect?')) return;
    
    const result = await deleteEffect(effectId);
    if (result.success) {
      setSubmitSuccess('Effect deleted successfully!');
      setSubmitError(null);
    } else {
      setSubmitError(result.error || 'Failed to delete effect');
      setSubmitSuccess(null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading ingredient effects...</div>;

  return (
    <div className={styles.container}>
      <h2>Ingredient Effects Management</h2>
      <p className={styles.description}>
        Set up how non-physical options (like "big size") affect the stock consumption of physical ingredients.
      </p>

      {/* Create Effect Form */}
      <div className={styles.formSection}>
        <h3>Create New Effect</h3>
        
  
        {/* Success Message */}
        {submitSuccess && (
          <div className={styles.successMessage}>
            ✅ {submitSuccess}
          </div>
        )}
        
        {/* Form Error Message */}
        {submitError && (
          <div className={styles.errorMessage}>
            ❌ {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Dish:</label>
              <select 
                value={formData.item_id} 
                onChange={(e) => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
                required
              >
                <option value="">Select a dish</option>
                {options.dishes.map(dish => (
                  <option key={dish.item_id} value={dish.item_id}>
                    {dish.item_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Option (Non-Physical):</label>
              <select 
                value={formData.option_ingredient_id} 
                onChange={(e) => setFormData(prev => ({ ...prev, option_ingredient_id: e.target.value }))}
                required
              >
                <option value="">Select option ingredient</option>
                {options.optionIngredients.map(ingredient => (
                  <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                    {ingredient.ingredient_name} ({ingredient.type_name})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Target (Physical):</label>
              <select 
                value={formData.target_ingredient_id} 
                onChange={(e) => setFormData(prev => ({ ...prev, target_ingredient_id: e.target.value }))}
                required
              >
                <option value="">Select target ingredient</option>
                {options.targetIngredients.map(ingredient => (
                  <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                    {ingredient.ingredient_name} ({ingredient.type_name})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Multiplier:</label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                value={formData.multiplier}
                onChange={(e) => setFormData(prev => ({ ...prev, multiplier: e.target.value }))}
                placeholder="e.g., 1.30 for 30% more"
                required
              />
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? 'Creating...' : 'Create Effect'}
            </button>
          </div>
        </form>
      </div>

      {/* Effects List */}
      <div className={styles.listSection}>
        <h3>Current Effects ({effects.length})</h3>
        {effects.length === 0 ? (
          <p className={styles.noData}>No effects configured yet.</p>
        ) : (
          <div className={styles.effectsList}>
            {effects.map(effect => (
              <div key={effect.effect_id} className={styles.effectCard}>
                <div className={styles.effectInfo}>
                  <div className={styles.effectTitle}>
                    <strong>{effect.item_name}</strong>
                  </div>
                  <div className={styles.effectDescription}>
                    When <span className={styles.option}>{effect.option_ingredient_name}</span> is selected,
                    it affects <span className={styles.target}>{effect.target_ingredient_name}</span> 
                    by <span className={styles.multiplier}>{effect.multiplier}x</span>
                  </div>
                  <div className={styles.effectDetails}>
                    Option Type: {effect.option_type_name} | Target Type: {effect.target_type_name}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(effect.effect_id)}
                  className={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientEffectsManagement;
