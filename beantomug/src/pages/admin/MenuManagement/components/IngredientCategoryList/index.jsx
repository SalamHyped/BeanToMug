import React, { useState } from 'react';
import styles from './ingredientCategoryList.module.css';

const IngredientCategoryList = ({ 
  categories = [], 
  loading = false, 
  error = null,
  filteredCount = 0,
  onEditCategory,
  onDeleteCategory
}) => {
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const handleEdit = (category) => {
    if (onEditCategory) {
      onEditCategory(category);
    }
  };

  const handleDelete = async (category) => {
    if (!onDeleteCategory || deletingCategoryId) return;
    
    setDeletingCategoryId(category.category_id);
    try {
      await onDeleteCategory(category.category_id);
    } finally {
      setDeletingCategoryId(null);
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
        <p>Loading ingredient categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h4>Error Loading Categories</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>📂</div>
          <h3>No ingredient categories found</h3>
          <p>
            {filteredCount === 0 ? 
              "No ingredient categories have been created yet. Add your first category to get started!" :
              "No categories match your current filters. Try adjusting your search criteria."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <h3>Ingredient Categories ({filteredCount})</h3>
        <div className={styles.headerInfo}>
          <span className={styles.infoText}>
            Categories organize ingredient types and their associated ingredients
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.categoriesTable}>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Linked Type</th>
              <th>Option Group</th>
              <th>Type Category</th>
              <th>Ingredients</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr 
                key={category.category_id} 
                className={styles.tableRow}
              >
                <td className={styles.nameCell}>
                  <div className={styles.categoryName}>
                    {category.category_name}
                  </div>
                </td>
                
                <td className={styles.typeCell}>
                  <span className={styles.typeName}>
                    {category.type_name}
                  </span>
                </td>
                
                <td className={styles.optionGroupCell}>
                  <span className={styles.optionGroupBadge}>
                    {category.type_option_group}
                  </span>
                </td>
                
                <td className={styles.typeCategoryCell}>
                  <span className={`${styles.typeBadge} ${styles[category.type_is_physical ? 'physical' : 'nonPhysical']}`}>
                    {category.type_is_physical ? 'Physical' : 'Non-Physical'}
                  </span>
                </td>
                
                <td className={styles.ingredientsCell}>
                  <div className={styles.ingredientCount}>
                    <span className={`${styles.countBadge} ${
                      category.ingredient_count === 0 ? styles.zeroCount : 
                      category.ingredient_count > 10 ? styles.highCount : styles.normalCount
                    }`}>
                      {category.ingredient_count || 0}
                    </span>
                    <span className={styles.countLabel}>
                      {formatIngredientCount(category.ingredient_count || 0)}
                    </span>
                  </div>
                </td>
                
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button 
                      onClick={() => handleEdit(category)}
                      className={styles.editButton}
                      title="Edit ingredient category"
                      disabled={deletingCategoryId === category.category_id}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(category)}
                      className={styles.deleteButton}
                      title="Delete ingredient category"
                      disabled={deletingCategoryId === category.category_id}
                    >
                      {deletingCategoryId === category.category_id ? (
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
          Showing {categories.length} of {filteredCount} ingredient categories
        </div>
        <div className={styles.footerNote}>
          <strong>Note:</strong> Deleting a category will unlink its ingredient type, making it available for other categories
        </div>
      </div>
    </div>
  );
};

export default IngredientCategoryList;

