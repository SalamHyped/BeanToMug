/**
 * Role-based permission middleware
 * Checks if the authenticated user has the required role(s) to access a route
 */

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be called after authenticateToken)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    // User has required role, continue to next middleware/route
    next();
  };
};

/**
 * Task-specific permission middleware
 * Checks if user can access a specific task
 */
const canAccessTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can access any task
    if (userRole === 'admin') {
      return next();
    }

    // Staff can only access tasks they're assigned to
    if (userRole === 'staff') {
      const [assignments] = await req.db.execute(
        'SELECT COUNT(*) as count FROM task_assignments WHERE task_id = ? AND user_id = ?',
        [taskId, userId]
      );

      if (assignments[0].count > 0) {
        return next();
      } else {
        return res.status(403).json({ 
          error: 'Access denied. You are not assigned to this task.' 
        });
      }
    }

    // Other roles cannot access tasks
    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions.' 
    });

  } catch (error) {
    console.error('Error checking task access:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

/**
 * Task creation permission middleware
 * Checks if user can create tasks
 */
const canCreateTask = (req, res, next) => {
  const userRole = req.user.role;
  
  // Only admins can create tasks
  if (userRole === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    error: 'Access denied. Only admins can create tasks.' 
  });
};

/**
 * Task assignment permission middleware
 * Checks if user can assign tasks to others
 */
const canAssignTasks = (req, res, next) => {
  const userRole = req.user.role;
  
  // Only admins can assign tasks
  if (userRole === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    error: 'Access denied. Only admins can assign tasks.' 
  });
};

/**
 * Task deletion permission middleware
 * Checks if user can delete tasks
 */
const canDeleteTask = (req, res, next) => {
  const userRole = req.user.role;
  
  // Only admins can delete tasks
  if (userRole === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    error: 'Access denied. Only admins can delete tasks.' 
  });
};

module.exports = {
  requireRole,
  canAccessTask,
  canCreateTask,
  canAssignTasks,
  canDeleteTask
}; 