import React, { useState } from 'react';
import { useSupplierEditor } from '../../hooks';
import styles from './index.module.css';

const SupplierForm = ({ onSupplierCreated, onCancel }) => {
  const { createSupplier, loading, error } = useSupplierEditor();
  
  const [formData, setFormData] = useState({
    supplier_name: '',
    phone_number: '',
    email: '',
    status: 1
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.supplier_name.trim()) {
      errors.supplier_name = 'Supplier name is required';
    } else if (formData.supplier_name.trim().length < 2) {
      errors.supplier_name = 'Supplier name must be at least 2 characters';
    } else if (formData.supplier_name.trim().length > 255) {
      errors.supplier_name = 'Supplier name must not exceed 255 characters';
    }
    
    // Email validation (optional)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    // Phone validation (optional)
    if (formData.phone_number.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone_number.trim())) {
        errors.phone_number = 'Please enter a valid phone number';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      const submitData = {
        supplier_name: formData.supplier_name.trim(),
        phone_number: formData.phone_number.trim() || null,
        email: formData.email.trim() || null,
        status: formData.status
      };
      
      const result = await createSupplier(submitData);
      
      if (result.success) {
        if (onSupplierCreated) {
          await onSupplierCreated(result.supplier);
        }
        
        // Reset form
        setFormData({
          supplier_name: '',
          phone_number: '',
          email: '',
          status: 1
        });
        setValidationErrors({});
      }
    } catch (err) {
      console.error('Error creating supplier:', err);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>➕ Add New Supplier</h2>
        <p>Add a new supplier to manage ingredients and product orders</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.supplierForm}>
        {error && (
          <div className={styles.errorAlert}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="supplier_name" className={styles.label}>
              Supplier Name <span className={styles.required}>*</span>
            </label>
            <input
              id="supplier_name"
              type="text"
              value={formData.supplier_name}
              onChange={(e) => handleInputChange('supplier_name', e.target.value)}
              className={`${styles.input} ${validationErrors.supplier_name ? styles.inputError : ''}`}
              placeholder="Enter supplier name"
              disabled={loading}
              maxLength={255}
            />
            {validationErrors.supplier_name && (
              <span className={styles.errorText}>{validationErrors.supplier_name}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
              className={styles.select}
              disabled={loading}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="phone_number" className={styles.label}>
              Phone Number
            </label>
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={`${styles.input} ${validationErrors.phone_number ? styles.inputError : ''}`}
              placeholder="e.g., +1 (555) 123-4567"
              disabled={loading}
            />
            {validationErrors.phone_number && (
              <span className={styles.errorText}>{validationErrors.phone_number}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
              placeholder="supplier@example.com"
              disabled={loading}
            />
            {validationErrors.email && (
              <span className={styles.errorText}>{validationErrors.email}</span>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleCancel}
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
            {loading ? 'Creating...' : '➕ Create Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
