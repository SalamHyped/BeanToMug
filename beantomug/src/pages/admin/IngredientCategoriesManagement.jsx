import React, { useState, useCallback } from 'react';
import styles from './ingredientCategoriesManagement.module.css';
import { useIngredientCategories } from './MenuManagement/hooks';
import IngredientCategoryFilters from './MenuManagement/components/IngredientCategoryFilters';
import IngredientCategoryList from './MenuManagement/components/IngredientCategoryList';
import IngredientCategoryForm from './MenuManagement/components/IngredientCategoryForm';

const IngredientCategoriesManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type_option_group: '',
    sortBy: 'category_name',
    sortOrder: 'asc'
  });

  const {
    // State
    categories,
    loading,
    error,
    availableTypes,
    
    // Actions
    createIngredientCategory,
    updateIngredientCategory,
    deleteIngredientCategory,
    clearError,
    
    // Utilities
    getCategoryById,
    
    // Computed values
    filteredCategories,
    uniqueOptionGroups,
    physicalCategories,
    averageIngredientsPerCategory,
    availableTypesCount
  } = useIngredientCategories(filters);

  // View management
  const handleViewChange = useCallback((view) => {
    setActiveView(view);
    if (view === 'list') {
      setEditingCategory(null);
    }
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setActiveView('add');
  }, []);

  const handleEditCategory = useCallback((category) => {
    setEditingCategory(category);
    setActiveView('edit');
  }, []);

  // Form submission handlers
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      let result;
      
      if (editingCategory) {
        result = await updateIngredientCategory(editingCategory.category_id, formData);
      } else {
        result = await createIngredientCategory(formData);
      }

      if (result.success) {
        setActiveView('list');
        setEditingCategory(null);
      }
      
      return result;
    } catch (err) {
      console.error('Error submitting form:', err);
      return { success: false, error: 'Failed to save ingredient category' };
    }
  }, [editingCategory, updateIngredientCategory, createIngredientCategory]);

  const handleFormCancel = useCallback(() => {
    setActiveView('list');
    setEditingCategory(null);
  }, []);

  // Simple deletion (categories have simpler dependencies than types)
  const handleDeleteCategory = useCallback(async (categoryId) => {
    const category = getCategoryById(categoryId);
    if (!category) {
      alert('Category not found');
      return;
    }

    if (category.ingredient_count > 0) {
      alert(`Cannot delete "${category.category_name}" because it has ${category.ingredient_count} ingredients assigned. Please reassign or remove these ingredients first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category.category_name}"?\n\nThis will also unlink the associated ingredient type, making it available for other categories.\n\nThis action cannot be undone.`)) {
      const result = await deleteIngredientCategory(categoryId);
      if (!result.success) {
        alert(`Failed to delete: ${result.error}`);
      }
    }
  }, [getCategoryById, deleteIngredientCategory]);

  // Filter management
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      type_option_group: '',
      sortBy: 'category_name',
      sortOrder: 'asc'
    });
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Ingredient Categories Management</h1>
          <p className={styles.subtitle}>
            Manage ingredient categories that organize types and their associated ingredients
          </p>
        </div>
        
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewButton} ${activeView === 'list' ? styles.active : ''}`}
            onClick={() => handleViewChange('list')}
          >
            View Categories ({categories.length})
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'add' ? styles.active : ''}`}
            onClick={() => handleViewChange('add')}
            disabled={availableTypesCount === 0}
            title={availableTypesCount === 0 ? 'No unassigned types available' : 'Add new category'}
          >
            Add New Category
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{categories.length}</div>
          <div className={styles.statLabel}>Total Categories</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{physicalCategories}</div>
          <div className={styles.statLabel}>Physical Types</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{uniqueOptionGroups.length}</div>
          <div className={styles.statLabel}>Option Groups</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{availableTypesCount}</div>
          <div className={styles.statLabel}>Available Types</div>
        </div>
      </div>

      {/* Info Banner */}
      {availableTypesCount === 0 && (
        <div className={styles.infoBanner}>
          <div className={styles.infoIcon}>ℹ️</div>
          <div className={styles.infoContent}>
            <strong>No Available Types:</strong> All ingredient types have categories assigned. 
            To create new categories, first create new ingredient types in the 
            <strong> Ingredient Types Management</strong> section, or edit existing categories to reassign them.
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>
            {error}
            <button onClick={clearError} className={styles.closeError}>×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        {activeView === 'list' && (
          <div className={styles.listView}>
            <IngredientCategoryFilters
              currentFilters={filters}
              onFiltersChange={handleFiltersChange}
              onResetFilters={handleResetFilters}
              optionGroups={uniqueOptionGroups}
              loading={loading}
              totalCount={categories.length}
              filteredCount={filteredCategories.length}
              physicalCount={physicalCategories}
              averageIngredients={averageIngredientsPerCategory}
            />
            <IngredientCategoryList
              categories={filteredCategories}
              loading={loading}
              error={error}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              filteredCount={filteredCategories.length}
            />
          </div>
        )}

        {(activeView === 'add' || activeView === 'edit') && (
          <div className={styles.formView}>
            <IngredientCategoryForm
              category={editingCategory}
              availableTypes={availableTypes}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={loading}
              isEditing={activeView === 'edit'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientCategoriesManagement;
