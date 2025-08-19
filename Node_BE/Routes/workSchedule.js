const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  handleError, sendSuccess, validateRequiredFields, validateId,
  checkRecordExists, getRecords, asyncHandler
} = require('../utils/routeHelpers');

// Apply authentication to all routes
router.use(authenticateToken);

// Constants for work schedule routes
const SCHEDULE_REQUIRED_FIELDS = ['user_id', 'shift_id', 'schedule_date'];
const SHIFT_REQUIRED_FIELDS = ['shift_name', 'start_time', 'end_time'];
const SCHEDULE_SORT_FIELDS = ['schedule_date', 'shift_name', 'username', 'status'];
const SHIFT_SORT_FIELDS = ['shift_name', 'start_time', 'end_time'];

// Helper function to validate shift overlap
async function checkShiftOverlap(db, userId, scheduleDate, shiftId, excludeScheduleId = null) {
  const excludeClause = excludeScheduleId ? 'AND ws.schedule_id != ?' : '';
  const params = [userId, scheduleDate];
  if (excludeScheduleId) params.push(excludeScheduleId);

  const overlaps = await getRecords(db, `
    SELECT ws.schedule_id, s.shift_name, s.start_time, s.end_time, s.break_minutes
    FROM work_schedule ws
    JOIN shifts s ON ws.shift_id = s.shift_id
    WHERE ws.user_id = ? AND ws.schedule_date = ? AND ws.status != 'cancelled'
    ${excludeClause}
    ORDER BY s.start_time
  `, params);

  if (overlaps.length === 0) return null;

  // Get the new shift details
  const [newShift] = await getRecords(db, `
    SELECT shift_name, start_time, end_time, break_minutes, is_overnight
    FROM shifts WHERE shift_id = ?
  `, [shiftId]);

  // Check for time conflicts with existing shifts
  for (const existing of overlaps) {
    const conflict = checkTimeConflict(existing, newShift);
    if (conflict) {
      return {
        conflict: true,
        message: `Conflicts with existing ${existing.shift_name} shift (${existing.start_time}-${existing.end_time})`,
        existingShift: existing
      };
    }
  }

  return { conflict: false, existingShifts: overlaps };
}

// Helper function to check time conflicts between shifts
function checkTimeConflict(shift1, shift2) {
  // Convert time strings to minutes for easier comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1Start = timeToMinutes(shift1.start_time);
  const s1End = timeToMinutes(shift1.end_time);
  const s2Start = timeToMinutes(shift2.start_time);
  const s2End = timeToMinutes(shift2.end_time);

  // Handle overnight shifts
  const s1EndAdjusted = shift1.is_overnight && s1End < s1Start ? s1End + 1440 : s1End;
  const s2EndAdjusted = shift2.is_overnight && s2End < s2Start ? s2End + 1440 : s2End;

  // Check for overlap (considering break time)
  const breakMinutes = Math.max(shift1.break_minutes || 30, shift2.break_minutes || 30);
  
  return !(s1EndAdjusted + breakMinutes <= s2Start || s2EndAdjusted + breakMinutes <= s1Start);
}

// Helper function to validate scheduling date constraints
function validateScheduleDate(scheduleDate, status = 'scheduled') {
  const today = new Date().toISOString().split('T')[0];
  const inputDate = new Date(scheduleDate).toISOString().split('T')[0];
  
  // Prevent scheduling too far in the future (3 months)
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
  const maxFutureDateStr = maxFutureDate.toISOString().split('T')[0];
  
  // Prevent scheduling too far in the past (1 week for corrections)
  const minPastDate = new Date();
  minPastDate.setDate(minPastDate.getDate() - 7);
  const minPastDateStr = minPastDate.toISOString().split('T')[0];
  
  // Business rules validation
  if (inputDate > maxFutureDateStr) {
    return { 
      valid: false, 
      message: 'Cannot schedule more than 3 months in advance' 
    };
  }
  
  if (inputDate < minPastDateStr && status === 'scheduled') {
    return { 
      valid: false, 
      message: 'Cannot schedule more than 1 week in the past' 
    };
  }
  
  // Status-specific validation
  if (status === 'completed' && inputDate > today) {
    return { 
      valid: false, 
      message: 'Cannot mark future schedules as completed' 
    };
  }
  
  if (status === 'absent' && inputDate > today) {
    return { 
      valid: false, 
      message: 'Cannot mark future schedules as absent' 
    };
  }
  
  // Prevent scheduling on weekends (optional business rule)
  const dayOfWeek = new Date(scheduleDate).getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && status === 'scheduled') {
    console.warn(`Warning: Scheduling on weekend (${dayOfWeek === 0 ? 'Sunday' : 'Saturday'})`);
    // Could return error here if weekends are not allowed
  }
  
  return { valid: true };
}

