import React, { useState } from 'react';
import styles from './index.module.css';
import DishList from './components/DishList';
import DishForm from './components/DishForm';
import { useDishes } from './hooks';

const MenuManagement = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit'
  const [selectedDish, setSelectedDish] = useState(null);
  
  // Use the dishes hook for better state management
  const { fetchDishes } = useDishes();

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'list') {
      setSelectedDish(null);
    }
  };

  const handleEditDish = (dish) => {
    setSelectedDish(dish);
    setActiveView('edit');
  };

  const handleDishCreated = async (dishId) => {
    // Refresh the dish list and switch back to list view
    await fetchDishes();
    setActiveView('list');
  };

  const handleCancel = () => {
    setActiveView('list');
    setSelectedDish(null);
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
        </div>
      </div>

      <div className={styles.content}>
        {activeView === 'list' && (
          <div className={styles.listView}>
            <DishList onEditDish={handleEditDish} />
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

        {activeView === 'edit' && selectedDish && (
          <div className={styles.editView}>
            <h2>Edit Dish: {selectedDish.item_name}</h2>
            <p>Edit form component will go here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;
