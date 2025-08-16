import React, { useState } from 'react';
import styles from './ingredientManagement.module.css';
import useIngredientsManagement from '../../hooks/useIngredientsManagement';
import IngredientFilters from '../IngredientFilters';
import IngredientList from '../IngredientList';
import IngredientForm from '../IngredientForm';

const IngredientManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit'
  const [editingIngredient, setEditingIngredient] = useState(null);

  const {
    // State
    ingredients,
    ingredientTypes,
    loading,
    error,
    pagination,
    filters,
    
    // Actions
    createIngredient,
    updateIngredient,
    updateIngredientStatus,
    updateIngredientStock,
    updateFilters,
    changePage,
    clearError,
    
    // Computed values
    categoryNames,
    typeNames,
    totalCount,
    activeCount,
    inactiveCount,
    lowStockCount
  } = useIngredientsManagement();

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'list') {
      setEditingIngredient(null);
    }
    if (error) {
      clearError();
    }
  };

  const handleAddIngredient = () => {
    setEditingIngredient(null);
    setActiveView('add');
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setActiveView('edit');
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingIngredient) {
        // Update existing ingredient
        await updateIngredient(editingIngredient.ingredient_id, formData);
      } else {
        // Create new ingredient
        await createIngredient(formData);
      }
      
      // Return to list view on success
      setActiveView('list');
      setEditingIngredient(null);
    } catch (error) {
      // Error is handled by the hook and displayed in the UI
      throw error; // Re-throw to let form handle it
    }
  };

  const handleFormCancel = () => {
    setActiveView('list');
    setEditingIngredient(null);
  };

  const handleStatusUpdate = async (ingredientId, status) => {
    try {
      await updateIngredientStatus(ingredientId, status);
    } catch (error) {
      console.error('Error updating ingredient status:', error);
      // Error is handled by the hook and displayed in the UI
    }
  };

  const handleStockUpdate = async (ingredientId, quantity, operation) => {
    try {
      await updateIngredientStock(ingredientId, quantity, operation);
    } catch (error) {
      console.error('Error updating ingredient stock:', error);
      // Error is handled by the hook and displayed in the UI
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Ingredient Management</h1>
          <p className={styles.headerDescription}>
            Manage your inventory of ingredients, track stock levels, and organize ingredient types.
          </p>
        </div>
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewButton} ${activeView === 'list' ? styles.active : ''}`}
            onClick={() => handleViewChange('list')}
          >
            📋 View Ingredients
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'add' || activeView === 'edit' ? styles.active : ''}`}
            onClick={handleAddIngredient}
          >
            ➕ Add New Ingredient
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Error Display */}
        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
            <button 
              className={styles.dismissError}
              onClick={clearError}
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* List View */}
        {activeView === 'list' && (
          <div className={styles.listView}>
            <IngredientFilters
              currentFilters={filters}
              onFiltersChange={updateFilters}
              loading={loading}
              categoryNames={categoryNames}
              typeNames={typeNames}
              totalCount={totalCount}
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              lowStockCount={lowStockCount}
            />
            <IngredientList
              ingredients={ingredients}
              loading={loading}
              error={error}
              pagination={pagination}
              onEditIngredient={handleEditIngredient}
              onUpdateStatus={handleStatusUpdate}
              onUpdateStock={handleStockUpdate}
              onPageChange={changePage}
            />
          </div>
        )}

        {/* Form View (Add/Edit) */}
        {(activeView === 'add' || activeView === 'edit') && (
          <div className={styles.formView}>
            <IngredientForm
              ingredient={editingIngredient}
              ingredientTypes={ingredientTypes}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {activeView === 'list' && (
        <div className={styles.quickStats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{totalCount}</div>
            <div className={styles.statLabel}>Total Ingredients</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{activeCount}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{inactiveCount}</div>
            <div className={styles.statLabel}>Inactive</div>
          </div>
          <div className={`${styles.statCard} ${lowStockCount > 0 ? styles.alertCard : ''}`}>
            <div className={styles.statNumber}>{lowStockCount}</div>
            <div className={styles.statLabel}>Low Stock</div>
            {lowStockCount > 0 && (
              <div className={styles.alertIcon}>⚠️</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientManagement;
