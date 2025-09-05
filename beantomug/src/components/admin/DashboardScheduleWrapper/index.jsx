import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import axios from 'axios';
import { getApiConfig } from '../../../utils/config';
import ScheduleCalendar from '../../../pages/admin/WorkScheduleManagement/components/ScheduleCalendar';

const DashboardScheduleWrapper = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await axios.get(
        `/work-schedule/schedules?date_from=${today}&date_to=${endDate}`,
        getApiConfig()
      );
      
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleEditSchedule = (schedule) => {
    window.location.href = `/admin/work-schedule?edit=${schedule.schedule_id}`;
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await axios.delete(`/work-schedule/schedules/${scheduleId}`, getApiConfig());
        fetchSchedules(); // Refresh the list
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-coffee-crystal/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-coffee-rich rounded-lg">
            <Calendar size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-coffee-brown">
              Work Schedule
            </h3>
            <p className="text-xs text-coffee-dark">
              Weekly staff schedule overview
            </p>
          </div>
        </div>
        
        <div className="animate-pulse">
          <div className="h-6 bg-coffee-cream rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 bg-coffee-cream rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-coffee-crystal/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-coffee-rich rounded-lg">
          <Calendar size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-coffee-brown">
            Work Schedule
          </h3>
          <p className="text-xs text-coffee-dark">
            Weekly staff schedule overview
          </p>
        </div>
      </div>

      <div className="bg-coffee-mist/30 rounded-lg p-4 border border-coffee-crystal/20">
        <ScheduleCalendar
          schedules={schedules}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onEditSchedule={handleEditSchedule}
          onDeleteSchedule={handleDeleteSchedule}
          loading={loading}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-coffee-crystal/30">
        <button 
          onClick={() => window.location.href = '/admin/work-schedule'}
          className="w-full text-sm text-coffee-mocha hover:text-coffee-espresso font-medium transition-colors"
        >
          View Full Schedule Management →
        </button>
      </div>
    </div>
  );
};

export default DashboardScheduleWrapper;
