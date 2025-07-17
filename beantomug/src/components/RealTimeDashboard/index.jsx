import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext/UserProvider';
import socketService from '../../services/socketService';
import styles from './realTimeDashboard.module.css';

const RealTimeDashboard = () => {
    const { user } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [galleryUpdates, setGalleryUpdates] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    useEffect(() => {
        // Update connection status
        const updateStatus = () => {
            const status = socketService.getConnectionStatus();
            setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');
        };

        // Check status every 2 seconds
        const interval = setInterval(updateStatus, 2000);
        updateStatus(); // Initial check

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Listen for real-time updates
        const handleNewOrder = (orderData) => {
            setOrders(prev => [orderData, ...prev.slice(0, 4)]); // Keep last 5 orders
        };

        const handleOrderUpdate = (orderData) => {
            setOrders(prev => 
                prev.map(order => 
                    order.orderId === orderData.orderId 
                        ? { ...order, ...orderData }
                        : order
                )
            );
        };

        const handleNewTask = (taskData) => {
            setTasks(prev => [taskData, ...prev.slice(0, 4)]); // Keep last 5 tasks
        };

        const handleTaskUpdate = (taskData) => {
            setTasks(prev => 
                prev.map(task => 
                    task.taskId === taskData.taskId 
                        ? { ...task, ...taskData }
                        : task
                )
            );
        };

        const handleGalleryUpdate = (galleryData) => {
            setGalleryUpdates(prev => [galleryData, ...prev.slice(0, 4)]); // Keep last 5 updates
        };

        // Register listeners
        socketService.on('newOrder', handleNewOrder);
        socketService.on('orderUpdate', handleOrderUpdate);
        socketService.on('newTask', handleNewTask);
        socketService.on('taskUpdate', handleTaskUpdate);
        socketService.on('galleryUpdate', handleGalleryUpdate);

        return () => {
            socketService.off('newOrder', handleNewOrder);
            socketService.off('orderUpdate', handleOrderUpdate);
            socketService.off('newTask', handleNewTask);
            socketService.off('taskUpdate', handleTaskUpdate);
            socketService.off('galleryUpdate', handleGalleryUpdate);
        };
    }, []);

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        return null; // Only show for admin and staff
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h2>Real-Time Dashboard</h2>
                <div className={`${styles.status} ${styles[connectionStatus]}`}>
                    {connectionStatus === 'connected' ? '🟢 Live' : '🔴 Offline'}
                </div>
            </div>

            <div className={styles.grid}>
                {/* Orders Section */}
                <div className={styles.section}>
                    <h3>🛒 Recent Orders</h3>
                    <div className={styles.list}>
                        {orders.length === 0 ? (
                            <p className={styles.empty}>No recent orders</p>
                        ) : (
                            orders.map((order, index) => (
                                <div key={index} className={styles.item}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.id}>#{order.orderId}</span>
                                        <span className={`${styles.status} ${styles[order.status]}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <span>{order.orderType}</span>
                                        <span className={styles.time}>
                                            {new Date(order.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Tasks Section */}
                <div className={styles.section}>
                    <h3>📝 Recent Tasks</h3>
                    <div className={styles.list}>
                        {tasks.length === 0 ? (
                            <p className={styles.empty}>No recent tasks</p>
                        ) : (
                            tasks.map((task, index) => (
                                <div key={index} className={styles.item}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.title}>{task.title}</span>
                                        <span className={`${styles.priority} ${styles[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <span>{task.status}</span>
                                        <span className={styles.time}>
                                            {new Date(task.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Gallery Section */}
                <div className={styles.section}>
                    <h3>🖼️ Gallery Updates</h3>
                    <div className={styles.list}>
                        {galleryUpdates.length === 0 ? (
                            <p className={styles.empty}>No recent uploads</p>
                        ) : (
                            galleryUpdates.map((update, index) => (
                                <div key={index} className={styles.item}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.type}>
                                            {update.fileType?.startsWith('image/') ? '📷 Image' : '🎥 Video'}
                                        </span>
                                        <span className={styles.time}>
                                            {new Date(update.publishDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <span className={styles.description}>
                                            {update.description || 'No description'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealTimeDashboard; 