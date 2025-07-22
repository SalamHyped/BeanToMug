import React from 'react';
import { useLocation } from 'react-router-dom';
import MenuOrders from "../../components/layouts/StaffLayout/menuOrders/menuOrders";
import RealTimeDashboard from "../../components/RealTimeDashboard";
import styles from './DashBoard.module.css';

export default function DashBoard(){
    const location = useLocation();
    const currentPath = location.pathname;

    const renderContent = () => {
        if (currentPath === '/staff/orders') {
            return <MenuOrders />;
        } else if (currentPath === '/staff/inventory') {
            return (
                <div className={styles.placeholder}>
                    <h2>Inventory Management</h2>
                    <p>Inventory management features will be implemented here.</p>
                </div>
            );
        } else {
            // Main dashboard
            return (
                <>
                  
                    {/* Real-Time Dashboard */}
                    <RealTimeDashboard />
                    
                    
                </>
            );
        }
    };

    return(
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1 className={styles.title}>Staff Dashboard</h1>
                <p className={styles.subtitle}>Manage orders and inventory</p>
            </div>
            <div className={styles.content}>
                {renderContent()}
            </div>
        </div>
    )
}