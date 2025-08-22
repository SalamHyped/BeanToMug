import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useSuppliers } from '../../../../SupplierManagement/hooks';
import { useSupplierIngredients } from '../../../hooks';
import styles from './index.module.css';

const ProductOrderFormBase = ({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isLoading = false,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_start_date: '',
    order_end_date: '',
    notes: '',
    ...initialData
  });
  const [orderItems, setOrderItems] = useState(initialData.items || []);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [errors, setErrors] = useState({});

  const { 
    suppliers, 
    loading: suppliersLoading 
  } = useSuppliers();

  const { 
    ingredients: supplierIngredients, 
    loading: ingredientsLoading,
    fetchSupplierIngredients 
  } = useSupplierIngredients();

  // Fetch supplier ingredients when supplier changes
  useEffect(() => {
    if (formData.supplier_id) {
      fetchSupplierIngredients(formData.supplier_id);
    }
  }, [formData.supplier_id, fetchSupplierIngredients]);

  useEffect(() => {
    setAvailableIngredients(supplierIngredients);
  }, [supplierIngredients]);

  // Update form when initial data changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      setOrderItems(initialData.items || []);
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddItem = () => {
    const newItem = {
      temp_id: Date.now(),
      ingredient_id: '',
      quantity_ordered: 1,
      unit_cost: 0,
      notes: ''
    };
    setOrderItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }
    
    if (mode === 'edit' && !formData.order_start_date) {
      newErrors.order_start_date = 'Order date is required';
    }
    
    if (!formData.order_end_date) {
      newErrors.order_end_date = 'Expected delivery date is required';
    }
    
    if (formData.order_start_date && formData.order_end_date && 
        new Date(formData.order_start_date) > new Date(formData.order_end_date)) {
      newErrors.order_end_date = 'Delivery date must be after order date';
    }

    // Validate items
    const validItems = orderItems.filter(item => item.ingredient_id && item.quantity_ordered > 0);
    if (validItems.length === 0) {
      newErrors.items = 'At least one valid item is required';
    }

    // Validate individual items
    orderItems.forEach((item, index) => {
      if (item.ingredient_id && (!item.quantity_ordered || item.quantity_ordered <= 0)) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.ingredient_id && (!item.unit_cost || item.unit_cost < 0)) {
        newErrors[`item_${index}_cost`] = 'Unit cost must be 0 or greater';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return orderItems
      .filter(item => item.ingredient_id && item.quantity_ordered > 0)
      .reduce((total, item) => total + (item.quantity_ordered * item.unit_cost), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const validItems = orderItems
      .filter(item => item.ingredient_id && item.quantity_ordered > 0)
      .map(item => ({
        id: item.id || null,
        ingredient_id: parseInt(item.ingredient_id),
        quantity_ordered: parseFloat(item.quantity_ordered),
        unit_cost: parseFloat(item.unit_cost),
        notes: item.notes || ''
      }));

    const orderData = {
      supplier_id: parseInt(formData.supplier_id),
      order_start_date: formData.order_start_date,
      order_end_date: formData.order_end_date,
      notes: formData.notes,
      total_price: calculateTotal(),
      items: validItems
    };

    if (onSubmit) {
      onSubmit(orderData);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Set minimum date for creation mode
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className={styles.orderForm}>
      {/* Basic Order Information */}
      <div className={styles.formSection}>
        <h3>Order Information</h3>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="supplier_id">Supplier *</label>
            <select
              id="supplier_id"
              value={formData.supplier_id}
              onChange={(e) => handleInputChange('supplier_id', e.target.value)}
              className={errors.supplier_id ? styles.error : ''}
              disabled={suppliersLoading || isLoading}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
            {errors.supplier_id && <span className={styles.errorText}>{errors.supplier_id}</span>}
          </div>

          {mode === 'edit' && (
            <div className={styles.formGroup}>
              <label htmlFor="order_start_date">Order Date *</label>
              <input
                type="date"
                id="order_start_date"
                value={formData.order_start_date}
                onChange={(e) => handleInputChange('order_start_date', e.target.value)}
                className={errors.order_start_date ? styles.error : ''}
                disabled={isLoading}
              />
              {errors.order_start_date && <span className={styles.errorText}>{errors.order_start_date}</span>}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="order_end_date">Expected Delivery *</label>
            <input
              type="date"
              id="order_end_date"
              value={formData.order_end_date}
              onChange={(e) => handleInputChange('order_end_date', e.target.value)}
              className={errors.order_end_date ? styles.error : ''}
              disabled={isLoading}
              min={mode === 'create' ? minDate : undefined}
            />
            {errors.order_end_date && <span className={styles.errorText}>{errors.order_end_date}</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Order notes or special instructions..."
            rows="3"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Order Items */}
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <h3>Order Items</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className={styles.addButton}
            disabled={!formData.supplier_id || ingredientsLoading || isLoading}
          >
            <FaPlus /> Add Item
          </button>
        </div>

        {errors.items && <div className={styles.errorText}>{errors.items}</div>}

        {orderItems.length === 0 ? (
          <div className={styles.noItems}>
            <p>No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className={styles.itemsList}>
            {orderItems.map((item, index) => (
              <div key={item.order_item_id} className={styles.orderItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemNumber}>Item {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className={styles.removeButton}
                    disabled={isLoading}
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className={styles.itemForm}>
                  <div className={styles.formGroup}>
                    <label>Ingredient *</label>
                    <select
                      value={item.ingredient_id}
                      onChange={(e) => handleItemChange(index, 'ingredient_id', e.target.value)}
                      disabled={ingredientsLoading || isLoading}
                    >
                      <option value="">Select Ingredient</option>
                      {availableIngredients.map(ingredient => (
                        <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                          {ingredient.ingredient_name} ({ingredient.brand || 'No Brand'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Quantity *</label>
                    <input
                      type="number"
                      value={item.quantity_ordered}
                      onChange={(e) => handleItemChange(index, 'quantity_ordered', e.target.value)}
                      min="0"
                      step="0.1"
                      disabled={isLoading}
                    />
                    {errors[`item_${index}_quantity`] && (
                      <span className={styles.errorText}>{errors[`item_${index}_quantity`]}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Unit Cost *</label>
                    <input
                      type="number"
                      value={item.unit_cost}
                      onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                      min="0"
                      step="0.01"
                      disabled={isLoading}
                    />
                    {errors[`item_${index}_cost`] && (
                      <span className={styles.errorText}>{errors[`item_${index}_cost`]}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Line Total</label>
                    <div className={styles.lineTotal}>
                      {formatCurrency(item.quantity_ordered * item.unit_cost)}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Item Notes</label>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    placeholder="Special instructions for this item..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className={styles.orderSummary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Total Order Value:</span>
          <span className={styles.summaryValue}>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProductOrderFormBase;
