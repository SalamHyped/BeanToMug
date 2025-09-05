import React from 'react';
import TaskPage from '../../components/TaskPage';

const TaskDashboard = () => {
  return (
    <TaskPage
      userRole="staff"
      showCreateForm={false}
      showFilters={true}
      showEditDelete={false}
      title="My Tasks"
      subtitle="Manage your assigned tasks and track progress"
    />
  );
};

export default TaskDashboard;