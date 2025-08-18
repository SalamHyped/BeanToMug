import React, { useState } from 'react';
import styles from './index.module.css';
import ScheduleCalendar from './components/ScheduleCalendar';
import ScheduleForm from './components/ScheduleForm';
import ScheduleFilters from './components/ScheduleFilters';
import ShiftManager from './components/ShiftManager';
import AttendancePanel from './components/AttendancePanel';
import { useSchedules } from './hooks';

const WorkScheduleManagement = () => {
  const [activeView, setActiveView] = useState('calendar'); // 'calendar', 'add', 'shifts', 'attendance'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Use the schedules hook for state management (filters now managed internally)
  const { 
    schedules, 
    shifts, 
    loading, 
    error, 
    filters,
    setFilters,
    fetchSchedules, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    markAttendance,
    checkAvailability
  } = useSchedules();

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'calendar') {
      setEditingScheduleId(null);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingScheduleId(schedule.schedule_id);
    setActiveView('add');
  };

  const handleScheduleCreated = async () => {
    // Refresh the schedule list and switch back to calendar view
    await fetchSchedules();
    setActiveView('calendar');
  };

  const handleCancel = () => {
    setActiveView('calendar');
    setEditingScheduleId(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Update filters to show schedules for selected date
    const dateStr = date.toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      date_from: dateStr,
      date_to: dateStr
    }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderContent = () => {
    switch (activeView) {
      case 'add':
        return (
          <ScheduleForm
            scheduleId={editingScheduleId}
            shifts={shifts}
            onSubmit={handleScheduleCreated}
            onCancel={handleCancel}
            selectedDate={selectedDate}
          />
        );
      case 'shifts':
        return (
          <ShiftManager
            onBack={() => setActiveView('calendar')}
          />
        );
      case 'attendance':
        return (
          <AttendancePanel
            schedules={schedules}
            onMarkAttendance={markAttendance}
            onBack={() => setActiveView('calendar')}
          />
        );
      default:
        return (
          <ScheduleCalendar
            schedules={schedules}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={deleteSchedule}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Work Schedule Management</h1>
        <div className={styles.actions}>
          <button
            className={`${styles.viewButton} ${activeView === 'calendar' ? styles.active : ''}`}
            onClick={() => handleViewChange('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={`${styles.viewButton} ${activeView === 'add' ? styles.active : ''}`}
            onClick={() => handleViewChange('add')}
          >
            ➕ Add Schedule
          </button>
          <button
            className={`${styles.viewButton} ${activeView === 'shifts' ? styles.active : ''}`}
            onClick={() => handleViewChange('shifts')}
          >
            ⚙️ Manage Shifts
          </button>
          <button
            className={`${styles.viewButton} ${activeView === 'attendance' ? styles.active : ''}`}
            onClick={() => handleViewChange('attendance')}
          >
            ✅ Attendance
          </button>
        </div>
      </div>

      {activeView === 'calendar' && (
        <ScheduleFilters
          filters={filters}
          shifts={shifts}
          onFilterChange={handleFilterChange}
          scheduleCount={schedules?.length || 0}
        />
      )}

      {error && (
        <div className={styles.error}>
          <p>❌ Error: {error}</p>
        </div>
      )}

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default WorkScheduleManagement;
