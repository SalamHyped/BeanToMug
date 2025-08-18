import { useMemo } from 'react';

const useWorkScheduleUtils = () => {
  // Date utility functions
  const dateUtils = useMemo(() => ({
    // Get week start (Sunday)
    getWeekStart: (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day;
      return new Date(d.setDate(diff));
    },

    // Get week end (Saturday)
    getWeekEnd: (date) => {
      const weekStart = dateUtils.getWeekStart(date);
      return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    },

    // Get month start
    getMonthStart: (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    // Get month end
    getMonthEnd: (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    },

    // Format date for display
    formatDate: (date, options = {}) => {
      const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },

    // Format time for display
    formatTime: (timeString) => {
      if (!timeString) return '';
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    },

    // Check if date is today
    isToday: (date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    },

    // Check if date is in the past
    isPast: (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    },

    // Get days between two dates
    getDaysBetween: (date1, date2) => {
      const oneDay = 24 * 60 * 60 * 1000;
      return Math.round(Math.abs((date1 - date2) / oneDay));
    }
  }), []);

  // Schedule utility functions
  const scheduleUtils = useMemo(() => ({
    // Group schedules by date
    groupByDate: (schedules) => {
      return schedules.reduce((groups, schedule) => {
        const date = schedule.schedule_date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(schedule);
        return groups;
      }, {});
    },

    // Group schedules by user
    groupByUser: (schedules) => {
      return schedules.reduce((groups, schedule) => {
        const userId = schedule.user_id;
        if (!groups[userId]) {
          groups[userId] = [];
        }
        groups[userId].push(schedule);
        return groups;
      }, {});
    },

    // Group schedules by shift
    groupByShift: (schedules) => {
      return schedules.reduce((groups, schedule) => {
        const shiftId = schedule.shift_id;
        if (!groups[shiftId]) {
          groups[shiftId] = [];
        }
        groups[shiftId].push(schedule);
        return groups;
      }, {});
    },

    // Get schedule status color
    getStatusColor: (status) => {
      switch (status) {
        case 'completed': return '#28a745';
        case 'absent': return '#dc3545';
        case 'cancelled': return '#6c757d';
        default: return '#007bff';
      }
    },

    // Get schedule status icon
    getStatusIcon: (status) => {
      switch (status) {
        case 'completed': return '✅';
        case 'absent': return '❌';
        case 'cancelled': return '🚫';
        default: return '📅';
      }
    },

    // Calculate schedule duration in hours
    calculateDuration: (startTime, endTime, isOvernight = false) => {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      if (isOvernight && endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours for overnight shifts
      }
      
      return (endMinutes - startMinutes) / 60;
    }
  }), []);

  // Validation utility functions
  const validationUtils = useMemo(() => ({
    // Validate schedule date
    validateScheduleDate: (date, status = 'scheduled') => {
      const today = new Date();
      const inputDate = new Date(date);
      
      // Check if date is too far in future (3 months)
      const maxFutureDate = new Date();
      maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
      
      if (inputDate > maxFutureDate) {
        return { valid: false, message: 'Cannot schedule more than 3 months in advance' };
      }
      
      // Check if date is too far in past (1 week for corrections)
      const minPastDate = new Date();
      minPastDate.setDate(minPastDate.getDate() - 7);
      
      if (inputDate < minPastDate && status === 'scheduled') {
        return { valid: false, message: 'Cannot schedule more than 1 week in the past' };
      }
      
      // Status-specific validation
      if ((status === 'completed' || status === 'absent') && inputDate > today) {
        return { valid: false, message: `Cannot mark future schedules as ${status}` };
      }
      
      return { valid: true };
    },

    // Check for schedule conflicts
    checkScheduleConflict: (newSchedule, existingSchedules) => {
      const conflicts = existingSchedules.filter(existing => 
        existing.user_id === newSchedule.user_id &&
        existing.schedule_date === newSchedule.schedule_date &&
        existing.status !== 'cancelled' &&
        existing.schedule_id !== newSchedule.schedule_id
      );
      
      return conflicts.length > 0 ? conflicts : null;
    }
  }), []);

  return {
    dateUtils,
    scheduleUtils,
    validationUtils
  };
};

export default useWorkScheduleUtils;
