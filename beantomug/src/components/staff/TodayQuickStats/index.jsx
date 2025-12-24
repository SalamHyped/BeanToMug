import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext/UserContext';
import axios from 'axios';
import { Activity, CheckSquare, AlertTriangle, Calendar } from 'lucide-react';
import DashboardCard from '../../RealTimeDashboard/shared/DashboardCard';
import { getApiConfig } from '../../../utils/config';
import styles from './todayQuickStats.module.css';
import useStaffSchedule from '../StaffScheduleDashboard/hooks/useStaffSchedule';

const TodayQuickStats = () => {
  const { user } = useUser();
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [myTasksCount, setMyTasksCount] = useState(0);
  const [lowStockAlertsCount, setLowStockAlertsCount] = useState(0);
  const [nextShift, setNextShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get schedule data for next shift
  const { mySchedules, upcomingShifts } = useStaffSchedule(user?.id);

  // Fetch active orders count
  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        const response = await axios.get(`${getApiConfig().baseURL}/orders/staff/recent`, {
          ...getApiConfig()
        });
        
        if (response.data.orders) {
          // Count orders with status 'pending' or 'processing'
          const activeOrders = response.data.orders.filter(
            order => order.status === 'pending' || order.status === 'processing'
          );
          setActiveOrdersCount(activeOrders.length);
        }
      } catch (err) {
        console.error('Error fetching active orders:', err);
      }
    };

    fetchActiveOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch my tasks count
  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const response = await axios.get(`${getApiConfig().baseURL}/tasks/my-tasks`, {
          ...getApiConfig()
        });
        
        if (Array.isArray(response.data)) {
          // Count tasks that are not completed
          const activeTasks = response.data.filter(
            task => task.status !== 'completed'
          );
          setMyTasksCount(activeTasks.length);
        }
      } catch (err) {
        console.error('Error fetching my tasks:', err);
      }
    };

    fetchMyTasks();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMyTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch low stock alerts count
  useEffect(() => {
    const fetchLowStockAlerts = async () => {
      try {
        const response = await axios.get(`${getApiConfig().baseURL}/inventory/alerts`, {
          ...getApiConfig()
        });
        
        if (response.data.alerts) {
          setLowStockAlertsCount(response.data.alerts.length);
        }
      } catch (err) {
        console.error('Error fetching inventory alerts:', err);
      }
    };

    fetchLowStockAlerts();
    // Refresh every 60 seconds
    const interval = setInterval(fetchLowStockAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get next scheduled shift
  useEffect(() => {
    if (upcomingShifts && upcomingShifts.length > 0) {
      // Get the earliest upcoming shift
      const next = upcomingShifts[0];
      setNextShift(next);
    } else {
      setNextShift(null);
    }
  }, [upcomingShifts]);

  useEffect(() => {
    setLoading(false);
  }, [activeOrdersCount, myTasksCount, lowStockAlertsCount, nextShift]);

  const formatNextShiftTime = (schedule) => {
    if (!schedule) return null;
    
    const scheduleDate = new Date(schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);
    
    const diffTime = scheduleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const dateStr = schedule.schedule_date.split('T')[0];
    const startTime = schedule.start_time || '';
    
    if (diffDays === 0) {
      return `Today at ${startTime}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${startTime}`;
    } else {
      return `${dateStr} at ${startTime}`;
    }
  };

  if (loading) {
    return (
      <DashboardCard title="Today's Quick Stats" icon={<Activity size={20} />}>
        <div className={styles.loading}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-amber-700 text-sm mt-2">Loading stats...</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard 
      title="Today's Quick Stats" 
      icon={<Activity size={20} />}
      itemCount={4}
    >
      <div className={styles.statsGrid}>
        {/* Active Orders */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Activity size={24} className={styles.icon} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{activeOrdersCount}</div>
            <div className={styles.statLabel}>Active Orders</div>
            <div className={styles.statSubtext}>Pending & Processing</div>
          </div>
        </div>

        {/* My Tasks */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckSquare size={24} className={styles.icon} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{myTasksCount}</div>
            <div className={styles.statLabel}>My Tasks</div>
            <div className={styles.statSubtext}>Assigned to you</div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${lowStockAlertsCount > 0 ? styles.alert : ''}`}>
            <AlertTriangle size={24} className={styles.icon} />
          </div>
          <div className={styles.statContent}>
            <div className={`${styles.statValue} ${lowStockAlertsCount > 0 ? styles.alertValue : ''}`}>
              {lowStockAlertsCount}
            </div>
            <div className={styles.statLabel}>Stock Alerts</div>
            <div className={styles.statSubtext}>Low inventory items</div>
          </div>
        </div>

        {/* Next Shift */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={24} className={styles.icon} />
          </div>
          <div className={styles.statContent}>
            {nextShift ? (
              <>
                <div className={styles.statValue}>{nextShift.shift_name || 'Shift'}</div>
                <div className={styles.statLabel}>Next Shift</div>
                <div className={styles.statSubtext}>
                  {formatNextShiftTime(nextShift)}
                </div>
              </>
            ) : (
              <>
                <div className={styles.statValue}>—</div>
                <div className={styles.statLabel}>Next Shift</div>
                <div className={styles.statSubtext}>No upcoming shifts</div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default TodayQuickStats;

