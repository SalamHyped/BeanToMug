# Work Schedule Backend Validation

## 🛡️ Overview

Since MariaDB doesn't support `CURDATE()` in CHECK constraints, all date and business rule validation is implemented in the backend API. This ensures data integrity while maintaining flexibility.

## 📅 Date Validation Rules

### `validateScheduleDate(scheduleDate, status)` Function

**✅ Prevents scheduling too far in the future:**
- Maximum: 3 months ahead
- Error: `"Cannot schedule more than 3 months in advance"`

**✅ Prevents scheduling too far in the past:**
- Maximum: 1 week ago (for corrections)
- Error: `"Cannot schedule more than 1 week in the past"`

**✅ Status-specific validation:**
- `'completed'` status only allowed for today or past dates
- `'absent'` status only allowed for today or past dates  
- Error: `"Cannot mark future schedules as completed/absent"`

**⚠️ Weekend scheduling warning:**
- Logs warning for Saturday/Sunday scheduling
- Does not block (business decision)

## 🔄 Status Transition Rules

### Attendance Marking (`PUT /schedules/:id/attendance`)

**✅ Time constraints:**
- Can only mark attendance for today or past dates
- Staff cannot modify attendance older than 7 days
- Managers/admins can modify older records

**✅ Access control:**
- Staff can only mark their own attendance
- Managers/admins can mark anyone's attendance

**✅ Valid status transitions:**
- `scheduled` → `completed` ✅
- `scheduled` → `absent` ✅
- `completed` → `absent` ✅ (corrections)
- `absent` → `completed` ✅ (corrections)

## 🔍 Applied In These Endpoints

### 1. **POST /schedules** - Create Schedule
```javascript
// Validate schedule date constraints
const dateValidation = validateScheduleDate(schedule_date, 'scheduled');
if (!dateValidation.valid) {
  return handleError(res, dateValidation.message, 400);
}
```

### 2. **PUT /schedules/:id** - Update Schedule
```javascript
// Validate date if changing schedule_date
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
```

### 3. **POST /schedules/bulk** - Bulk Create
```javascript
// Validate each schedule in the array
const dateValidation = validateScheduleDate(schedule_date, 'scheduled');
if (!dateValidation.valid) {
  errors.push({ index: i, error: dateValidation.message });
  continue;
}
```

### 4. **PUT /schedules/:id/attendance** - Mark Attendance
```javascript
// Special validation for attendance marking
const today = new Date().toISOString().split('T')[0];
const scheduleDate = existingSchedule.schedule_date;

if (scheduleDate > today) {
  return handleError(res, 'Cannot mark attendance for future schedules', 400);
}

// Prevent old modifications by staff
if (scheduleDate < weekAgoStr && userRole === 'staff') {
  return handleError(res, 'Cannot modify attendance for schedules older than 7 days', 400);
}
```

## 🔗 Additional Business Logic

### Shift Overlap Prevention
```javascript
const overlapCheck = await checkShiftOverlap(req.db, user_id, schedule_date, shift_id);
if (overlapCheck && overlapCheck.conflict) {
  return handleError(res, `Scheduling conflict: ${overlapCheck.message}`, 409);
}
```

### Staffing Limit Validation
```javascript
const staffingInfo = await checkShiftStaffing(req.db, shift_id, schedule_date);
if (staffingInfo.current_staff >= staffingInfo.max_staff) {
  return handleError(res, `Maximum staff limit (${staffingInfo.max_staff}) reached`, 409);
}
```

### Break Time Enforcement
```javascript
function checkTimeConflict(shift1, shift2) {
  const breakMinutes = Math.max(shift1.break_minutes || 30, shift2.break_minutes || 30);
  // Check if there's sufficient break time between shifts
  return !(s1EndAdjusted + breakMinutes <= s2Start || s2EndAdjusted + breakMinutes <= s1Start);
}
```

## 📊 Error Response Format

All validation errors return consistent format:
```json
{
  "success": false,
  "message": "Cannot schedule more than 3 months in advance",
  "error": "ValidationError"
}
```

## ✅ Validation Coverage

**✅ Database constraints couldn't handle:**
- Date range validation (3 months future, 1 week past)
- Status-specific date validation  
- Role-based access control
- Complex business rules (overlaps, staffing)

**✅ What we implemented:**
- Comprehensive date validation function
- Status transition rules
- Attendance marking with time constraints
- Shift overlap detection
- Staffing limit enforcement
- Break time validation
- Role-based permissions

**Result:** Full business rule enforcement in backend code, compensating for MariaDB CHECK constraint limitations! 🎯