// Helper function to validate shift staffing limits
async function checkShiftStaffing(db, shiftId, scheduleDate, excludeScheduleId = null) {
  const excludeClause = excludeScheduleId ? 'AND ws.schedule_id != ?' : '';
  const params = [shiftId, scheduleDate];
  if (excludeScheduleId) params.push(excludeScheduleId);

  const [staffingInfo] = await getRecords(db, `
    SELECT 
      s.shift_name,
      s.min_staff,
      s.max_staff,
      COUNT(ws.schedule_id) as current_staff
    FROM shifts s
    LEFT JOIN work_schedule ws ON s.shift_id = ws.shift_id 
      AND ws.schedule_date = ? 
      AND ws.status != 'cancelled'
      ${excludeClause}
    WHERE s.shift_id = ?
    GROUP BY s.shift_id, s.shift_name, s.min_staff, s.max_staff
  `, [scheduleDate, shiftId, ...params.slice(2)]);

  return staffingInfo;
}

/**
 * GET /shifts
 * Get all shifts with optional filtering
 */
router.get('/shifts', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { search, is_active, sort_by = 'shift_name', sort_order = 'asc' } = req.query;
  
  // Build WHERE clause for filtering
  const whereConditions = [];
  const queryParams = [];
  
  if (search) {
    whereConditions.push('shift_name LIKE ?');
    queryParams.push(`%${search}%`);
  }
  
  if (is_active !== undefined) {
    whereConditions.push('is_active = ?');
    queryParams.push(is_active === 'true' ? 1 : 0);
  }
  
  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';
  
  // Validate sort fields
  const validSortBy = SHIFT_SORT_FIELDS.includes(sort_by) ? sort_by : 'shift_name';
  const validSortOrder = ['asc', 'desc'].includes(sort_order?.toLowerCase()) ? sort_order : 'asc';
  
  const shifts = await getRecords(req.db, `
    SELECT 
      shift_id,
      shift_name,
      start_time,
      end_time,
      is_overnight,
      min_staff,
      max_staff,
      break_minutes,
      is_active
    FROM shifts 
    ${whereClause}
    ORDER BY ${validSortBy} ${validSortOrder}
  `, queryParams);

  sendSuccess(res, { shifts });
}));

/**
 * GET /shifts/:id
 * Get a specific shift by ID
 */
router.get('/shifts/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const shiftId = req.params.id;
  
  const validationError = validateId(shiftId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  const [shift] = await getRecords(req.db, `
    SELECT 
      shift_id,
      shift_name,
      start_time,
      end_time,
      is_overnight,
      min_staff,
      max_staff,
      break_minutes,
      is_active
    FROM shifts 
    WHERE shift_id = ?
  `, [shiftId]);

  if (!shift) {
    return handleError(res, 'Shift not found', 404);
  }

  sendSuccess(res, { shift });
}));

/**
 * POST /shifts
 * Create a new shift
 */
