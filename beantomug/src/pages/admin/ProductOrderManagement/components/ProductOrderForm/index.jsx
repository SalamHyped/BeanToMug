import React, { useState, useEffect } from 'react';
import styles from './index.module.css';
import { useSuppliers } from '../../../SupplierManagement/hooks';
import { useSupplierIngredients, useProductOrderEditor } from '../../hooks';

const ProductOrderForm = ({ onOrderCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_end_date: '',
    items: []
  });
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());
  const [itemQuantities, setItemQuantities] = useState({});
  const [itemCosts, setItemCosts] = useState({});
  const [errors, setErrors] = useState({});

  // Hooks
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { 
    ingredients, 
    supplier: selectedSupplier, 
    loading: ingredientsLoading, 
    fetchSupplierIngredients 
  } = useSupplierIngredients();
  const { createOrder, loading: creatingOrder, error: orderError } = useProductOrderEditor();

  // Get active suppliers only
  const activeSuppliers = suppliers.filter(supplier => supplier.status === 1);

  // Handle supplier selection
  const handleSupplierChange = async (e) => {
    const supplierId = e.target.value;
    setFormData(prev => ({ ...prev, supplier_id: supplierId }));
    setSelectedIngredients(new Set());
    setItemQuantities({});
    setItemCosts({});
    setErrors({});

    if (supplierId) {
      await fetchSupplierIngredients(supplierId);
    }
  };

  // Handle ingredient selection
  const handleIngredientToggle = (ingredientId) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredientId)) {
      newSelected.delete(ingredientId);
      // Remove quantities and costs for deselected ingredients
      const newQuantities = { ...itemQuantities };
      const newCosts = { ...itemCosts };
      delete newQuantities[ingredientId];
      delete newCosts[ingredientId];
      setItemQuantities(newQuantities);
      setItemCosts(newCosts);
    } else {
      newSelected.add(ingredientId);
      // Set default cost to ingredient's current price
      const ingredient = ingredients.find(ing => ing.ingredient_id === ingredientId);
      if (ingredient) {
        setItemCosts(prev => ({ ...prev, [ingredientId]: ingredient.price }));
      }
    }
    setSelectedIngredients(newSelected);
  };

  // Handle quantity change
  const handleQuantityChange = (ingredientId, quantity) => {
    setItemQuantities(prev => ({ ...prev, [ingredientId]: quantity }));
  };

  // Handle cost change
  const handleCostChange = (ingredientId, cost) => {
    setItemCosts(prev => ({ ...prev, [ingredientId]: cost }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Please select a supplier';
    }

    if (!formData.order_end_date) {
      newErrors.order_end_date = 'Please select an expected delivery date';
    } else {
      const selectedDate = new Date(formData.order_end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.order_end_date = 'Delivery date cannot be in the past';
      }
    }

    if (selectedIngredients.size === 0) {
      newErrors.ingredients = 'Please select at least one ingredient';
    }

    // Validate individual items
    selectedIngredients.forEach(ingredientId => {
      const quantity = itemQuantities[ingredientId];
      const cost = itemCosts[ingredientId];

      if (!quantity || parseFloat(quantity) <= 0) {
        newErrors[`quantity_${ingredientId}`] = 'Quantity must be greater than 0';
      }

      if (!cost || parseFloat(cost) <= 0) {
        newErrors[`cost_${ingredientId}`] = 'Cost must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate total cost
  const calculateTotal = () => {
    let total = 0;
    selectedIngredients.forEach(ingredientId => {
      const quantity = parseFloat(itemQuantities[ingredientId]) || 0;
      const cost = parseFloat(itemCosts[ingredientId]) || 0;
      total += quantity * cost;
    });
    return total.toFixed(2);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare items data
    const items = Array.from(selectedIngredients).map(ingredientId => ({
      ingredient_id: parseInt(ingredientId),
      quantity_ordered: parseFloat(itemQuantities[ingredientId]),
      unit_cost: parseFloat(itemCosts[ingredientId])
    }));

    const orderData = {
      supplier_id: parseInt(formData.supplier_id),
      order_end_date: formData.order_end_date,
      items
    };

    const result = await createOrder(orderData);
    
    if (result.success && onOrderCreated) {
      onOrderCreated();
    }
  };

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>➕ Create New Product Order</h2>
        <p>Create a new order for ingredients from suppliers</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.orderForm}>
        {/* Supplier Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="supplier_id" className={styles.label}>
            Supplier *
          </label>
          <select
            id="supplier_id"
            value={formData.supplier_id}
            onChange={handleSupplierChange}
            className={`${styles.select} ${errors.supplier_id ? styles.error : ''}`}
            disabled={suppliersLoading}
          >
            <option value="">
              {suppliersLoading ? 'Loading suppliers...' : 'Select a supplier'}
            </option>
            {activeSuppliers.map(supplier => (
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
          {errors.supplier_id && (
            <span className={styles.errorText}>{errors.supplier_id}</span>
          )}
        </div>

        {/* Expected Delivery Date */}
        <div className={styles.formGroup}>
          <label htmlFor="order_end_date" className={styles.label}>
            Expected Delivery Date *
          </label>
          <input
            type="date"
            id="order_end_date"
            value={formData.order_end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, order_end_date: e.target.value }))}
            min={minDate}
            className={`${styles.input} ${errors.order_end_date ? styles.error : ''}`}
          />
          {errors.order_end_date && (
            <span className={styles.errorText}>{errors.order_end_date}</span>
          )}
        </div>

        {/* Supplier Info */}
        {selectedSupplier && (
          <div className={styles.supplierInfo}>
            <h3>📞 {selectedSupplier.supplier_name}</h3>
            <div className={styles.supplierDetails}>
              {selectedSupplier.phone_number && (
                <span>📱 {selectedSupplier.phone_number}</span>
              )}
              {selectedSupplier.email && (
                <span>✉️ {selectedSupplier.email}</span>
              )}
            </div>
          </div>
        )}

        {/* Ingredients Selection */}
        {formData.supplier_id && (
          <div className={styles.ingredientsSection}>
            <div className={styles.sectionHeader}>
              <h3>🥤 Select Ingredients</h3>
              {errors.ingredients && (
                <span className={styles.errorText}>{errors.ingredients}</span>
              )}
            </div>

            {ingredientsLoading ? (
              <div className={styles.loading}>Loading ingredients...</div>
            ) : ingredients.length === 0 ? (
              <div className={styles.empty}>
                No ingredients available for this supplier
              </div>
            ) : (
              <div className={styles.ingredientsList}>
                {ingredients.map(ingredient => (
                  <div 
                    key={ingredient.ingredient_id} 
                    className={`${styles.ingredientItem} ${selectedIngredients.has(ingredient.ingredient_id) ? styles.selected : ''}`}
                  >
                    <div className={styles.ingredientHeader}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedIngredients.has(ingredient.ingredient_id)}
                          onChange={() => handleIngredientToggle(ingredient.ingredient_id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.ingredientName}>
                          {ingredient.ingredient_name}
                        </span>
                      </label>
                      <div className={styles.ingredientInfo}>
                        <span className={styles.unit}>({ingredient.unit})</span>
                        <span className={styles.currentPrice}>
                          Current: ${ingredient.price}
                        </span>
                        {ingredient.is_low_stock && (
                          <span className={styles.lowStock}>⚠️ Low Stock</span>
                        )}
                      </div>
                    </div>

                    {selectedIngredients.has(ingredient.ingredient_id) && (
                      <div className={styles.ingredientInputs}>
                        <div className={styles.inputGroup}>
                          <label>Quantity ({ingredient.unit})</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={itemQuantities[ingredient.ingredient_id] || ''}
                            onChange={(e) => handleQuantityChange(ingredient.ingredient_id, e.target.value)}
                            className={`${styles.input} ${errors[`quantity_${ingredient.ingredient_id}`] ? styles.error : ''}`}
                            placeholder="Enter quantity"
                          />
                          {errors[`quantity_${ingredient.ingredient_id}`] && (
                            <span className={styles.errorText}>
                              {errors[`quantity_${ingredient.ingredient_id}`]}
                            </span>
                          )}
                        </div>

                        <div className={styles.inputGroup}>
                          <label>Unit Cost ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={itemCosts[ingredient.ingredient_id] || ''}
                            onChange={(e) => handleCostChange(ingredient.ingredient_id, e.target.value)}
                            className={`${styles.input} ${errors[`cost_${ingredient.ingredient_id}`] ? styles.error : ''}`}
                            placeholder="Enter cost per unit"
                          />
                          {errors[`cost_${ingredient.ingredient_id}`] && (
                            <span className={styles.errorText}>
                              {errors[`cost_${ingredient.ingredient_id}`]}
                            </span>
                          )}
                        </div>

                        <div className={styles.lineTotal}>
                          <strong>
                            Line Total: $
                            {((parseFloat(itemQuantities[ingredient.ingredient_id]) || 0) * 
                              (parseFloat(itemCosts[ingredient.ingredient_id]) || 0)).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Summary */}
        {selectedIngredients.size > 0 && (
          <div className={styles.orderSummary}>
            <h3>📋 Order Summary</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span>Selected Items:</span>
                <span>{selectedIngredients.size}</span>
              </div>
              <div className={styles.summaryItem}>
                <span>Total Cost:</span>
                <span className={styles.totalCost}>${calculateTotal()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {orderError && (
          <div className={styles.orderError}>
            <p>{orderError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={creatingOrder}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={creatingOrder || selectedIngredients.size === 0}
          >
            {creatingOrder ? 'Creating Order...' : `➕ Create Order ($${calculateTotal()})`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductOrderForm;
