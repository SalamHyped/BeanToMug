import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../../services/socketService';
import styles from './Inventory.module.css';

export default function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [updateModal, setUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    quantity: '',
    reason: '',
    movement_type: 'adjustment'
  });
  const [staffActivity, setStaffActivity] = useState(null);

  // Check socket connection status
  useEffect(() => {
    console.log('Admin Inventory: Socket connection status:', {
      isConnected: socketService.isConnected,
      connectionStatus: socketService.getConnectionStatus()
    });
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [stockResponse, alertsResponse, movementsResponse] = await Promise.all([
        axios.get('http://localhost:8801/inventory/stock', { withCredentials: true }),
        axios.get('http://localhost:8801/inventory/alerts', { withCredentials: true }),
        axios.get('http://localhost:8801/inventory/movements', { withCredentials: true })
      ]);

      setIngredients(stockResponse.data.ingredients);
      setAlerts(alertsResponse.data.alerts);
      setMovements(movementsResponse.data.movements);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (socketService.isConnected) {
      console.log('Admin: Setting up WebSocket listeners');
      socketService.on('stockUpdate', handleStockUpdate);
      socketService.on('stockAlert', handleStockAlert);
      socketService.on('bulkStockUpdate', handleBulkStockUpdate);
      socketService.on('staffAlertActivity', handleStaffAlertActivity);

      return () => {
        console.log('Admin: Cleaning up WebSocket listeners');
        socketService.off('stockUpdate', handleStockUpdate);
        socketService.off('stockAlert', handleStockAlert);
        socketService.off('bulkStockUpdate', handleBulkStockUpdate);
        socketService.off('staffAlertActivity', handleStaffAlertActivity);
      };
    } else {
      console.log('Admin: Socket not connected, cannot set up listeners');
    }
  }, []);

  const handleStockUpdate = (data) => {
    setIngredients(prev => 
      prev.map(ingredient => 
        ingredient.ingredient_id === data.ingredientId 
          ? { ...ingredient, quantity_in_stock: data.newStock }
          : ingredient
      )
    );
  };

  const handleStockAlert = (data) => {
    setAlerts(prev => [{
      id: Date.now(),
      item_id: data.ingredientId,
      alert_type: data.alertType,
      message: data.message,
      created_at: data.timestamp,
      is_read: false
    }, ...prev]);
  };

  const handleBulkStockUpdate = (data) => {
    data.updates.forEach(update => {
      if (update.success) {
        setIngredients(prev => 
          prev.map(ingredient => 
            ingredient.ingredient_id === update.ingredientId 
              ? { ...ingredient, quantity_in_stock: update.newStock }
              : ingredient
          )
        );
      }
    });
  };

  const handleStaffAlertActivity = (data) => {
    console.log('Admin received staff alert activity:', data);
    
    // Update staff activity state
    setStaffActivity(data);
    
    // Clear staff activity after 10 seconds
    setTimeout(() => {
      setStaffActivity(null);
    }, 10000);
  };



  const handleUpdateStock = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(
        `http://localhost:8801/inventory/stock/${selectedIngredient.ingredient_id}`,
        updateForm,
        { withCredentials: true }
      );

      if (response.data.success) {
        setUpdateModal(false);
        setSelectedIngredient(null);
        setUpdateForm({ quantity: '', reason: '', movement_type: 'adjustment' });
        fetchInventoryData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      setError('Failed to update stock');
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low_stock': return '#ff9800';
      case 'out_of_stock': return '#f44336';
      case 'overstock': return '#4caf50';
      default: return '#2196f3';
    }
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'overstock': return 'Overstock';
      default: return 'Normal';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
             <div className={styles.header}>
         <h1 className={styles.title}>Inventory Management</h1>
         <p className={styles.subtitle}>Full inventory control and monitoring</p>
         <button 
           onClick={() => {
             console.log('Admin: Testing notification manually');
             const sent = socketService.sendToServer('testNotification', {
               message: 'Test notification from admin',
               type: 'staff_alert_activity'
             });
             console.log('Admin: Test notification sent to server:', sent);
           }}
           style={{ 
             padding: '0.5rem 1rem', 
             backgroundColor: '#3b82f6', 
             color: 'white', 
             border: 'none', 
             borderRadius: '0.25rem',
             cursor: 'pointer'
           }}
         >
           Test Notification
         </button>
       </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className={styles.alertsSection}>
          <div className={styles.alertsHeader}>
            <h2 className={styles.sectionTitle}>Stock Alerts</h2>
            {staffActivity && staffActivity.type === 'viewing_alerts' && (
              <div className={styles.staffActivityIndicator}>
                <span className={styles.activityIcon}>👥</span>
                <span className={styles.activityText}>
                  Staff viewing {staffActivity.alertCount} alert(s)
                </span>
              </div>
            )}
          </div>
          <div className={styles.alertsGrid}>
            {alerts.map(alert => (
              <div key={alert.id} className={styles.alertCard}>
                <div className={styles.alertHeader}>
                  <span className={`${styles.alertType} ${styles[alert.alert_type]}`}>
                    {alert.alert_type === 'low_stock' ? '⚠️' : '🚨'}
                  </span>
                </div>
                <p className={styles.alertMessage}>{alert.message}</p>
                <small className={styles.alertTime}>
                  {new Date(alert.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Overview */}
      <div className={styles.stockSection}>
        <h2 className={styles.sectionTitle}>Stock Overview</h2>
        <div className={styles.stockGrid}>
          {ingredients.map(ingredient => (
            <div key={ingredient.ingredient_id} className={styles.stockCard}>
              <div className={styles.stockHeader}>
                <h3 className={styles.ingredientName}>{ingredient.ingredient_name}</h3>
                <span 
                  className={styles.stockStatus}
                  style={{ backgroundColor: getStockStatusColor(ingredient.stock_status) }}
                >
                  {getStockStatusText(ingredient.stock_status)}
                </span>
              </div>
              
              <div className={styles.stockDetails}>
                <div className={styles.stockInfo}>
                  <span className={styles.label}>Current Stock:</span>
                  <span className={styles.value}>
                    {ingredient.quantity_in_stock} {ingredient.unit}
                  </span>
                </div>
                
                <div className={styles.stockInfo}>
                  <span className={styles.label}>Threshold:</span>
                  <span className={styles.value}>
                    {ingredient.low_stock_threshold} {ingredient.unit}
                  </span>
                </div>

                {ingredient.brand && (
                  <div className={styles.stockInfo}>
                    <span className={styles.label}>Brand:</span>
                    <span className={styles.value}>{ingredient.brand}</span>
                  </div>
                )}

                {ingredient.category_name && (
                  <div className={styles.stockInfo}>
                    <span className={styles.label}>Category:</span>
                    <span className={styles.value}>{ingredient.category_name}</span>
                  </div>
                )}
              </div>

              <div className={styles.stockActions}>
                <button 
                  className={styles.updateButton}
                  onClick={() => {
                    setSelectedIngredient(ingredient);
                    setUpdateModal(true);
                  }}
                >
                  Update Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Movements */}
      <div className={styles.movementsSection}>
        <h2 className={styles.sectionTitle}>Recent Stock Movements</h2>
        <div className={styles.movementsList}>
          {movements.slice(0, 10).map(movement => (
            <div key={movement.id} className={styles.movementItem}>
              <div className={styles.movementHeader}>
                <span className={styles.ingredientName}>{movement.ingredient_name}</span>
                <span className={`${styles.movementType} ${styles[movement.movement_type]}`}>
                  {movement.movement_type}
                </span>
              </div>
              
              <div className={styles.movementDetails}>
                <span className={styles.quantity}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </span>
                <span className={styles.stockChange}>
                  {movement.previous_stock} → {movement.new_stock}
                </span>
              </div>
              
              {movement.reason && (
                <p className={styles.movementReason}>{movement.reason}</p>
              )}
              
              <div className={styles.movementMeta}>
                <span className={styles.updatedBy}>
                  by {movement.updated_by_name || 'Unknown'}
                </span>
                <span className={styles.timestamp}>
                  {new Date(movement.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Stock Modal */}
      {updateModal && selectedIngredient && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Update Stock - {selectedIngredient.ingredient_name}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setUpdateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateStock} className={styles.updateForm}>
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantity Change:</label>
                <input
                  type="number"
                  id="quantity"
                  value={updateForm.quantity}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity (use negative for reduction)"
                  required
                />
                <small>Current stock: {selectedIngredient.quantity_in_stock} {selectedIngredient.unit}</small>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="reason">Reason:</label>
                <input
                  type="text"
                  id="reason"
                  value={updateForm.reason}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Restock, Usage, Adjustment"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="movement_type">Movement Type:</label>
                <select
                  id="movement_type"
                  value={updateForm.movement_type}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, movement_type: e.target.value }))}
                >
                  <option value="adjustment">Adjustment</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveButton}>
                  Update Stock
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setUpdateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 