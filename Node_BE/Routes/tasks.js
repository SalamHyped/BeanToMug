const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  requireRole, 
  canAccessTask, 
  canCreateTask, 
  canAssignTasks, 
  canDeleteTask 
} = require('../middleware/roleMiddleware');

// Get all tasks with assignments (Admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             u1.username as assigned_by_name,
             GROUP_CONCAT(u2.username ORDER BY u2.username SEPARATOR ',') as assignments
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN users u2 ON ta.user_id = u2.id
      GROUP BY t.task_id
      ORDER BY t.created_at DESC
    `;
    
    const [tasks] = await req.db.execute(query);
    
    // Parse assignments string into array
    const tasksWithAssignments = tasks.map(task => ({
      ...task,
      assignments: task.assignments ? task.assignments.split(',') : []
    }));
    
    res.json(tasksWithAssignments);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks assigned to current user (Admin and Staff)
router.get('/my-tasks', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             u1.username as assigned_by_name,
             GROUP_CONCAT(u2.username ORDER BY u2.username SEPARATOR ',') as all_assignments
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      INNER JOIN task_assignments ta ON t.task_id = ta.task_id AND ta.user_id = ?
      LEFT JOIN task_assignments ta2 ON t.task_id = ta2.task_id
      LEFT JOIN users u2 ON ta2.user_id = u2.id
      GROUP BY t.task_id
      ORDER BY t.due_date ASC, t.priority DESC
    `;
    
    const [tasks] = await req.db.execute(query, [req.user.id]);
    
    // Parse assignments string into array
    const tasksWithAssignments = tasks.map(task => ({
      ...task,
      all_assignments: task.all_assignments ? task.all_assignments.split(',') : []
    }));
    
    res.json(tasksWithAssignments);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get recent tasks for dashboard display (Admin and Staff)
router.get('/recent', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const query = `
      SELECT t.*, 
             u1.username as assigned_by_name,
             GROUP_CONCAT(u2.username ORDER BY u2.username SEPARATOR ',') as assignments
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN users u2 ON ta.user_id = u2.id
      GROUP BY t.task_id
      ORDER BY t.created_at DESC
      LIMIT ?
    `;
    
    const [tasks] = await req.db.execute(query, [limit]);
    
    // Parse assignments string into array
    const tasksWithAssignments = tasks.map(task => ({
      ...task,
      assignments: task.assignments ? task.assignments.split(',') : []
    }));
    
    res.json({
      success: true,
      tasks: tasksWithAssignments
    });
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent tasks' 
    });
  }
});

