import React from 'react';
import TaskPage from '../../../components/TaskPage';

const TaskManagement = () => {
  return (
    <TaskPage
      userRole="admin"
      showCreateForm={true}
      showFilters={true}
      showEditDelete={true}
      title="Task Management"
      subtitle="Create, assign, and manage tasks for your team"
    />
  );
};

export default TaskManagement;