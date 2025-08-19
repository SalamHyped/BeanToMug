import React, { useState, useMemo } from 'react';
import styles from './scheduleCalendar.module.css';

const ScheduleCalendar = ({ 
  schedules = [], 
  selectedDate, 
  onDateSelect, 
  onEditSchedule, 
  onDeleteSchedule, 
  loading 
}) => {
  const [currentView, setCurrentView] = useState('week'); // 'week', 'month'
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Get the start of the week (Sunday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Get the start of the month
  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Generate week days
  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Generate month days
  const monthDays = useMemo(() => {
    const start = getMonthStart(currentDate);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const days = [];
    
    // Add empty cells for days before month start
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add month days
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    return days;
  }, [currentDate]);

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const grouped = {};
    schedules.forEach(schedule => {
      // Convert datetime to simple date string (YYYY-MM-DD)
      const dateKey = new Date(schedule.schedule_date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });
    return grouped;
  }, [schedules]);

  // Get schedules for a specific date
  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const dateKey = date.toISOString().split('T')[0];
    return schedulesByDate[dateKey] || [];
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (date) => {
    onDateSelect(date);
  };

  // Handle schedule action
  const handleScheduleAction = (schedule, action) => {
    if (action === 'edit') {
      onEditSchedule(schedule);
    } else if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete the schedule for ${schedule.username} on ${schedule.schedule_date}?`)) {
        onDeleteSchedule(schedule.schedule_id);
      }
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'absent': return '#dc3545';
      case 'cancelled': return '#6c757d';
      default: return '#007bff';
    }
  };

  // Format date display
  const formatDateDisplay = () => {
    if (currentView === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className={styles.calendar}>
      {/* Calendar Header */}
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button onClick={navigatePrevious} className={styles.navButton}>
            ❮
          </button>
          <h2 className={styles.dateDisplay}>{formatDateDisplay()}</h2>
          <button onClick={navigateNext} className={styles.navButton}>
            ❯
          </button>
        </div>
        
        <div className={styles.controls}>
          <button onClick={navigateToday} className={styles.todayButton}>
            Today
          </button>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${currentView === 'week' ? styles.active : ''}`}
              onClick={() => setCurrentView('week')}
            >
              Week
            </button>
            <button
              className={`${styles.viewButton} ${currentView === 'month' ? styles.active : ''}`}
              onClick={() => setCurrentView('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGrid}>
        {/* Day headers */}
        <div className={styles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={styles.daysGrid}>
          {(currentView === 'week' ? weekDays : monthDays).map((date, index) => {
            if (!date) {
              return <div key={index} className={styles.emptyDay}></div>;
            }

            const daySchedules = getSchedulesForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={date.toISOString()}
                className={`
                  ${styles.dayCell} 
                  ${isToday ? styles.today : ''} 
                  ${isSelected ? styles.selected : ''}
                  ${daySchedules.length > 0 ? styles.hasSchedules : ''}
                `}
                onClick={() => handleDateClick(date)}
              >
                <div className={styles.dayNumber}>
                  {date.getDate()}
                </div>
                
                {daySchedules.length > 0 && (
                  <div className={styles.schedules}>
                    {daySchedules.slice(0, currentView === 'month' ? 2 : 10).map(schedule => (
                      <div
                        key={schedule.schedule_id}
                        className={styles.scheduleItem}
                        style={{ backgroundColor: getStatusColor(schedule.status) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAction(schedule, 'edit');
                        }}
                      >
                        <span className={styles.scheduleName}>
                          {schedule.username}
                        </span>
                        <span className={styles.scheduleShift}>
                          {schedule.shift_name}
                        </span>
                        <span className={styles.scheduleTime}>
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                        
                        <div className={styles.scheduleActions}>
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleAction(schedule, 'edit');
                            }}
                            title="Edit Schedule"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleAction(schedule, 'delete');
                            }}
                            title="Delete Schedule"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {daySchedules.length > (currentView === 'month' ? 2 : 10) && (
                      <div className={styles.moreSchedules}>
                        +{daySchedules.length - (currentView === 'month' ? 2 : 10)} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#007bff' }}></div>
          <span>Scheduled</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#28a745' }}></div>
          <span>Completed</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#dc3545' }}></div>
          <span>Absent</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#6c757d' }}></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
