import React, { useState, useEffect } from 'react';
import socketService from '../../../services/socketService';
import styles from './notificationToast.module.css';

const NotificationToast = () => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Listen for notifications
        const handleNotification = (notificationData) => {
            const newNotification = {
                id: Date.now(),
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
                id: Date.now(),
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
                id: Date.now(),
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
                id: Date.now(),
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
                id: Date.now(),
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
                id: Date.now(),
                message: `New content uploaded to gallery`,
                type: 'gallery_update',
                timestamp: new Date().toISOString(),
                isVisible: true
            };
            setNotifications(prev => [...prev, notification]);
            setIsVisible(true);
        };

        // Register event listeners
        socketService.on('notification', handleNotification);
        socketService.on('newOrder', handleNewOrder);
        socketService.on('orderUpdate', handleOrderUpdate);
        socketService.on('newTask', handleNewTask);
        socketService.on('taskUpdate', handleTaskUpdate);
        socketService.on('galleryUpdate', handleGalleryUpdate);

        // Cleanup listeners on unmount
        return () => {
            socketService.off('notification', handleNotification);
            socketService.off('newOrder', handleNewOrder);
            socketService.off('orderUpdate', handleOrderUpdate);
            socketService.off('newTask', handleNewTask);
            socketService.off('taskUpdate', handleTaskUpdate);
            socketService.off('galleryUpdate', handleGalleryUpdate);
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
            default:
                return styles.default;
        }
    };

    if (!isVisible || notifications.length === 0) {
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