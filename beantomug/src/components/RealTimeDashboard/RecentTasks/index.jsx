import React from 'react';
import styles from './recentTasks.module.css';

const RecentTasks = ({ tasks = [] }) => {
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return styles.high;
            case 'medium':
                return styles.medium;
            case 'low':
                return styles.low;
            default:
                return styles.medium;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return styles.pending;
            case 'in_progress':
                return styles.inProgress;
            case 'completed':
                return styles.completed;
            default:
                return styles.pending;
        }
    };

    return (
        <div className={styles.section}>
            <h3>📝 Recent Tasks</h3>
            <div className={styles.list}>
                {tasks.length === 0 ? (
                    <p className={styles.empty}>No recent tasks</p>
                ) : (
                    tasks.map((task, index) => (
                        <div key={index} className={styles.item}>
                            <div className={styles.leftContent}>
                                <div className={styles.titleSection}>
                                    <span className={styles.title}>{task.title}</span>
                                    <span className={styles.description}>
                                        {task.description || 'No description'}
                                    </span>
                                </div>
                                <div className={styles.badges}>
                                    <span className={`${styles.priority} ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                    <span className={`${styles.status} ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.itemDetails}>
                                <div className={styles.rightInfo}>
                                    <span className={styles.assignedBy}>
                                        By: {task.assigned_by_name || 'Unknown'}
                                    </span>
                                    <span className={styles.time}>
                                        {new Date(task.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {task.assignments && task.assignments.length > 0 && (
                                <div className={styles.assignments}>
                                    <span className={styles.assignmentsLabel}>Assigned to:</span>
                                    <div className={styles.assignmentsList}>
                                        {task.assignments.map((assignment, idx) => (
                                            <span key={idx} className={styles.assignment}>
                                                {assignment}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentTasks; 