import React from 'react';
import { useDashboardComponent } from '../../../../hooks/useDashboardComponent';
import DashboardCard from '../../shared/DashboardCard';
import NavigationDots from '../../shared/NavigationDots';
import ItemDisplay from '../../shared/ItemDisplay';
import EmptyState from '../../shared/EmptyState';

const RecentTasks = ({ tasks = [] }) => {
    const {
        expandedItems: expandedTasks,
        showNewItemIndicator: showNewTaskIndicator,
        newItemIds: newTaskIds,
        currentIndex,
        isSliding,
        slideDirection,
        toggleItemDetails: toggleTaskDetails,
        handleDotClick,
        handleMouseEnter,
        handleMouseLeave,
        currentItem: currentTask
    } = useDashboardComponent(tasks, 'taskId');

    const renderTaskContent = (task) => (
        <>
            {/* Task Header */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                <div className="flex items-center gap-1">
                    <span className="bg-amber-700 text-white px-1 py-0.5 rounded text-xs font-bold shadow-sm transform hover:scale-110 transition-all duration-300">
                        #{task.taskId}
                    </span>
                    <span className={`px-1 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm ${getStatusClasses(task.status)}`}>
                        {task.status}
                    </span>
                </div>
                <div className="text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                    {new Date(task.created_at).toLocaleTimeString()}
                </div>
            </div>
            
            {/* Task Details */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded-full">
                    {task.title}
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                    <span className="animate-spin">🕒</span>
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </>
    );

    const renderTaskDetails = (task) => (
        <div className="flex flex-col gap-2">
            <div className="p-2 bg-white rounded border border-amber-200 shadow-sm">
                <p className="text-xs text-amber-800 mb-2">{task.description}</p>
                <div className="flex flex-wrap gap-1">
                    <span className={`px-1 py-0.5 rounded-full text-xs font-bold uppercase ${getPriorityClasses(task.priority)}`}>
                        {task.priority}
                    </span>
                    <span className="text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                        By: {task.assigned_by_name || 'Unknown'}
                    </span>
                </div>
            </div>
            {task.assignments && task.assignments.length > 0 && (
                <div className="p-2 bg-white rounded border border-amber-200 shadow-sm">
                    <span className="text-xs font-semibold text-amber-700 mb-1 block">Assigned to:</span>
                    <div className="flex flex-wrap gap-1">
                        {task.assignments.map((assignment, idx) => (
                            <span key={idx} className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full text-xs font-medium">
                                {assignment}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const getPriorityClasses = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusClasses = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardCard
            title="Recent Tasks"
            icon="📝"
            itemCount={tasks.length}
            showNewIndicator={showNewTaskIndicator}
            isExpanded={expandedTasks.size > 0}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Single Task Display */}
            <div className={`relative overflow-hidden transition-all duration-500 ${
                expandedTasks.size > 0 ? 'min-h-40' : 'h-32'
            }`}>
                {tasks.length === 0 ? (
                    <EmptyState icon="📋" message="No recent tasks" />
                ) : currentTask ? (
                    <ItemDisplay
                        item={currentTask}
                        itemId={currentTask.taskId}
                        isNew={newTaskIds.has(currentTask.taskId)}
                        isSliding={isSliding}
                        slideDirection={slideDirection}
                        isExpanded={expandedTasks.has(currentTask.taskId)}
                        onToggleDetails={toggleTaskDetails}
                        renderItemContent={renderTaskContent}
                        renderExpandedContent={renderTaskDetails}
                    />
                ) : null}
            </div>
            
            <NavigationDots
                items={tasks}
                currentIndex={currentIndex}
                onDotClick={handleDotClick}
            />
        </DashboardCard>
    );
};

export default RecentTasks; 