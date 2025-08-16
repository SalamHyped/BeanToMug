import React, { useState } from 'react';
import styles from './ingredientList.module.css';

const IngredientList = ({ 
  ingredients = [], 
  loading, 
  error, 
  pagination,
  onEditIngredient,
  onUpdateStatus,
  onUpdateStock,
  onPageChange
}) => {
  const [stockUpdates, setStockUpdates] = useState({});
  const [updatingStock, setUpdatingStock] = useState({});

  const handleStockUpdate = async (ingredientId, newQuantity, operation = 'set') => {
    try {
      setUpdatingStock(prev => ({ ...prev, [ingredientId]: true }));
      await onUpdateStock(ingredientId, parseFloat(newQuantity), operation);
      setStockUpdates(prev => ({ ...prev, [ingredientId]: '' }));
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setUpdatingStock(prev => ({ ...prev, [ingredientId]: false }));
    }
  };

  const handleStockInputChange = (ingredientId, value) => {
    setStockUpdates(prev => ({ ...prev, [ingredientId]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const isLowStock = (ingredient) => {
    const stock = parseFloat(ingredient.quantity_in_stock || 0);
    const threshold = parseFloat(ingredient.low_stock_threshold || 0);
    return stock <= threshold;
  };

  const getStockStatus = (ingredient) => {
    const stock = parseFloat(ingredient.quantity_in_stock || 0);
    if (stock === 0) return 'out-of-stock';
    if (isLowStock(ingredient)) return 'low-stock';
    return 'in-stock';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading ingredients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error: {error}</p>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>No ingredients found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.tableContainer}>
        <table className={styles.ingredientsTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Unit</th>
              <th>Expiration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ingredient => {
              const stockStatus = getStockStatus(ingredient);
              const currentStockUpdate = stockUpdates[ingredient.ingredient_id] || '';
              
              return (
                <tr key={ingredient.ingredient_id} className={styles.ingredientRow}>
                  <td className={styles.nameCell}>
                    <div className={styles.nameContainer}>
                      <span className={styles.ingredientName}>{ingredient.ingredient_name}</span>
                      {stockStatus === 'low-stock' && (
                        <span className={styles.lowStockBadge}>Low Stock</span>
                      )}
                      {stockStatus === 'out-of-stock' && (
                        <span className={styles.outOfStockBadge}>Out of Stock</span>
                      )}
                    </div>
                  </td>
                  <td>{ingredient.category_name || 'N/A'}</td>
                  <td>{ingredient.type_name || 'N/A'}</td>
                  <td>{ingredient.brand}</td>
                  <td className={styles.priceCell}>${parseFloat(ingredient.price || 0).toFixed(2)}</td>
                  <td className={styles.stockCell}>
                    <div className={styles.stockContainer}>
                      <div className={styles.stockDisplay}>
                        <span className={`${styles.stockAmount} ${styles[stockStatus]}`}>
                          {parseFloat(ingredient.quantity_in_stock || 0).toFixed(2)}
                        </span>
                        <span className={styles.stockThreshold}>
                          (Min: {parseFloat(ingredient.low_stock_threshold || 0).toFixed(2)})
                        </span>
                      </div>
                      <div className={styles.stockUpdate}>
                        <input
                          type="number"
                          value={currentStockUpdate}
                          onChange={(e) => handleStockInputChange(ingredient.ingredient_id, e.target.value)}
                          placeholder="Update stock"
                          className={styles.stockInput}
                          disabled={updatingStock[ingredient.ingredient_id]}
                        />
                        <div className={styles.stockButtons}>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(ingredient.ingredient_id, currentStockUpdate, 'set')}
                            disabled={!currentStockUpdate || updatingStock[ingredient.ingredient_id]}
                            className={styles.setStockButton}
                            title="Set stock to this amount"
                          >
                            Set
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(ingredient.ingredient_id, currentStockUpdate, 'add')}
                            disabled={!currentStockUpdate || updatingStock[ingredient.ingredient_id]}
                            className={styles.addStockButton}
                            title="Add this amount to current stock"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{ingredient.unit}</td>
                  <td className={styles.dateCell}>{formatDate(ingredient.expiration)}</td>
                  <td className={styles.statusCell}>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(ingredient.ingredient_id, ingredient.status === 1 ? 0 : 1)}
                      className={`${styles.statusButton} ${
                        ingredient.status === 1 ? styles.activeStatus : styles.inactiveStatus
                      }`}
                    >
                      {ingredient.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      onClick={() => onEditIngredient(ingredient)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Showing page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalCount} total ingredients)
          </div>
          <div className={styles.paginationButtons}>
            <button
              type="button"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const startPage = Math.max(1, pagination.currentPage - 2);
              const pageNumber = startPage + i;
              
              if (pageNumber > pagination.totalPages) return null;
              
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`${styles.paginationButton} ${
                    pageNumber === pagination.currentPage ? styles.activePage : ''
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              type="button"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientList;