// Get single task with assignments and comments (Admin or assigned Staff)
router.get('/:taskId', authenticateToken, canAccessTask, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    // Get task details with assignments
    const [tasks] = await req.db.execute(`
      SELECT t.*, 
             u1.username as assigned_by_name,
             GROUP_CONCAT(u2.username ORDER BY u2.username SEPARATOR ',') as assignments
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN users u2 ON ta.user_id = u2.id
      WHERE t.task_id = ?
      GROUP BY t.task_id
    `, [taskId]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get task comments
    const [comments] = await req.db.execute(`
      SELECT tc.*, u.username as user_name
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `, [taskId]);
    
    const task = tasks[0];
    
    // Parse assignments string into array
    task.assignments = task.assignments ? task.assignments.split(',') : [];
    task.comments = comments;
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task with assignments (Admin only)
router.post('/', authenticateToken, canCreateTask, async (req, res) => {
  try {
    const { title, description, assignments, priority, due_date, estimated_hours } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ error: 'At least one assignment is required' });
    }
    
    // Start transaction using MySQL2 method
    await req.db.beginTransaction();
    
    try {
      // Create task
      const taskQuery = `
        INSERT INTO tasks (title, description, priority, due_date, estimated_hours, assigned_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [taskResult] = await req.db.execute(taskQuery, [
        title, 
        description, 
        priority || 'medium', 
        due_date, 
        estimated_hours, 
        req.user.id
      ]);
      
      const taskId = taskResult.insertId;
      
      // Create assignments
      const assignmentQuery = `
        INSERT INTO task_assignments (task_id, user_id, assigned_by)
        VALUES (?, ?, ?)
      `;
      
      for (const userId of assignments) {
        await req.db.execute(assignmentQuery, [taskId, userId, req.user.id]);
      }
      
      await req.db.commit();
      
      // Emit real-time notification for new task
      if (req.socketService) {
        req.socketService.emitNewTask({
          taskId,
          title,
          description,
          priority: priority || 'medium',
          dueDate: due_date,
          assignedBy: req.user.username,
          assignments,
          createdAt: new Date().toISOString()
        });
        
        // Emit notification to staff
        req.socketService.emitNotification({
          targetRole: 'staff',
          message: `New task "${title}" assigned to you`,
          type: 'new_task'
        });
      }
      
      res.status(201).json({ 
        message: 'Task created successfully',
        task_id: taskId 
      });
    } catch (error) {
      await req.db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task (Admin or assigned Staff)
router.put('/:taskId', authenticateToken, canAccessTask, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { title, description, status, priority, due_date, estimated_hours, actual_hours } = req.body;
    
    // Validate status transition if status is being changed
    if (status !== undefined) {
      // Get current task status
      const [currentTask] = await req.db.execute(
        'SELECT status FROM tasks WHERE task_id = ?', 
        [taskId]
      );
      
      if (currentTask.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const currentStatus = currentTask[0].status;
      const newStatus = status;
      
      // Define allowed status transitions
      const allowedTransitions = {
        'pending': ['pending', 'in_progress', 'cancelled'],
        'in_progress': ['pending', 'in_progress', 'completed', 'cancelled'],
        'completed': ['completed'], // Cannot change from completed
        'cancelled': ['cancelled']  // Cannot change from cancelled
      };
      
      // Validate transition
      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return res.status(400).json({ 
          error: `Invalid status transition from ${currentStatus} to ${newStatus}` 
        });
      }
    }
    
    // Build dynamic query based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }
    if (due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(due_date);
    }
    if (estimated_hours !== undefined) {
      updateFields.push('estimated_hours = ?');
      updateValues.push(estimated_hours);
    }
    if (actual_hours !== undefined) {
      updateFields.push('actual_hours = ?');
      updateValues.push(actual_hours);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const query = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE task_id = ?
    `;
    
    updateValues.push(taskId);
    
    await req.db.execute(query, updateValues);
    
    // Emit real-time notification for task update
    req.socketService.emitTaskUpdate({
      taskId,
      title: title || 'Task',
      status: status || 'updated',
      priority: priority || 'medium',
      updatedBy: req.user.username,
      updatedAt: new Date().toISOString()
    });
    
    // Emit notification to staff
    const taskTitle = title || 'Task';
    const taskStatus = status || 'updated';
    req.socketService.emitNotification({
      targetRole: 'staff',
      message: `Task "${taskTitle}" updated to ${taskStatus}`,
      type: 'task_update'
    });
    
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task assignments (Admin only)
router.put('/:taskId/assignments', authenticateToken, canAssignTasks, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { assignments } = req.body;
    
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ error: 'At least one assignment is required' });
    }
    
    // Start transaction using MySQL2 method
    await req.db.beginTransaction();
    
    try {
      // Remove existing assignments
      await req.db.execute('DELETE FROM task_assignments WHERE task_id = ?', [taskId]);
      
      // Add new assignments
      const assignmentQuery = `
        INSERT INTO task_assignments (task_id, user_id, assigned_by)
        VALUES (?, ?, ?)
      `;
      
      for (const userId of assignments) {
        await req.db.execute(assignmentQuery, [taskId, userId, req.user.id]);
      }
      
      await req.db.commit();
      
      res.json({ message: 'Task assignments updated successfully' });
    } catch (error) {
      await req.db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating task assignments:', error);
    res.status(500).json({ error: 'Failed to update task assignments' });
  }
});

// Delete task (Admin only)
router.delete('/:taskId', authenticateToken, canDeleteTask, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    await req.db.execute('DELETE FROM tasks WHERE task_id = ?', [taskId]);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Add comment to task (Admin or assigned Staff)
router.post('/:taskId/comments', authenticateToken, canAccessTask, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }
    
    const query = `
      INSERT INTO task_comments (task_id, user_id, comment)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await req.db.execute(query, [taskId, req.user.id, comment]);
    
    res.status(201).json({ 
      message: 'Comment added successfully',
      comment_id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get all staff users for task assignment (Admin only)
router.get('/users/staff', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [users] = await req.db.execute(`
      SELECT id, username, first_name, last_name, email
      FROM users 
      WHERE role = 'staff'
      ORDER BY username
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching staff users:', error);
    res.status(500).json({ error: 'Failed to fetch staff users' });
  }
});

module.exports = router; 