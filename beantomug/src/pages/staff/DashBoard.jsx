import React from 'react';
import { useLocation } from 'react-router-dom';
import MenuOrders from "../../components/layouts/StaffLayout/menuOrders";
import RealTimeDashboard from "../../components/RealTimeDashboard";
import Inventory from './Inventory';
import MyScheduleWidget from '../../components/staff/MyScheduleWidget';
import { useUser } from '../../context/UserContext/UserContext';
import styles from './DashBoard.module.css';

export default function DashBoard(){
    const location = useLocation();
    const currentPath = location.pathname;
    const { user } = useUser();

    const renderContent = () => {
        if (currentPath === '/staff/orders') {
            return <MenuOrders />;
        } else if (currentPath === '/staff/inventory') {
            return <Inventory />;
        } else {
            // Main dashboard
            return (
                <div className={styles.dashboardContent}>
                    {/* Real-Time Dashboard */}
                    <div className={styles.dashboardSection}>
                        <RealTimeDashboard />
                    </div>
                    
                    {/* My Schedule Widget - Below */}
                    <div className={styles.scheduleSection}>
                        <MyScheduleWidget 
                            userId={user?.id} 
                            userRole={user?.role || 'staff'} 
                        />
                    </div>
                </div>
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