router.post('/shifts', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { 
    shift_name, start_time, end_time, is_overnight = 0, 
    min_staff = 1, max_staff = 10, break_minutes = 30, is_active = 1 
  } = req.body;

  const validationError = validateRequiredFields(req.body, SHIFT_REQUIRED_FIELDS);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Check if shift name already exists
  const existingShift = await checkRecordExists(req.db, 'shifts', 'shift_name', shift_name);
  if (existingShift) {
    return handleError(res, 'A shift with this name already exists', 409);
  }

  // Insert new shift
  const result = await req.db.execute(`
    INSERT INTO shifts (shift_name, start_time, end_time, is_overnight, min_staff, max_staff, break_minutes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [shift_name, start_time, end_time, is_overnight, min_staff, max_staff, break_minutes, is_active]);

  const newShiftId = result[0].insertId;

  // Get the created shift
  const [newShift] = await getRecords(req.db, `
    SELECT * FROM shifts WHERE shift_id = ?
  `, [newShiftId]);

  sendSuccess(res, { 
    message: 'Shift created successfully', 
    shift: newShift 
  }, 201);
}));

/**
 * PUT /shifts/:id
 * Update a shift
 */
router.put('/shifts/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const shiftId = req.params.id;
  const { 
    shift_name, start_time, end_time, is_overnight, 
    min_staff, max_staff, break_minutes, is_active 
  } = req.body;

  const validationError = validateId(shiftId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Check if shift exists
  const shiftExists = await checkRecordExists(req.db, 'shifts', 'shift_id', shiftId);
  if (!shiftExists) {
    return handleError(res, 'Shift not found', 404);
  }

  // Check if new shift name conflicts with existing shifts (if name is being changed)
  if (shift_name) {
    const existingShift = await getRecords(req.db, `
      SELECT shift_id FROM shifts WHERE shift_name = ? AND shift_id != ?
    `, [shift_name, shiftId]);
    
    if (existingShift.length > 0) {
      return handleError(res, 'A shift with this name already exists', 409);
    }
  }

  // Update shift
  await req.db.execute(`
    UPDATE shifts 
    SET shift_name = COALESCE(?, shift_name),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        is_overnight = COALESCE(?, is_overnight),
        min_staff = COALESCE(?, min_staff),
        max_staff = COALESCE(?, max_staff),
        break_minutes = COALESCE(?, break_minutes),
        is_active = COALESCE(?, is_active)
    WHERE shift_id = ?
  `, [shift_name, start_time, end_time, is_overnight, min_staff, max_staff, break_minutes, is_active, shiftId]);

  // Get updated shift
  const [updatedShift] = await getRecords(req.db, `
    SELECT * FROM shifts WHERE shift_id = ?
  `, [shiftId]);

  sendSuccess(res, { 
    message: 'Shift updated successfully', 
    shift: updatedShift 
  });
}));

/**
 * DELETE /shifts/:id
 * Delete a shift (only if no schedules are assigned)
 */
router.delete('/shifts/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const shiftId = req.params.id;

  const validationError = validateId(shiftId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Check if shift exists
  const shiftExists = await checkRecordExists(req.db, 'shifts', 'shift_id', shiftId);
  if (!shiftExists) {
    return handleError(res, 'Shift not found', 404);
  }

  // Check if shift has schedules
  const scheduleCount = await getRecords(req.db, `
    SELECT COUNT(*) as count FROM work_schedule WHERE shift_id = ?
  `, [shiftId]);

  if (scheduleCount[0].count > 0) {
    return handleError(res, 'Cannot delete shift: schedules are assigned to this shift', 409);
  }

  // Delete shift
  await req.db.execute(`DELETE FROM shifts WHERE shift_id = ?`, [shiftId]);

  sendSuccess(res, { message: 'Shift deleted successfully' });
}));

/**
 * GET /schedules
 * Get all work schedules with optional filtering
 */
router.get('/schedules', requireRole(['admin', 'staff']), asyncHandler(async (req, res) => {
  const { 
    search, user_id, shift_id, schedule_date, status, 
    date_from, date_to, sort_by = 'schedule_date', sort_order = 'asc' 
  } = req.query;
  
  // Role-based access control
  const userRole = req.user.role;
  const requestingUserId = req.user.userId;
  
  // Build WHERE clause for filtering
  const whereConditions = [];
  const queryParams = [];
  
  // Staff can only see their own schedules
  if (userRole === 'staff') {
    whereConditions.push('ws.user_id = ?');
    queryParams.push(requestingUserId);
  } else if (user_id) {
    whereConditions.push('ws.user_id = ?');
    queryParams.push(user_id);
  }
  
  if (search) {
    whereConditions.push('(u.username LIKE ? OR s.shift_name LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }
  
  if (shift_id) {
    whereConditions.push('ws.shift_id = ?');
    queryParams.push(shift_id);
  }
  
  if (schedule_date) {
    whereConditions.push('ws.schedule_date = ?');
    queryParams.push(schedule_date);
  }
  
  if (status) {
    whereConditions.push('ws.status = ?');
    queryParams.push(status);
  }
  
  if (date_from) {
    whereConditions.push('ws.schedule_date >= ?');
    queryParams.push(date_from);
  }
  
  if (date_to) {
    whereConditions.push('ws.schedule_date <= ?');
    queryParams.push(date_to);
  }
  
  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';
  
  // Validate sort fields
  const validSortBy = SCHEDULE_SORT_FIELDS.includes(sort_by) ? sort_by : 'schedule_date';
  const validSortOrder = ['asc', 'desc'].includes(sort_order?.toLowerCase()) ? sort_order : 'asc';
  
  const schedules = await getRecords(req.db, `
    SELECT 
      ws.schedule_id,
      ws.user_id,
      u.username,
      ws.shift_id,
      s.shift_name,
      s.start_time,
      s.end_time,
      s.is_overnight,
      ws.schedule_date,
      ws.status,
      ws.assigned_at,
      ws.completed_at,
      ws.notes,
      ws.created_by,
      creator.username as created_by_name,
      ws.created_at,
      ws.updated_at
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    JOIN users creator ON ws.created_by = creator.id
    ${whereClause}
    ORDER BY ${validSortBy} ${validSortOrder}, ws.schedule_date ASC
  `, queryParams);

  sendSuccess(res, { schedules });
}));

/**
 * GET /schedules/:id
 * Get a specific schedule by ID
 */
router.get('/schedules/:id', requireRole(['admin', 'staff']), asyncHandler(async (req, res) => {
  const scheduleId = req.params.id;
  
  const validationError = validateId(scheduleId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  const [schedule] = await getRecords(req.db, `
    SELECT 
      ws.schedule_id,
      ws.user_id,
      u.username,
      ws.shift_id,
      s.shift_name,
      s.start_time,
      s.end_time,
      s.is_overnight,
      ws.schedule_date,
      ws.status,
      ws.assigned_at,
      ws.completed_at,
      ws.notes,
      ws.created_by,
      creator.username as created_by_name,
      ws.created_at,
      ws.updated_at
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    JOIN users creator ON ws.created_by = creator.id
    WHERE ws.schedule_id = ?
  `, [scheduleId]);

  if (!schedule) {
    return handleError(res, 'Schedule not found', 404);
  }

  // Role-based access control
  const userRole = req.user.role;
  const requestingUserId = req.user.userId;
  
  if (userRole === 'staff' && schedule.user_id !== requestingUserId) {
    return handleError(res, 'Access denied: You can only view your own schedules', 403);
  }

  sendSuccess(res, { schedule });
}));

/**
 * POST /schedules
 * Create a new work schedule
 */
router.post('/schedules', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { user_id, shift_id, schedule_date, notes } = req.body;
  const created_by = req.user?.userId || req.user?.id;

  const validationError = validateRequiredFields(req.body, SCHEDULE_REQUIRED_FIELDS);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Ensure we have a valid created_by value
  if (!created_by) {
    return handleError(res, 'Unable to identify user for audit trail', 401);
  }

  // Validate schedule date constraints
  const dateValidation = validateScheduleDate(schedule_date, 'scheduled');
  if (!dateValidation.valid) {
    return handleError(res, dateValidation.message, 400);
  }

  // Validate user exists and is active
  const userExists = await checkRecordExists(req.db, 'users', 'id', user_id);
  if (!userExists) {
    return handleError(res, 'User not found', 404);
  }

  // Validate shift exists and is active
  const [shift] = await getRecords(req.db, `
    SELECT * FROM shifts WHERE shift_id = ? AND is_active = 1
  `, [shift_id]);
  
  if (!shift) {
    return handleError(res, 'Shift not found or inactive', 404);
  }

  // Check for existing schedule on same date/shift
  const existingSchedule = await getRecords(req.db, `
    SELECT schedule_id FROM work_schedule 
    WHERE user_id = ? AND shift_id = ? AND schedule_date = ? AND status != 'cancelled'
  `, [user_id, shift_id, schedule_date]);

  if (existingSchedule.length > 0) {
    return handleError(res, 'User is already scheduled for this shift on this date', 409);
  }

  // Check for shift overlaps
  const overlapCheck = await checkShiftOverlap(req.db, user_id, schedule_date, shift_id);
  if (overlapCheck && overlapCheck.conflict) {
    return handleError(res, `Scheduling conflict: ${overlapCheck.message}`, 409);
  }

  // Check staffing limits
  const staffingInfo = await checkShiftStaffing(req.db, shift_id, schedule_date);
  if (staffingInfo.current_staff >= staffingInfo.max_staff) {
    return handleError(res, `Maximum staff limit (${staffingInfo.max_staff}) reached for ${staffingInfo.shift_name} on ${schedule_date}`, 409);
  }

  // Insert new schedule
  const result = await req.db.execute(`
    INSERT INTO work_schedule (user_id, shift_id, schedule_date, notes, created_by)
    VALUES (?, ?, ?, ?, ?)
  `, [user_id, shift_id, schedule_date, notes || null, created_by]);

  const newScheduleId = result[0].insertId;

  // Get the created schedule with full details
  const [newSchedule] = await getRecords(req.db, `
    SELECT 
      ws.schedule_id,
      ws.user_id,
      u.username,
      ws.shift_id,
      s.shift_name,
      s.start_time,
      s.end_time,
      s.is_overnight,
      ws.schedule_date,
      ws.status,
      ws.assigned_at,
      ws.completed_at,
      ws.notes,
      ws.created_by,
      creator.username as created_by_name,
      ws.created_at,
      ws.updated_at
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    JOIN users creator ON ws.created_by = creator.id
    WHERE ws.schedule_id = ?
  `, [newScheduleId]);

  // Include staffing warning if below minimum
  let warnings = [];
  if (staffingInfo.current_staff + 1 < staffingInfo.min_staff) {
    warnings.push(`Warning: Still below minimum staff requirement (${staffingInfo.min_staff}) for this shift`);
  }

  sendSuccess(res, { 
    message: 'Schedule created successfully', 
    schedule: newSchedule,
    warnings: warnings.length > 0 ? warnings : undefined
  }, 201);
}));

/**
 * PUT /schedules/:id
 * Update a work schedule
 */
router.put('/schedules/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const scheduleId = req.params.id;
  const { user_id, shift_id, schedule_date, status, completed_at, notes } = req.body;

  const validationError = validateId(scheduleId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Check if schedule exists
  const [existingSchedule] = await getRecords(req.db, `
    SELECT * FROM work_schedule WHERE schedule_id = ?
  `, [scheduleId]);

  if (!existingSchedule) {
    return handleError(res, 'Schedule not found', 404);
  }

  // Validate user if being changed
  if (user_id && user_id !== existingSchedule.user_id) {
    const userExists = await checkRecordExists(req.db, 'users', 'id', user_id);
    if (!userExists) {
      return handleError(res, 'User not found', 404);
    }
  }

  // Validate shift if being changed
  if (shift_id && shift_id !== existingSchedule.shift_id) {
    const [shift] = await getRecords(req.db, `
      SELECT * FROM shifts WHERE shift_id = ? AND is_active = 1
    `, [shift_id]);
    
    if (!shift) {
      return handleError(res, 'Shift not found or inactive', 404);
    }

    // Check for conflicts if changing shift or user
    const checkUserId = user_id || existingSchedule.user_id;
    const checkDate = schedule_date || existingSchedule.schedule_date;
    
    const overlapCheck = await checkShiftOverlap(req.db, checkUserId, checkDate, shift_id, scheduleId);
    if (overlapCheck && overlapCheck.conflict) {
      return handleError(res, `Scheduling conflict: ${overlapCheck.message}`, 409);
    }

    // Check staffing limits for new shift
    const staffingInfo = await checkShiftStaffing(req.db, shift_id, checkDate, scheduleId);
    if (staffingInfo.current_staff >= staffingInfo.max_staff) {
      return handleError(res, `Maximum staff limit (${staffingInfo.max_staff}) reached for ${staffingInfo.shift_name}`, 409);
    }
  }

  // Validate date constraints if schedule_date is being changed
  if (schedule_date && schedule_date !== existingSchedule.schedule_date) {
    const dateValidation = validateScheduleDate(schedule_date, status || existingSchedule.status);
    if (!dateValidation.valid) {
      return handleError(res, dateValidation.message, 400);
    }
  }

  // Validate status transitions
  if (status && status !== existingSchedule.status) {
    const checkDate = schedule_date || existingSchedule.schedule_date;
    const statusValidation = validateScheduleDate(checkDate, status);
    if (!statusValidation.valid) {
      return handleError(res, statusValidation.message, 400);
    }
  }

  // Update schedule
  await req.db.execute(`
    UPDATE work_schedule 
    SET user_id = COALESCE(?, user_id),
        shift_id = COALESCE(?, shift_id),
        schedule_date = COALESCE(?, schedule_date),
        status = COALESCE(?, status),
        completed_at = COALESCE(?, completed_at),
        notes = COALESCE(?, notes)
    WHERE schedule_id = ?
  `, [user_id, shift_id, schedule_date, status, completed_at, notes, scheduleId]);

  // Get updated schedule
  const [updatedSchedule] = await getRecords(req.db, `
    SELECT 
      ws.schedule_id,
      ws.user_id,
      u.username,
      ws.shift_id,
      s.shift_name,
      s.start_time,
      s.end_time,
      s.is_overnight,
      ws.schedule_date,
      ws.status,
      ws.assigned_at,
      ws.completed_at,
      ws.notes,
      ws.created_by,
      creator.username as created_by_name,
      ws.created_at,
      ws.updated_at
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    JOIN users creator ON ws.created_by = creator.id
    WHERE ws.schedule_id = ?
  `, [scheduleId]);

  sendSuccess(res, { 
    message: 'Schedule updated successfully', 
    schedule: updatedSchedule 
  });
}));

/**
 * DELETE /schedules/:id
 * Delete a work schedule (or mark as cancelled)
 */
router.delete('/schedules/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const scheduleId = req.params.id;
  const { soft_delete = true } = req.query;

  const validationError = validateId(scheduleId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Check if schedule exists
  const scheduleExists = await checkRecordExists(req.db, 'work_schedule', 'schedule_id', scheduleId);
  if (!scheduleExists) {
    return handleError(res, 'Schedule not found', 404);
  }

  if (soft_delete === 'true') {
    // Mark as cancelled instead of deleting
    await req.db.execute(`
      UPDATE work_schedule SET status = 'cancelled' WHERE schedule_id = ?
    `, [scheduleId]);
    
    sendSuccess(res, { message: 'Schedule cancelled successfully' });
  } else {
    // Hard delete
    await req.db.execute(`DELETE FROM work_schedule WHERE schedule_id = ?`, [scheduleId]);
    
    sendSuccess(res, { message: 'Schedule deleted successfully' });
  }
}));

/**
 * GET /availability
 * Get available staff for a specific shift and date
 */
router.get('/availability', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { shift_id, schedule_date } = req.query;

  if (!shift_id || !schedule_date) {
    return handleError(res, 'shift_id and schedule_date are required', 400);
  }

  // Get shift details
  const [shift] = await getRecords(req.db, `
    SELECT * FROM shifts WHERE shift_id = ? AND is_active = 1
  `, [shift_id]);

  if (!shift) {
    return handleError(res, 'Shift not found or inactive', 404);
  }

  // Get all active staff
  const allStaff = await getRecords(req.db, `
    SELECT id, username, role FROM users 
    WHERE status = 1 AND role = 'staff'
    ORDER BY username
  `, []);

  // Get staff already scheduled for this date
  const scheduledStaff = await getRecords(req.db, `
    SELECT DISTINCT ws.user_id, u.username, s.shift_name, s.start_time, s.end_time
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    WHERE ws.schedule_date = ? AND ws.status != 'cancelled'
  `, [schedule_date]);

  // Check availability for each staff member
  const availableStaff = [];
  const unavailableStaff = [];

  for (const staff of allStaff) {
    const conflicts = scheduledStaff.filter(scheduled => scheduled.user_id === staff.id);
    
    if (conflicts.length === 0) {
      availableStaff.push(staff);
    } else {
      // Check for time conflicts
      let hasConflict = false;
      for (const conflict of conflicts) {
        if (checkTimeConflict(conflict, shift)) {
          hasConflict = true;
          break;
        }
      }
      
      if (hasConflict) {
        unavailableStaff.push({
          ...staff,
          conflicts: conflicts.map(c => ({
            shift_name: c.shift_name,
            time_range: `${c.start_time}-${c.end_time}`
          }))
        });
      } else {
        availableStaff.push(staff);
      }
    }
  }

  // Get current staffing for this shift
  const staffingInfo = await checkShiftStaffing(req.db, shift_id, schedule_date);

  sendSuccess(res, {
    shift: {
      shift_id: shift.shift_id,
      shift_name: shift.shift_name,
      time_range: `${shift.start_time}-${shift.end_time}`,
      min_staff: shift.min_staff,
      max_staff: shift.max_staff,
      current_staff: staffingInfo.current_staff
    },
    available_staff: availableStaff,
    unavailable_staff: unavailableStaff,
    staffing_status: {
      current: staffingInfo.current_staff,
      minimum: shift.min_staff,
      maximum: shift.max_staff,
      slots_available: shift.max_staff - staffingInfo.current_staff,
      below_minimum: staffingInfo.current_staff < shift.min_staff
    }
  });
}));

/**
 * POST /schedules/bulk
 * Create multiple schedules at once (e.g., for weekly scheduling)
 */
router.post('/schedules/bulk', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { schedules } = req.body; // Array of schedule objects
  const created_by = req.user?.userId || req.user?.id;

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return handleError(res, 'schedules array is required and must not be empty', 400);
  }

  const results = [];
  const errors = [];

  // Process each schedule
  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];
    const { user_id, shift_id, schedule_date, notes } = schedule;

    try {
      // Validate required fields
      const validationError = validateRequiredFields(schedule, SCHEDULE_REQUIRED_FIELDS);
      if (validationError) {
        errors.push({ index: i, error: validationError });
        continue;
      }

      // Validate schedule date constraints
      const dateValidation = validateScheduleDate(schedule_date, 'scheduled');
      if (!dateValidation.valid) {
        errors.push({ index: i, error: dateValidation.message });
        continue;
      }

      // Check for existing schedule
      const existingSchedule = await getRecords(req.db, `
        SELECT schedule_id FROM work_schedule 
        WHERE user_id = ? AND shift_id = ? AND schedule_date = ? AND status != 'cancelled'
      `, [user_id, shift_id, schedule_date]);

      if (existingSchedule.length > 0) {
        errors.push({ index: i, error: 'User already scheduled for this shift on this date' });
        continue;
      }

      // Check overlap
      const overlapCheck = await checkShiftOverlap(req.db, user_id, schedule_date, shift_id);
      if (overlapCheck && overlapCheck.conflict) {
        errors.push({ index: i, error: overlapCheck.message });
        continue;
      }

      // Check staffing limits
      const staffingInfo = await checkShiftStaffing(req.db, shift_id, schedule_date);
      if (staffingInfo.current_staff >= staffingInfo.max_staff) {
        errors.push({ index: i, error: `Maximum staff limit reached for ${staffingInfo.shift_name}` });
        continue;
      }

      // Insert schedule
      const result = await req.db.execute(`
        INSERT INTO work_schedule (user_id, shift_id, schedule_date, notes, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [user_id, shift_id, schedule_date, notes || null, created_by]);

      results.push({
        index: i,
        schedule_id: result[0].insertId,
        user_id,
        shift_id,
        schedule_date,
        status: 'success'
      });

    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  const response = {
    message: `Bulk schedule creation completed: ${results.length} successful, ${errors.length} failed`,
    successful: results,
    failed: errors,
    summary: {
      total: schedules.length,
      successful: results.length,
      failed: errors.length
    }
  };

  const statusCode = errors.length > 0 ? 207 : 201; // 207 Multi-Status if some failed
  sendSuccess(res, response, statusCode);
}));

