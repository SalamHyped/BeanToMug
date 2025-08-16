import React, { useState } from 'react';
import styles from './index.module.css';
import DishList from './components/DishList';
import DishForm from './components/DishForm';
import DishFilters from './components/DishFilters';
import CategoryManager from './components/CategoryManager';
import DishEditModal from './components/DishEditModal';
import { useDishes } from './hooks';

const MenuManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'categories'
  const [editingDishId, setEditingDishId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  // Use the dishes hook with filters for better state management
  const { fetchDishes, filteredDishes, loading, error, filteredCount, filteredActiveCount, filteredInactiveCount } = useDishes(filters);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'list') {
      setEditingDishId(null);
      setIsEditModalOpen(false);
    }
  };

  const handleEditDish = (dish) => {
    setEditingDishId(dish.item_id);
    setIsEditModalOpen(true);
  };

  const handleDishCreated = async (dishId) => {
    // Refresh the dish list and switch back to list view
    await fetchDishes();
    setActiveView('list');
  };

  const handleCancel = () => {
    setActiveView('list');
    setEditingDishId(null);
    setIsEditModalOpen(false);
  };

  const handleDishUpdated = async () => {
    // Refresh the dish list and close modal
    await fetchDishes();
    setEditingDishId(null);
    setIsEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditingDishId(null);
    setIsEditModalOpen(false);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Filters are automatically applied through the useDishes hook
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Menu Management</h1>
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewButton} ${activeView === 'list' ? styles.active : ''}`}
            onClick={() => handleViewChange('list')}
          >
            View Dishes
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'add' ? styles.active : ''}`}
            onClick={() => handleViewChange('add')}
          >
            Add New Dish
          </button>
          <button 
            className={`${styles.viewButton} ${activeView === 'categories' ? styles.active : ''}`}
            onClick={() => handleViewChange('categories')}
          >
            Manage Categories
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeView === 'list' && (
          <div className={styles.listView}>
            <DishFilters 
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
              loading={loading}
            />
            <DishList 
              onEditDish={handleEditDish}
              dishes={filteredDishes}
              loading={loading}
              error={error}
              filteredCount={filteredCount}
              filteredActiveCount={filteredActiveCount}
              filteredInactiveCount={filteredInactiveCount}
            />
          </div>
        )}

        {activeView === 'add' && (
          <div className={styles.addView}>
            <DishForm 
              onDishCreated={handleDishCreated}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Edit Modal */}
        <DishEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          dishId={editingDishId}
          onDishUpdated={handleDishUpdated}
        />

        {activeView === 'categories' && (
          <div className={styles.categoriesView}>
            <CategoryManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;
