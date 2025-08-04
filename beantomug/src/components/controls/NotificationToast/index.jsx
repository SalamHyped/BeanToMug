import React, { useState, useEffect } from 'react';
import socketService from '../../../services/socketService';
import styles from './notificationToast.module.css';

const NotificationToast = () => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (isInitialized) {
            console.log('NotificationToast: Already initialized, skipping setup');
            return;
        }
        
        console.log('NotificationToast: Component mounted, setting up listeners');
        setIsInitialized(true);
        
        // Listen for notifications
        const handleNotification = (notificationData) => {
            console.log('NotificationToast: Received notification:', notificationData);
            const newNotification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: notificationData.message,
                type: notificationData.type,
                timestamp: notificationData.timestamp,
                isVisible: true
            };

            setNotifications(prev => [...prev, newNotification]);
            setIsVisible(true);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === newNotification.id 
                            ? { ...notif, isVisible: false }
                            : notif
                    )
                );
            }, 5000);

            // Remove from array after animation
            setTimeout(() => {
                setNotifications(prev => 
                    prev.filter(notif => notif.id !== newNotification.id)
                );
            }, 5500);
        };

        // Listen for specific events
        const handleNewOrder = (orderData) => {
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `New order #${orderData.orderId} received!`,
                type: 'new_order',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        };

        const handleOrderUpdate = (orderData) => {
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `Order #${orderData.orderId} status: ${orderData.status}`,
                type: 'order_update',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        };

        const handleNewTask = (taskData) => {
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `New task: ${taskData.title}`,
                type: 'new_task',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        };

        const handleTaskUpdate = (taskData) => {
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `Task "${taskData.title}" updated to ${taskData.status}`,
                type: 'task_update',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        };

        const handleGalleryUpdate = (galleryData) => {
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `New content uploaded to gallery`,
                type: 'gallery_update',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        };

        const handleStaffAlertActivity = (data) => {
            console.log('NotificationToast: Received staffAlertActivity:', data);
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `Staff member is viewing ${data.alertCount} inventory alert(s)`,
                type: 'staff_alert_activity',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notification.id 
                            ? { ...notif, isVisible: false }
                            : notif
                    )
                );
            }, 5000);

            // Remove from array after animation
            setTimeout(() => {
                setNotifications(prev => 
                    prev.filter(notif => notif.id !== notification.id)
                );
            }, 5500);
        };

        const handleStaffAlertInteraction = (data) => {
            console.log('NotificationToast: Received staffAlertInteraction:', data);
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: `Staff member ${data.action} alert: ${data.message}`,
                type: 'staff_alert_interaction',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notification.id 
                            ? { ...notif, isVisible: false }
                            : notif
                    )
                );
            }, 5000);

            // Remove from array after animation
            setTimeout(() => {
                setNotifications(prev => 
                    prev.filter(notif => notif.id !== notification.id)
                );
            }, 5500);
        };

        // Register event listeners
        console.log('NotificationToast: Registering event listeners');
        socketService.on('notification', handleNotification);
        socketService.on('newOrder', handleNewOrder);
        socketService.on('orderUpdate', handleOrderUpdate);
        socketService.on('newTask', handleNewTask);
        socketService.on('taskUpdate', handleTaskUpdate);
        socketService.on('galleryUpdate', handleGalleryUpdate);
        socketService.on('staffAlertActivity', handleStaffAlertActivity);
        socketService.on('staffAlertInteraction', handleStaffAlertInteraction);
        socketService.on('testNotification', (data) => {
            console.log('NotificationToast: Received test notification:', data);
            const notification = {
                id: Date.now() + Math.random(), // Ensure unique ID
                message: data.message,
                type: data.type,
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        });
        

        // Cleanup listeners on unmount
        return () => {
            socketService.off('notification', handleNotification);
            socketService.off('newOrder', handleNewOrder);
            socketService.off('orderUpdate', handleOrderUpdate);
            socketService.off('newTask', handleNewTask);
            socketService.off('taskUpdate', handleTaskUpdate);
            socketService.off('galleryUpdate', handleGalleryUpdate);
            socketService.off('staffAlertActivity', handleStaffAlertActivity);
            socketService.off('staffAlertInteraction', handleStaffAlertInteraction);
            socketService.off('testNotification');
        };
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_order':
                return '🛒';
            case 'order_update':
                return '📋';
            case 'new_task':
                return '📝';
            case 'task_update':
                return '✅';
            case 'gallery_update':
                return '🖼️';
            case 'staff_alert_activity':
                return '👥';
            case 'staff_alert_interaction':
                return '👁️';
            default:
                return '🔔';
        }
    };

    const getNotificationClass = (type) => {
        switch (type) {
            case 'new_order':
                return styles.newOrder;
            case 'order_update':
                return styles.orderUpdate;
            case 'new_task':
                return styles.newTask;
            case 'task_update':
                return styles.taskUpdate;
            case 'gallery_update':
                return styles.galleryUpdate;
            case 'staff_alert_activity':
                return styles.staffAlertActivity;
            case 'staff_alert_interaction':
                return styles.staffAlertInteraction;
            default:
                return styles.default;
        }
    };

    console.log('NotificationToast: Render state:', { isVisible, notificationsCount: notifications.length, notifications });
    
    if (!isVisible || notifications.length === 0) {
        console.log('NotificationToast: Returning null - not visible or no notifications');
        return null;
    }

    return (
        <div className={styles.notificationContainer}>
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`${styles.notification} ${getNotificationClass(notification.type)} ${
                        notification.isVisible ? styles.visible : styles.hidden
                    }`}
                >
                    <div className={styles.icon}>
                        {getNotificationIcon(notification.type)}
                    </div>
                    <div className={styles.content}>
                        <div className={styles.message}>
                            {notification.message}
                        </div>
                        <div className={styles.timestamp}>
                            {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={() => {
                            setNotifications(prev => 
                                prev.filter(notif => notif.id !== notification.id)
                            );
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationToast; 