/**
 * PUT /schedules/:id/attendance
 * Mark attendance for a specific schedule (complete/absent)
 * Staff can mark their own attendance, admins can mark anyone's
 */
router.put('/schedules/:id/attendance', requireRole(['admin', 'staff']), asyncHandler(async (req, res) => {
  const scheduleId = req.params.id;
  const { status, notes } = req.body; // status should be 'completed' or 'absent'
  const userRole = req.user.role;
  const requestingUserId = req.user.userId;

  const validationError = validateId(scheduleId);
  if (validationError) {
    return handleError(res, validationError, 400);
  }

  // Validate status
  if (!status || !['completed', 'absent'].includes(status)) {
    return handleError(res, 'Status must be either "completed" or "absent"', 400);
  }

  // Check if schedule exists
  const [existingSchedule] = await getRecords(req.db, `
    SELECT 
      ws.*,
      u.username,
      s.shift_name
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    WHERE ws.schedule_id = ?
  `, [scheduleId]);

  if (!existingSchedule) {
    return handleError(res, 'Schedule not found', 404);
  }

  // Role-based access control
  if (userRole === 'staff' && existingSchedule.user_id !== requestingUserId) {
    return handleError(res, 'Access denied: You can only mark your own attendance', 403);
  }

  // Validate date - can only mark attendance for today or past dates
  const today = new Date().toISOString().split('T')[0];
  const scheduleDate = existingSchedule.schedule_date;
  
  if (scheduleDate > today) {
    return handleError(res, 'Cannot mark attendance for future schedules', 400);
  }

  // Prevent changing attendance for old schedules (more than 7 days ago)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  
  if (scheduleDate < weekAgoStr && userRole === 'staff') {
    return handleError(res, 'Cannot modify attendance for schedules older than 7 days', 400);
  }

  // Update attendance
  const completedAt = status === 'completed' ? new Date() : null;
  const attendanceNotes = notes ? `${existingSchedule.notes || ''}\nAttendance: ${notes}`.trim() : existingSchedule.notes;

  await req.db.execute(`
    UPDATE work_schedule 
    SET status = ?, 
        completed_at = ?, 
        notes = ?
    WHERE schedule_id = ?
  `, [status, completedAt, attendanceNotes, scheduleId]);

  // Get updated schedule
  const [updatedSchedule] = await getRecords(req.db, `
    SELECT 
      ws.schedule_id,
      ws.user_id,
      u.username,
      ws.shift_id,
      s.shift_name,
      s.start_time,
      s.end_time,
      ws.schedule_date,
      ws.status,
      ws.assigned_at,
      ws.completed_at,
      ws.notes,
      ws.created_by,
      creator.username as created_by_name,
      ws.created_at,
      ws.updated_at
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    JOIN users creator ON ws.created_by = creator.id
    WHERE ws.schedule_id = ?
  `, [scheduleId]);

  sendSuccess(res, { 
    message: `Attendance marked as ${status}`, 
    schedule: updatedSchedule 
  });
}));

