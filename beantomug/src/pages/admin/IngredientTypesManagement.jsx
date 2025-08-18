import React, { useState, useCallback } from 'react';
import styles from './ingredientTypesManagement.module.css';
import { useIngredientTypes } from './MenuManagement/hooks';
import IngredientTypeFilters from './MenuManagement/components/IngredientTypeFilters';
import IngredientTypeList from './MenuManagement/components/IngredientTypeList';
import IngredientTypeForm from './MenuManagement/components/IngredientTypeForm';
import DeletionWorkflowModal from './MenuManagement/components/DeletionWorkflowModal';

const IngredientTypesManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit'
  const [editingType, setEditingType] = useState(null);
  const [workflowModalData, setWorkflowModalData] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    is_physical: 'all',
    option_group: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const {
    // State
    loading,
    error,
    optionGroups,
    
    // Actions
    createIngredientType,
    updateIngredientType,
    deleteIngredientType,
    clearError,
    
    // Utilities
    getTypeById,
    
    // Deletion workflow helpers
    checkTypeDependencies,
    getDeletionWorkflow,
    
    // Computed values
    filteredTypes,
    totalTypes,
    physicalTypes,
    nonPhysicalTypes,
    currentOptionGroups,
    filteredCount,
    filteredPhysicalCount,
    filteredNonPhysicalCount
  } = useIngredientTypes(filters);

  // View management
  const handleViewChange = useCallback((view) => {
    setActiveView(view);
    if (view === 'list') {
      setEditingType(null);
    }
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleAddType = useCallback(() => {
    setEditingType(null);
    setActiveView('add');
  }, []);

  const handleEditType = useCallback((type) => {
    setEditingType(type);
    setActiveView('edit');
  }, []);

  // Form submission handlers
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      let result;
      
      if (editingType) {
        result = await updateIngredientType(editingType.type_id, formData);
      } else {
        result = await createIngredientType(formData);
      }

      if (result.success) {
        setActiveView('list');
        setEditingType(null);
      }
      
      return result;
    } catch (err) {
      console.error('Error submitting form:', err);
      return { success: false, error: 'Failed to save ingredient type' };
    }
  }, [editingType, updateIngredientType, createIngredientType]);

  const handleFormCancel = useCallback(() => {
    setActiveView('list');
    setEditingType(null);
  }, []);

  // Smart deletion with workflow
  const handleDeleteType = useCallback(async (typeId) => {
    const type = getTypeById(typeId);
    if (!type) {
      alert('Type not found');
      return;
    }

    // Check dependencies first
    const workflow = await getDeletionWorkflow(typeId);
    
    if (workflow.steps.length === 1 && workflow.steps[0].completed) {
      // Safe to delete - show simple confirmation
      if (window.confirm(`Are you sure you want to delete "${type.name}"?\n\nThis action cannot be undone.`)) {
        const result = await deleteIngredientType(typeId);
        if (!result.success) {
          alert(`Failed to delete: ${result.error}`);
        }
      }
    } else {
      // Show workflow modal for complex dependencies
      setWorkflowModalData({
        type,
        workflow,
        onRetry: () => handleDeleteType(typeId)
      });
    }
  }, [getTypeById, getDeletionWorkflow, deleteIngredientType]);

  // Close workflow modal
  const handleCloseWorkflowModal = useCallback(() => {
    setWorkflowModalData(null);
  }, []);

  // Filter management
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      is_physical: 'all',
      option_group: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Ingredient Types Management</h1>
          <p className={styles.subtitle}>
            Manage ingredient types that define how ingredients are grouped and used in dishes
          </p>
        </div>
        
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewButton} ${activeView === 'list' ? styles.active : ''}`}
            onClick={() => handleViewChange('list')}
          >
            View Types ({totalTypes})
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'add' ? styles.active : ''}`}
            onClick={() => handleViewChange('add')}
          >
            Add New Type
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalTypes}</div>
          <div className={styles.statLabel}>Total Types</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{physicalTypes}</div>
          <div className={styles.statLabel}>Physical</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{nonPhysicalTypes}</div>
          <div className={styles.statLabel}>Non-Physical</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{currentOptionGroups.length}</div>
          <div className={styles.statLabel}>Option Groups</div>
        </div>
      </div>

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
            <IngredientTypeFilters
              currentFilters={filters}
              onFiltersChange={handleFiltersChange}
              onResetFilters={handleResetFilters}
              optionGroups={currentOptionGroups}
              loading={loading}
              totalCount={totalTypes}
              filteredCount={filteredCount}
              physicalCount={filteredPhysicalCount}
              nonPhysicalCount={filteredNonPhysicalCount}
            />
            <IngredientTypeList
              types={filteredTypes}
              loading={loading}
              error={error}
              onEditType={handleEditType}
              onDeleteType={handleDeleteType}
              filteredCount={filteredCount}
            />
          </div>
        )}

        {(activeView === 'add' || activeView === 'edit') && (
          <div className={styles.formView}>
            <IngredientTypeForm
              type={editingType}
              optionGroups={optionGroups}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={loading}
              isEditing={activeView === 'edit'}
            />
          </div>
        )}
      </div>

      {/* Deletion Workflow Modal */}
      {workflowModalData && (
        <DeletionWorkflowModal
          title={`Delete "${workflowModalData.type.name}"`}
          workflow={workflowModalData.workflow}
          onClose={handleCloseWorkflowModal}
          onRetry={workflowModalData.onRetry}
        />
      )}
    </div>
  );
};

export default IngredientTypesManagement;
