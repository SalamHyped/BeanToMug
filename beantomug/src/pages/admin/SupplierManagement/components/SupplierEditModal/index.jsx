import React, { useState, useEffect } from 'react';
import { useSupplierEditor } from '../../hooks';
import styles from './index.module.css';

const SupplierEditModal = ({ isOpen, onClose, supplierId, onSupplierUpdated }) => {
  const { supplier, loading, error, fetchSupplier, updateSupplier, resetState } = useSupplierEditor();
  
  const [formData, setFormData] = useState({
    supplier_name: '',
    phone_number: '',
    email: '',
    status: 1
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load supplier data when modal opens
  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplier(supplierId);
    } else if (!isOpen) {
      resetState();
      setValidationErrors({});
    }
  }, [isOpen, supplierId, fetchSupplier, resetState]);

  // Update form data when supplier is loaded
  useEffect(() => {
    if (supplier) {
      setFormData({
        supplier_name: supplier.supplier_name || '',
        phone_number: supplier.phone_number || '',
        email: supplier.email || '',
        status: supplier.status
      });
    }
  }, [supplier]);

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
    
    setSubmitLoading(true);
    
    try {
      const submitData = {
        supplier_name: formData.supplier_name.trim(),
        phone_number: formData.phone_number.trim() || null,
        email: formData.email.trim() || null,
        status: formData.status
      };
      
      const result = await updateSupplier(supplierId, submitData);
      
      if (result.success) {
        if (onSupplierUpdated) {
          await onSupplierUpdated(result.supplier);
        }
        onClose();
      }
    } catch (err) {
      console.error('Error updating supplier:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !submitLoading) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>✏️ Edit Supplier</h2>
          <button 
            onClick={handleClose} 
            className={styles.closeButton}
            disabled={loading || submitLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loadingContainer}>
              <p>Loading supplier details...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {supplier && !loading && (
            <form onSubmit={handleSubmit} className={styles.supplierForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="edit_supplier_name" className={styles.label}>
                    Supplier Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="edit_supplier_name"
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                    className={`${styles.input} ${validationErrors.supplier_name ? styles.inputError : ''}`}
                    placeholder="Enter supplier name"
                    disabled={submitLoading}
                    maxLength={255}
                  />
                  {validationErrors.supplier_name && (
                    <span className={styles.errorText}>{validationErrors.supplier_name}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="edit_status" className={styles.label}>
                    Status
                  </label>
                  <select
                    id="edit_status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
                    className={styles.select}
                    disabled={submitLoading}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="edit_phone_number" className={styles.label}>
                    Phone Number
                  </label>
                  <input
                    id="edit_phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={`${styles.input} ${validationErrors.phone_number ? styles.inputError : ''}`}
                    placeholder="e.g., +1 (555) 123-4567"
                    disabled={submitLoading}
                  />
                  {validationErrors.phone_number && (
                    <span className={styles.errorText}>{validationErrors.phone_number}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="edit_email" className={styles.label}>
                    Email Address
                  </label>
                  <input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
                    placeholder="supplier@example.com"
                    disabled={submitLoading}
                  />
                  {validationErrors.email && (
                    <span className={styles.errorText}>{validationErrors.email}</span>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelButton}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Updating...' : '💾 Update Supplier'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierEditModal;
