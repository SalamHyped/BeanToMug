import React, { useState, useEffect } from 'react';
import styles from './shiftHistoryView.module.css';
import useStaffSchedule from '../../hooks/useStaffSchedule';

const ShiftHistoryView = ({ userId, loading, error }) => {
  const { fetchShiftHistory } = useStaffSchedule(userId);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'quarter'

  useEffect(() => {
    loadHistory();
  }, [dateRange]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'quarter':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        default: // month
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
      }
      
      const history = await fetchShiftHistory(
        startDate.toISOString().split('T')[0],
        endDate
      );
      setHistoryData(history);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalShifts: historyData.length,
    completedShifts: historyData.filter(s => s.status === 'completed').length,
    missedShifts: historyData.filter(s => s.status === 'absent').length,
    totalHours: historyData.reduce((acc, shift) => {
      if (shift.status === 'completed') {
        const start = new Date(`2000-01-01T${shift.start_time}`);
        const end = new Date(`2000-01-01T${shift.end_time}`);
        if (shift.is_overnight && end <= start) {
          end.setDate(end.getDate() + 1);
        }
        return acc + ((end - start) / (1000 * 60 * 60));
      }
      return acc;
    }, 0)
  };

  const attendanceRate = stats.totalShifts > 0 ? 
    (stats.completedShifts / stats.totalShifts * 100).toFixed(1) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📊 Shift History</h3>
        <div className={styles.dateRangeSelector}>
          <button 
            onClick={() => setDateRange('week')}
            className={`${styles.rangeButton} ${dateRange === 'week' ? styles.active : ''}`}
          >
            Last Week
          </button>
          <button 
            onClick={() => setDateRange('month')}
            className={`${styles.rangeButton} ${dateRange === 'month' ? styles.active : ''}`}
          >
            Last Month
          </button>
          <button 
            onClick={() => setDateRange('quarter')}
            className={`${styles.rangeButton} ${dateRange === 'quarter' ? styles.active : ''}`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {(loading || historyLoading) && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading shift history...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !historyLoading && (
        <>
          {/* Stats Summary */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📊</span>
              <div className={styles.statInfo}>
                <h4>{stats.totalShifts}</h4>
                <p>Total Shifts</p>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statIcon}>✅</span>
              <div className={styles.statInfo}>
                <h4>{stats.completedShifts}</h4>
                <p>Completed</p>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⏰</span>
              <div className={styles.statInfo}>
                <h4>{Math.round(stats.totalHours)}h</h4>
                <p>Hours Worked</p>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📈</span>
              <div className={styles.statInfo}>
                <h4>{attendanceRate}%</h4>
                <p>Attendance Rate</p>
              </div>
            </div>
          </div>

          {historyData.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📊</div>
              <h4>No History Available</h4>
              <p>No shift history found for the selected period.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              <h4>Recent Shifts</h4>
              {historyData.slice(0, 10).map(shift => (
                <div key={shift.schedule_id} className={styles.historyItem}>
                  <div className={styles.shiftInfo}>
                    <h5>{shift.shift_name}</h5>
                    <p>{new Date(shift.schedule_date).toLocaleDateString()}</p>
                  </div>
                  <div className={styles.shiftStatus}>
                    <span className={`${styles.statusBadge} ${styles[shift.status]}`}>
                      {shift.status === 'completed' ? '✅ Completed' :
                       shift.status === 'absent' ? '❌ Missed' :
                       shift.status === 'cancelled' ? '🚫 Cancelled' :
                       '📅 Scheduled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShiftHistoryView;
