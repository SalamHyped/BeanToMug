import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './index.module.css';
import ScheduleCalendar from './components/ScheduleCalendar';
import ScheduleForm from './components/ScheduleForm';
import ScheduleFilters from './components/ScheduleFilters';
import ShiftManager from './components/ShiftManager';
import AttendancePanel from './components/AttendancePanel';
import StaffPlanningModal from './components/StaffPlanningModal';
import { useSchedules } from './hooks';
import { getApiConfig } from '../../../utils/config';

const WorkScheduleManagement = () => {
  const [activeView, setActiveView] = useState('calendar'); // 'calendar', 'add', 'shifts', 'attendance'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [showStaffPlanningModal, setShowStaffPlanningModal] = useState(false);
  const [staffPlanningSettings, setStaffPlanningSettings] = useState({
    start_date: '',
    exclude_dates: ''
  });

  // Use the schedules hook for state management (filters managed internally)
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

  // Load existing planning settings on component mount
  useEffect(() => {
    const loadPlanningSettings = async () => {
      try {
        const response = await axios.get('/work-schedule/planning-settings', getApiConfig());
        setStaffPlanningSettings(response.data.settings);
      } catch (error) {
        console.error('Error loading planning settings:', error);
      }
    };
    
    loadPlanningSettings();
  }, []);

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

  const handleStaffPlanningSettings = async (settings) => {
    try {
      setStaffPlanningSettings(settings);
      
      // Save to backend using axios (consistent with rest of app)
      const response = await axios.post('/work-schedule/planning-settings', settings, getApiConfig());
      
      alert('Staff planning settings saved! Staff will now see shifts based on your configuration.');
    } catch (error) {
      console.error('Error saving planning settings:', error);
      alert('Failed to save planning settings. Please try again.');
    }
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
          <button
            className={styles.settingsButton}
            onClick={() => setShowStaffPlanningModal(true)}
            title="Configure what staff can see in their Available Shifts"
          >
            ⚙️ Staff Planning
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

      <StaffPlanningModal
        isOpen={showStaffPlanningModal}
        onClose={() => setShowStaffPlanningModal(false)}
        onSave={handleStaffPlanningSettings}
        currentSettings={staffPlanningSettings}
      />
    </div>
  );
};

export default WorkScheduleManagement;
