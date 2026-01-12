import React from 'react';
import styles from './index.module.css';
import RoundedPhoto from '../../../../../components/roundedPhoto/RoundedPhoto';

const DishList = ({ 
  onEditDish, 
  dishes = [], 
  loading = false, 
  error = null,
  filteredCount = 0,
  filteredActiveCount = 0,
  filteredInactiveCount = 0,
  onToggleStatus,
  onRefresh
}) => {
  const handleEdit = (dish) => {
    if (onEditDish) {
      onEditDish(dish);
    }
  };

  const handleToggleStatus = async (dishId, currentStatus) => {
    if (!onToggleStatus) return;
    const result = await onToggleStatus(dishId, currentStatus);
    if (!result.success) {
      // Error is already handled in the hook
      console.error('Failed to toggle dish status');
    }
  };




  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading dishes...</p>
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

  if (dishes.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No dishes found matching your filters. Try adjusting your search criteria or add your first dish to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.dishList}>
      <div className={styles.listHeader}>
        <div className={styles.stats}>
          <h3>Filtered Results: {filteredCount} dishes</h3>
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
        <table className={styles.dishesTable}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map(dish => (
              <tr key={dish.item_id} className={`${styles.tableRow} ${!dish.status ? styles.inactiveDish : ''}`}>
                <td className={styles.imageCell}>
                  <RoundedPhoto 
                    src={dish.item_photo_url} 
                    alt={dish.item_name} 
                    size={60}
                  />
                </td>
                <td className={styles.nameCell}>
                  <h4>{dish.item_name}</h4>
                </td>
                <td className={styles.categoryCell}>
                  {dish.category_name}
                </td>
                <td className={styles.priceCell}>
                  ${dish.price}
                </td>
                <td className={styles.statusCell}>
                  <span className={`${styles.status} ${styles[dish.status ? 'active' : 'inactive']}`}>
                    {dish.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button 
                    onClick={() => handleEdit(dish)}
                    className={styles.editButton}
                    title="Edit dish details"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(dish.item_id, dish.status)}
                    className={`${styles.statusButton} ${styles[dish.status ? 'deactivate' : 'activate']}`}
                    title={dish.status ? 'Hide from menu' : 'Show in menu'}
                  >
                    {dish.status ? 'Deactivate' : 'Activate'}
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

export default DishList;
