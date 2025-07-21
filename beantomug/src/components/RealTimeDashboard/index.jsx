import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext/UserContext';
import socketService from '../../services/socketService';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import RecentOrders from './body/RecentOrders';
import RecentTasks from './body/RecentTasks';
import GalleryUpdates from './body/GalleryUpdates';
import styles from './realTimeDashboard.module.css';

const RealTimeDashboard = () => {
    const { user } = useUser();
    const [orders, setOrders] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [galleryUpdates, setGalleryUpdates] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

    // Fetch initial data on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                console.log('RealTimeDashboard: Fetching initial data...');
                setIsLoadingInitialData(true);
                
                // Fetch recent orders (optimized endpoint)
                const ordersResponse = await axios.get('http://localhost:8801/orders/staff/recent', {
                    withCredentials: true
                });
                
                if (ordersResponse.data.orders) {
                    setOrders(ordersResponse.data.orders);
                    console.log('RealTimeDashboard: Loaded', ordersResponse.data.orders.length, 'recent orders');
                }
                
                // Fetch recent tasks (optimized endpoint)
                try {
                    console.log('RealTimeDashboard: Fetching recent tasks...');
                    const tasksResponse = await axios.get('http://localhost:8801/tasks/recent', {
                        withCredentials: true
                    });
                    
                    console.log('RealTimeDashboard: Tasks response:', tasksResponse.data);
                    
                    if (tasksResponse.data.success && tasksResponse.data.tasks) {
                        setTasks(tasksResponse.data.tasks);
                        console.log('RealTimeDashboard: Loaded', tasksResponse.data.tasks.length, 'recent tasks');
                    } else {
                        console.log('RealTimeDashboard: No tasks data in response');
                    }
                } catch (tasksError) {
                    console.error('RealTimeDashboard: Error fetching recent tasks:', tasksError);
                    if (tasksError.response) {
                        console.error('RealTimeDashboard: Error status:', tasksError.response.status);
                        console.error('RealTimeDashboard: Error data:', tasksError.response.data);
                    }
                }
                
            } catch (error) {
                console.error('RealTimeDashboard: Error fetching initial data:', error);
            } finally {
                setIsLoadingInitialData(false);
            }
        };

        fetchInitialData();
    }, []);

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
            console.log('RealTimeDashboard: New order received:', orderData);
            setOrders(prev => [orderData, ...prev.slice(0, 4)]); // Keep last 5 orders
        };

        const handleOrderUpdate = (orderData) => {
            console.log('RealTimeDashboard: Order update received:', orderData);
            setOrders(prev => 
                prev.map(order => 
                    (order.order_id || order.orderId) === (orderData.order_id || orderData.orderId)
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

    // Debug logging
    console.log('RealTimeDashboard render:', { user, userRole: user?.role });

    // Note: No authentication checks needed here because this component
    // is rendered under ProtectedRoute which already handles:
    // - Loading state
    // - User authentication
    // - Role authorization (admin/staff only)

    // Show loading state while fetching initial data
    if (isLoadingInitialData) {
        return (
            <div className={styles.dashboard}>
                <DashboardHeader connectionStatus="disconnected" />
                <div className={styles.grid}>
                    <div className={styles.section}>
                        <p className={styles.empty}>Loading recent data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <DashboardHeader connectionStatus={connectionStatus} />
            
            <div className={styles.grid}>
                <RecentOrders orders={orders} />
                <RecentTasks tasks={tasks} />
                <GalleryUpdates galleryUpdates={galleryUpdates} />
            </div>
        </div>
    );
};

export default RealTimeDashboard; 