# Work Schedule Edge Cases & Solutions

## 🚨 Database-Level Edge Cases (Handled)

### 1. **Overnight Shifts**
**Problem**: Evening shift 18:00-02:00 where end_time < start_time
**Solution**: 
- Added `is_overnight` flag to shifts table
- Frontend/Backend must calculate duration properly: 
  ```javascript
  const duration = isOvernight 
    ? (24*60) - (startMinutes - endMinutes) 
    : endMinutes - startMinutes;
  ```

### 2. **Shift Deletion Protection**
**Problem**: Admin deletes shift but staff scheduled for it
**Solution**: 
- Changed `ON DELETE CASCADE` to `ON DELETE RESTRICT` for shifts
- Must remove all schedules before deleting shift

### 3. **Invalid Status Transitions**
**Problem**: Marking future shifts as "completed" or past shifts as "scheduled"
**Solution**: 
- Added `chk_valid_schedule_date` constraint
- Only past dates can be "completed" or "absent"
- Future dates must be "scheduled" or "cancelled"

### 4. **Time Tracking Integrity**
**Problem**: `completed_at` before `assigned_at`
**Solution**: 
- Added `chk_future_completion` constraint
- `completed_at` must be >= `assigned_at`

### 5. **Staffing Limits**
**Problem**: Too many/few staff assigned to same shift
**Solution**: 
- Added `min_staff` and `max_staff` to shifts table
- Backend validation required before assignment

## 🔍 Application-Level Edge Cases (Need Backend Logic)

### 6. **Shift Overlap Prevention**
```sql
-- User assigned to overlapping shifts on same day
-- Morning: 06:00-14:00 
-- Afternoon: 14:00-22:00 (no break between)
```
**Backend Validation Needed**:
```javascript
// Check if user has overlapping shifts on same date
const hasOverlap = await checkUserShiftOverlap(userId, date, shiftId);
if (hasOverlap && !allowOverlap) {
  throw new Error('User has overlapping shifts');
}
```

### 7. **Minimum Break Between Shifts**
**Backend Logic**:
```javascript
// Check break time between consecutive shifts
const breakMinutes = previousShift.break_minutes || 30;
const timeBetween = calculateTimeBetween(previousShift.end_time, newShift.start_time);
if (timeBetween < breakMinutes) {
  throw new Error(`Minimum ${breakMinutes} minutes break required`);
}
```

### 8. **Staff Count Validation**
**Backend Logic**:
```javascript
// Check staffing levels for date/shift
const currentStaff = await getShiftStaffCount(date, shiftId);
const shift = await getShift(shiftId);

if (currentStaff >= shift.max_staff) {
  throw new Error('Maximum staff limit reached for this shift');
}
if (currentStaff < shift.min_staff) {
  console.warn('Below minimum staff for this shift');
}
```

### 9. **User Role/Status Validation**
**Backend Logic**:
```javascript
// Check if user can be scheduled
const user = await getUser(userId);
if (!user.is_active || user.role !== 'staff') {
  throw new Error('User cannot be scheduled');
}
```

### 10. **Date Range Restrictions**
**Backend Logic**:
```javascript
// Prevent scheduling too far in future
const maxFutureDays = 90; // 3 months
const daysDiff = Math.ceil((scheduleDate - new Date()) / (1000 * 60 * 60 * 24));

if (daysDiff > maxFutureDays) {
  throw new Error(`Cannot schedule more than ${maxFutureDays} days in advance`);
}
```

## 🛡️ Frontend Validation & UX

### 11. **Visual Conflict Warnings**
```javascript
// Show warnings for potential issues
if (userHasMultipleShifts(date)) {
  showWarning("User has multiple shifts on this date");
}

if (shiftStaffCount < minStaff) {
  showWarning("Below minimum staff requirement");
}

if (isOvernightShift) {
  showInfo("This shift crosses midnight");
}
```

### 12. **Smart Scheduling Suggestions**
```javascript
// Suggest available users for shifts
const availableUsers = users.filter(user => 
  user.is_active && 
  !hasConflictingShift(user.id, date, shiftId) &&
  hasRequiredBreak(user.id, date, shiftId)
);
```

## 📊 Reporting Edge Cases

### 13. **Overtime Calculation**
```sql
-- Calculate weekly hours including overnight shifts
SELECT 
  user_id,
  WEEK(schedule_date) as week_num,
  SUM(
    CASE 
      WHEN s.is_overnight = 1 THEN 
        (TIME_TO_SEC('24:00:00') - TIME_TO_SEC(s.start_time) + TIME_TO_SEC(s.end_time)) / 3600
      ELSE 
        (TIME_TO_SEC(s.end_time) - TIME_TO_SEC(s.start_time)) / 3600
    END
  ) as total_hours
FROM work_schedule ws
JOIN shifts s ON ws.shift_id = s.shift_id
WHERE ws.status = 'completed'
GROUP BY user_id, WEEK(schedule_date)
HAVING total_hours > 40;
```

### 14. **Attendance Tracking**
```sql
-- Track no-shows and absences
SELECT 
  u.username,
  COUNT(*) as total_scheduled,
  SUM(CASE WHEN ws.status = 'absent' THEN 1 ELSE 0 END) as absences,
  (SUM(CASE WHEN ws.status = 'absent' THEN 1 ELSE 0 END) / COUNT(*) * 100) as absence_rate
FROM work_schedule ws
JOIN users u ON ws.user_id = u.id
WHERE ws.schedule_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY u.id, u.username
HAVING absence_rate > 10;
```

## 🎯 Summary

**Database constraints handle**:
- Data integrity issues
- Invalid status transitions  
- Time tracking consistency
- Basic scheduling rules

**Backend validation should handle**:
- Business logic (overlaps, breaks, staffing)
- User permissions and roles
- Complex scheduling rules

**Frontend should provide**:
- Real-time conflict warnings
- Smart scheduling suggestions
- User-friendly error messages
- Visual schedule representation

This comprehensive approach ensures the work schedule system is robust and handles real-world edge cases effectively! 🛡️
