import React, { useState } from 'react';
import styles from './ingredientTypeList.module.css';

const IngredientTypeList = ({ 
  types = [], 
  loading = false, 
  error = null,
  filteredCount = 0,
  onEditType,
  onDeleteType
}) => {
  const [deletingTypeId, setDeletingTypeId] = useState(null);

  const handleEdit = (type) => {
    if (onEditType) {
      onEditType(type);
    }
  };

  const handleDelete = async (type) => {
    if (!onDeleteType || deletingTypeId) return;
    
    setDeletingTypeId(type.type_id);
    try {
      await onDeleteType(type.type_id);
    } finally {
      setDeletingTypeId(null);
    }
  };

  const formatIngredientCount = (count) => {
    if (count === 0) return 'No ingredients';
    if (count === 1) return '1 ingredient';
    return `${count} ingredients`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading ingredient types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h4>Error Loading Types</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (types.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>🏷️</div>
          <h3>No ingredient types found</h3>
          <p>
            {filteredCount === 0 ? 
              "No ingredient types have been created yet. Add your first type to get started!" :
              "No types match your current filters. Try adjusting your search criteria."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <h3>Ingredient Types ({filteredCount})</h3>
        <div className={styles.headerInfo}>
          <span className={styles.infoText}>
            Types define how ingredients are grouped and used in dish customization
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.typesTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Option Group</th>
              <th>Type</th>
              <th>Category</th>
              <th>Ingredients</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map(type => (
              <tr 
                key={type.type_id} 
                className={styles.tableRow}
              >
                <td className={styles.nameCell}>
                  <div className={styles.typeName}>
                    {type.name}
                  </div>
                </td>
                
                <td className={styles.optionGroupCell}>
                  <span className={styles.optionGroupBadge}>
                    {type.option_group}
                  </span>
                </td>
                
                <td className={styles.typeCell}>
                  <span className={`${styles.typeBadge} ${styles[type.is_physical ? 'physical' : 'nonPhysical']}`}>
                    {type.is_physical ? 'Physical' : 'Non-Physical'}
                  </span>
                </td>
                
                <td className={styles.categoryCell}>
                  {type.category_name ? (
                    <span className={styles.categoryName}>
                      {type.category_name}
                    </span>
                  ) : (
                    <span className={styles.noCategory}>
                      No category
                    </span>
                  )}
                </td>
                
                <td className={styles.ingredientsCell}>
                  <div className={styles.ingredientCount}>
                    <span className={`${styles.countBadge} ${
                      type.ingredient_count === 0 ? styles.zeroCount : 
                      type.ingredient_count > 10 ? styles.highCount : styles.normalCount
                    }`}>
                      {type.ingredient_count || 0}
                    </span>
                    <span className={styles.countLabel}>
                      {formatIngredientCount(type.ingredient_count || 0)}
                    </span>
                  </div>
                </td>
                
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button 
                      onClick={() => handleEdit(type)}
                      className={styles.editButton}
                      title="Edit ingredient type"
                      disabled={deletingTypeId === type.type_id}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(type)}
                      className={styles.deleteButton}
                      title="Delete ingredient type"
                      disabled={deletingTypeId === type.type_id}
                    >
                      {deletingTypeId === type.type_id ? (
                        <span className={styles.deletingSpinner}>⟳</span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.listFooter}>
        <div className={styles.footerInfo}>
          Showing {types.length} of {filteredCount} ingredient types
        </div>
        <div className={styles.footerLegend}>
          <div className={styles.legendItem}>
            <span className={`${styles.typeBadge} ${styles.physical}`}>Physical</span>
            <span className={styles.legendText}>Has stock inventory</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.typeBadge} ${styles.nonPhysical}`}>Non-Physical</span>
            <span className={styles.legendText}>Configuration only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientTypeList;