/**
 * GET /reports/attendance
 * Get attendance reports with filtering
 */
router.get('/reports/attendance', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { 
    user_id, date_from, date_to, status, 
    sort_by = 'schedule_date', sort_order = 'desc' 
  } = req.query;
  
  // Default to last 30 days if no date range provided
  const defaultDateTo = new Date().toISOString().split('T')[0];
  const defaultDateFrom = new Date();
  defaultDateFrom.setDate(defaultDateFrom.getDate() - 30);
  const defaultDateFromStr = defaultDateFrom.toISOString().split('T')[0];
  
  // Build WHERE clause for filtering
  const whereConditions = ['ws.schedule_date BETWEEN ? AND ?'];
  const queryParams = [date_from || defaultDateFromStr, date_to || defaultDateTo];
  
  if (user_id) {
    whereConditions.push('ws.user_id = ?');
    queryParams.push(user_id);
  }
  
  if (status) {
    whereConditions.push('ws.status = ?');
    queryParams.push(status);
  }
  
  const whereClause = 'WHERE ' + whereConditions.join(' AND ');
  
  // Validate sort fields
  const validSortBy = SCHEDULE_SORT_FIELDS.includes(sort_by) ? sort_by : 'schedule_date';
  const validSortOrder = ['asc', 'desc'].includes(sort_order?.toLowerCase()) ? sort_order : 'desc';
  
  const attendanceRecords = await getRecords(req.db, `
    SELECT 
      ws.schedule_id,
      ws.user_id,
      u.username,
      ws.shift_id,
      s.shift_name,
      s.start_time,
      s.end_time,
      ws.schedule_date,
      ws.status,
      ws.assigned_at,
      ws.completed_at,
      ws.notes,
      CASE 
        WHEN ws.status = 'completed' THEN 'Present'
        WHEN ws.status = 'absent' THEN 'Absent'
        WHEN ws.status = 'cancelled' THEN 'Cancelled'
        ELSE 'Scheduled'
      END as attendance_status,
      CASE 
        WHEN ws.status = 'completed' AND ws.completed_at IS NOT NULL THEN 
          TIMESTAMPDIFF(HOUR, CONCAT(ws.schedule_date, ' ', s.start_time), ws.completed_at)
        WHEN s.is_overnight = 1 THEN
          CASE 
            WHEN s.end_time < s.start_time THEN 
              24 - TIMESTAMPDIFF(HOUR, s.end_time, s.start_time)
            ELSE 
              TIMESTAMPDIFF(HOUR, s.start_time, s.end_time)
          END
        ELSE 
          TIMESTAMPDIFF(HOUR, s.start_time, s.end_time)
      END as hours_worked
    FROM work_schedule ws
    JOIN users u ON ws.user_id = u.id
    JOIN shifts s ON ws.shift_id = s.shift_id
    ${whereClause}
    ORDER BY ${validSortBy} ${validSortOrder}
  `, queryParams);

  // Calculate summary statistics
  const summary = {
    total_schedules: attendanceRecords.length,
    completed: attendanceRecords.filter(r => r.status === 'completed').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    cancelled: attendanceRecords.filter(r => r.status === 'cancelled').length,
    pending: attendanceRecords.filter(r => r.status === 'scheduled').length,
    total_hours: attendanceRecords
      .filter(r => r.status === 'completed' && r.hours_worked)
      .reduce((sum, r) => sum + (r.hours_worked || 0), 0),
    attendance_rate: attendanceRecords.length > 0 
      ? ((attendanceRecords.filter(r => r.status === 'completed').length / 
          attendanceRecords.filter(r => r.status !== 'cancelled').length) * 100).toFixed(1)
      : 0
  };

  sendSuccess(res, { 
    attendance_records: attendanceRecords,
    summary,
    filters: {
      date_from: date_from || defaultDateFromStr,
      date_to: date_to || defaultDateTo,
      user_id: user_id || 'all',
      status: status || 'all'
    }
  });
}));

module.exports = router;
