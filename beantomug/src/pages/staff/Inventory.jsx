import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../../services/socketService';
import styles from './Inventory.module.css';

export default function Inventory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check socket connection status
  useEffect(() => {
    console.log('Staff Inventory: Socket connection status:', {
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
      const alertsResponse = await axios.get('http://localhost:8801/inventory/alerts', { withCredentials: true });
      console.log('Staff: Fetched alerts data:', alertsResponse.data.alerts);
      setAlerts(alertsResponse.data.alerts);
      
      // Notify admin that staff is viewing alerts
      if (alertsResponse.data.alerts.length > 0) {
        notifyAdminOfAlerts(alertsResponse.data.alerts);
      }
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      setError('Failed to load inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  const notifyAdminOfAlerts = (alerts) => {
    if (socketService.isConnected) {
      console.log('Staff: Notifying admin of alerts:', alerts.length);
      socketService.emit('staffViewingAlerts', {
        alertCount: alerts.length,
        alerts: alerts.map(alert => ({
          id: alert.ingredient_id,
          alert_type: alert.alert_type,
          message: alert.message,
          ingredient_name: alert.ingredient_name
        })),
        viewedBy: 'staff',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('Staff: Socket not connected, cannot notify admin');
    }
  };

  // WebSocket listeners for real-time updates (alerts only)
  useEffect(() => {
    if (socketService.isConnected) {
      socketService.on('stockAlert', handleStockAlert);

      return () => {
        socketService.off('stockAlert', handleStockAlert);
      };
    }
  }, []);

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

  const handleAlertClick = (alert) => {
    // Notify admin when staff clicks on an alert
    if (socketService.isConnected) {
      console.log('Staff: Alert object:', alert);
      console.log('Staff: Clicking on alert:', alert.ingredient_id || alert.id);
      const eventData = {
        alertId: alert.ingredient_id || alert.id,
        alertType: alert.alert_type,
        message: alert.message,
        action: 'viewed',
        timestamp: new Date().toISOString()
      };
      console.log('Staff: Emitting staffAlertInteraction with data:', eventData);
      socketService.emit('staffAlertInteraction', eventData);
      console.log('Staff: Event emitted successfully');
    } else {
      console.log('Staff: Socket not connected, cannot notify admin of click');
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
        <h1 className={styles.title}>Inventory Alerts</h1>
        <p className={styles.subtitle}>View low stock alerts and notifications</p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 ? (
        <div className={styles.alertsSection}>
          <h2 className={styles.sectionTitle}>Stock Alerts</h2>
          <div className={styles.alertsGrid}>
            {alerts.map(alert => (
              <div 
                key={alert.ingredient_id || alert.id} 
                className={styles.alertCard}
                onClick={() => handleAlertClick(alert)}
                style={{ cursor: 'pointer' }}
              >
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
      ) : (
        <div className={styles.noAlerts}>
          <h2 className={styles.sectionTitle}>No Active Alerts</h2>
          <p>All ingredients are currently well-stocked.</p>
        </div>
      )}

      {/* Staff Note */}
      <div className={styles.staffNote}>
        <h3>Staff Access</h3>
        <p>You can view stock alerts here. For full inventory management, please contact an administrator.</p>
                 <button 
           onClick={() => {
             console.log('Staff: Testing staff alert interaction...');
             const eventData = {
               alertId: 'test-123',
               alertType: 'low_stock',
               message: 'Test alert notification from staff',
               action: 'viewed',
               timestamp: new Date().toISOString()
             };
             console.log('Staff: Emitting test staffAlertInteraction with data:', eventData);
             socketService.emit('staffAlertInteraction', eventData);
             console.log('Staff: Test event emitted successfully');
           }}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Test Notification
        </button>
      </div>
    </div>
  );
} 