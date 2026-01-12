import React, { useState, useMemo, useCallback } from 'react';
import { CheckSquare, Clock, Calendar, User, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import DashboardCard from '../../shared/DashboardCard';
import ItemDisplay from '../../shared/ItemDisplay';
import EmptyState from '../../shared/EmptyState';
import { parseDateAsUTC } from '../../../../utils/dateUtils';

const RecentTasks = ({ tasks = [] }) => {
    const [showAll, setShowAll] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    
    // Memoize display tasks to prevent unnecessary recalculations
    const displayTasks = useMemo(() => {
        return showAll ? tasks : tasks.slice(0, 3);
    }, [tasks, showAll]);

    // Memoize priority classes function
    const getPriorityClasses = useCallback((priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);

    // Memoize status classes function
    const getStatusClasses = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);

    // Memoize toggle function
    const toggleTaskDetails = useCallback((taskId) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    }, []);

    // Memoize show all toggle
    const handleShowAllToggle = useCallback(() => {
        setShowAll(prev => !prev);
    }, []);


    // Memoize task content renderer
    const renderTaskContent = useCallback((task, isExpanded, handleToggle) => {
        // Pre-calculate dates to avoid repeated calculations
        // Backend sends dates as ISO strings with Z (UTC), we convert to local time for display
        const createdDate = parseDateAsUTC(task.created_at);
        const timeString = createdDate ? createdDate.toLocaleTimeString() : '';
        const dateString = createdDate ? createdDate.toLocaleDateString() : '';
        const fullDateString = createdDate ? createdDate.toLocaleString() : '';
        
        // Pre-calculate task properties
        const taskId = task.taskId;
        const title = task.title;
        const description = task.description;
        const priority = task.priority;
        const status = task.status;
        const assignedByName = task.assigned_by_name || 'Unknown';
        const assignments = task.assignments || [];
        const hasAssignments = assignments.length > 0;
        const updatedAt = task.updated_at;
        const hasUpdates = updatedAt && updatedAt !== task.created_at;

        return (
            <div className="mb-2 p-2 bg-white rounded-lg border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Task Header */}
                <div className="flex justify-between items-center mb-1 pb-1 border-b border-amber-200">
                    <div className="flex items-center gap-1">
                        <CheckSquare size={16} className="text-amber-700" />
                        <span className="bg-amber-700 text-white px-1 py-0.5 rounded text-xs font-bold shadow-sm">
                            #{taskId}
                        </span>
                        <span className={`px-1 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm ${getStatusClasses(status)}`}>
                            {status}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                        <Clock size={12} />
                        {timeString}
                    </div>
                </div>
                
                {/* Task Details */}
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded-full">
                        {title}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                        <Clock size={12} />
                        <span>{dateString}</span>
                    </div>
                </div>

                {/* Task Description Preview */}
                {description && (
                    <div className="mt-1">
                        <p className="text-xs text-amber-800 line-clamp-2">{description}</p>
                    </div>
                )}

                {/* Task Meta Info */}
                <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`px-1 py-0.5 rounded-full text-xs font-bold uppercase ${getPriorityClasses(priority)}`}>
                        {priority}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                        <User size={12} />
                        By: {assignedByName}
                    </span>
                    {hasAssignments && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                            <Calendar size={12} />
                            Assigned: {assignments.length}
                        </span>
                    )}
                </div>

                {/* Complete Task Details - Inside the content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className="mt-2 space-y-2 border-t border-amber-200 pt-2">
                        <div className="text-xs font-semibold text-amber-800 border-b border-amber-200 pb-1">
                            Complete Task Details
                        </div>
                        
                        {/* Full Description */}
                        {description && (
                            <div className="p-1.5 bg-amber-50 rounded border border-amber-200 transform transition-all duration-200 hover:scale-[1.02]">
                                <span className="text-xs font-medium text-amber-700">Description:</span>
                                <p className="text-xs text-amber-800 mt-1">{description}</p>
                            </div>
                        )}
                        
                        {/* Task Assignments */}
                        {hasAssignments && (
                            <div className="p-1.5 bg-amber-50 rounded border border-amber-200 transform transition-all duration-200 hover:scale-[1.02]">
                                <span className="text-xs font-medium text-amber-700">Assigned to:</span>
                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                    {assignments.map((assignment, idx) => (
                                        <span key={`${taskId}-assignment-${idx}`} className="bg-amber-100 text-amber-700 px-0.5 py-0.5 rounded text-xs transform transition-all duration-150 hover:scale-105">
                                            {assignment}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Task Summary */}
                        <div className="mt-2 p-1.5 bg-white rounded border border-amber-200 transform transition-all duration-200 hover:shadow-md">
                            <div className="text-xs font-semibold text-amber-800 mb-1">Task Summary</div>
                            <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                    <span>Priority:</span>
                                    <span className={getPriorityClasses(priority)}>{priority}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <span className={getStatusClasses(status)}>{status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Created by:</span>
                                    <span>{assignedByName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span>{fullDateString}</span>
                                </div>
                                {hasUpdates && (
                                    <div className="flex justify-between">
                                        <span>Last Updated:</span>
                                        <span>{parseDateAsUTC(updatedAt)?.toLocaleString() || ''}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Show Details Button - Inside the content */}
                <div className="flex justify-center mt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggle();
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors duration-200"
                    >
                        <span>{isExpanded ? 'Show Less' : 'Show Details'}</span>
                        {isExpanded ? (
                            <ChevronUp size={12} className="transition-transform duration-200" />
                        ) : (
                            <ChevronDown size={12} className="transition-transform duration-200" />
                        )}
                    </button>
                </div>
            </div>
        );
    }, [getPriorityClasses, getStatusClasses]);

    return (
        <DashboardCard
            title="Recent Tasks"
            icon={<CheckSquare size={20} />}
            itemCount={tasks.length}
        >
            <div className="space-y-1">
                {tasks.length === 0 ? (
                    <EmptyState icon={<CheckSquare size={32} />} message="No recent tasks" />
                ) : (
                    <>
                        {displayTasks.map((task) => (
                    <ItemDisplay
                                key={task.taskId}
                                item={task}
                                itemId={task.taskId}
                                isExpanded={expandedTasks.has(task.taskId)}
                        onToggleDetails={toggleTaskDetails}
                        renderItemContent={renderTaskContent}
                            />
                        ))}
                        {tasks.length > 3 && (
                            <button
                                onClick={handleShowAllToggle}
                                className="w-full mt-1 p-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors duration-200"
                            >
                                {showAll ? 'Show Less' : `Show All (${tasks.length})`}
                            </button>
                        )}
                    </>
                )}
            </div>
        </DashboardCard>
    );
};

export default React.memo(RecentTasks); 