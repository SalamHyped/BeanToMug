import React from 'react';
import styles from './index.module.css';

const SupplierList = ({ 
  onEditSupplier, 
  suppliers = [], 
  loading = false, 
  error = null,
  filteredCount = 0,
  filteredActiveCount = 0,
  filteredInactiveCount = 0,
  onToggleStatus,
  onDeleteSupplier,
  onRefresh
}) => {

  const handleEdit = (supplier) => {
    if (onEditSupplier) {
      onEditSupplier(supplier);
    }
  };

  const handleToggleStatus = async (supplierId, currentStatus) => {
    if (onToggleStatus) {
      const result = await onToggleStatus(supplierId, currentStatus);
      if (!result.success) {
        console.error('Failed to toggle supplier status');
      }
    }
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Are you sure you want to delete "${supplier.supplier_name}"? This action cannot be undone and may affect related ingredients and orders.`)) {
      if (onDeleteSupplier) {
        const result = await onDeleteSupplier(supplier.supplier_id);
        if (!result.success) {
          console.error('Failed to delete supplier');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading suppliers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={onRefresh} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No suppliers found matching your filters. Try adjusting your search criteria or add your first supplier to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.supplierList}>
      <div className={styles.listHeader}>
        <div className={styles.stats}>
          <h3>Filtered Results: {filteredCount} suppliers</h3>
          <div className={styles.statDetails}>
            <span className={styles.statItem}>
              <span className={styles.statLabel}>Active:</span>
              <span className={styles.statValue}>{filteredActiveCount}</span>
            </span>
            <span className={styles.statItem}>
              <span className={styles.statLabel}>Inactive:</span>
              <span className={styles.statValue}>{filteredInactiveCount}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.suppliersTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact Info</th>
              <th>Ingredients</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.supplier_id} className={`${styles.tableRow} ${!supplier.status ? styles.inactiveSupplier : ''}`}>
                <td className={styles.nameCell}>
                  <h4>{supplier.supplier_name}</h4>
                  <small>ID: {supplier.supplier_id}</small>
                </td>
                <td className={styles.contactCell}>
                  <div className={styles.contactInfo}>
                    {supplier.phone_number && (
                      <div className={styles.contactItem}>
                        📞 {supplier.phone_number}
                      </div>
                    )}
                    {supplier.email && (
                      <div className={styles.contactItem}>
                        📧 {supplier.email}
                      </div>
                    )}
                    {!supplier.phone_number && !supplier.email && (
                      <span className={styles.noContact}>No contact info</span>
                    )}
                  </div>
                </td>
                <td className={styles.ingredientsCell}>
                  <div className={styles.ingredientInfo}>
                    <span className={styles.ingredientCount}>
                      {supplier.ingredient_count || 0} ingredients
                    </span>
                    {supplier.ingredients_list && (
                      <div className={styles.ingredientsList} title={supplier.ingredients_list}>
                        {supplier.ingredients_list.length > 50 
                          ? `${supplier.ingredients_list.substring(0, 50)}...`
                          : supplier.ingredients_list
                        }
                      </div>
                    )}
                  </div>
                </td>
                <td className={styles.statusCell}>
                  <span className={`${styles.status} ${styles[supplier.status ? 'active' : 'inactive']}`}>
                    {supplier.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button 
                    onClick={() => handleEdit(supplier)}
                    className={styles.editButton}
                    title="Edit supplier details"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(supplier.supplier_id, supplier.status)}
                    className={`${styles.statusButton} ${styles[supplier.status ? 'deactivate' : 'activate']}`}
                    title={supplier.status ? 'Deactivate supplier' : 'Activate supplier'}
                  >
                    {supplier.status ? '🚫 Deactivate' : '✅ Activate'}
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier)}
                    className={styles.deleteButton}
                    title="Delete supplier"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierList;
