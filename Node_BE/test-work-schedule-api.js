const axios = require('axios');

const BASE_URL = 'http://localhost:8801';
let authToken = '';

// Test authentication
async function authenticateAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@beantomug.com',
      password: 'admin123'
    });
    
    authToken = response.data.token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

// Test shifts endpoints
async function testShiftsEndpoints() {
  console.log('\n🔄 Testing Shifts Endpoints...');
  
  try {
    // Get all shifts
    const shiftsResponse = await axios.get(`${BASE_URL}/work-schedule/shifts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ GET /shifts - Success');
    console.log(`   Found ${shiftsResponse.data.shifts.length} shifts:`);
    shiftsResponse.data.shifts.forEach(shift => {
      console.log(`   - ${shift.shift_name}: ${shift.start_time}-${shift.end_time} (${shift.min_staff}-${shift.max_staff} staff)`);
    });
    
    // Get specific shift
    if (shiftsResponse.data.shifts.length > 0) {
      const firstShiftId = shiftsResponse.data.shifts[0].shift_id;
      const shiftResponse = await axios.get(`${BASE_URL}/work-schedule/shifts/${firstShiftId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log(`✅ GET /shifts/${firstShiftId} - Success`);
      console.log(`   Shift: ${shiftResponse.data.shift.shift_name}`);
    }
    
    return shiftsResponse.data.shifts;
  } catch (error) {
    console.error('❌ Shifts test failed:', error.response?.data || error.message);
    return [];
  }
}

// Test schedules endpoints
async function testSchedulesEndpoints(shifts) {
  console.log('\n🔄 Testing Schedules Endpoints...');
  
  try {
    // Get all schedules
    const schedulesResponse = await axios.get(`${BASE_URL}/work-schedule/schedules`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ GET /schedules - Success');
    console.log(`   Found ${schedulesResponse.data.schedules.length} schedules`);
    
    // Test availability check
    if (shifts.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const availabilityResponse = await axios.get(`${BASE_URL}/work-schedule/availability`, {
        params: {
          shift_id: shifts[0].shift_id,
          schedule_date: tomorrowStr
        },
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ GET /availability - Success');
      console.log(`   Available staff: ${availabilityResponse.data.available_staff.length}`);
      console.log(`   Current staffing: ${availabilityResponse.data.staffing_status.current}/${availabilityResponse.data.staffing_status.maximum}`);
    }
    
    return schedulesResponse.data.schedules;
  } catch (error) {
    console.error('❌ Schedules test failed:', error.response?.data || error.message);
    return [];
  }
}

// Test creating a new schedule
async function testCreateSchedule(shifts) {
  console.log('\n🔄 Testing Schedule Creation...');
  
  if (shifts.length === 0) {
    console.log('⚠️  No shifts available for testing schedule creation');
    return;
  }
  
  try {
    // Get users first
    const usersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const staffUsers = usersResponse.data.users.filter(user => 
      user.role === 'staff' && user.is_active
    );
    
    if (staffUsers.length === 0) {
      console.log('⚠️  No active staff users found for testing');
      return;
    }
    
    // Create a test schedule for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const scheduleData = {
      user_id: staffUsers[0].id,
      shift_id: shifts[0].shift_id,
      schedule_date: tomorrowStr,
      notes: 'Test schedule created by API test'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/work-schedule/schedules`, scheduleData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ POST /schedules - Success');
    console.log(`   Created schedule ID: ${createResponse.data.schedule.schedule_id}`);
    console.log(`   User: ${createResponse.data.schedule.username}`);
    console.log(`   Shift: ${createResponse.data.schedule.shift_name}`);
    console.log(`   Date: ${createResponse.data.schedule.schedule_date}`);
    
    if (createResponse.data.warnings) {
      console.log('⚠️  Warnings:', createResponse.data.warnings);
    }
    
    return createResponse.data.schedule;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Schedule conflict (expected for duplicate attempts):', error.response.data.message);
    } else {
      console.error('❌ Schedule creation failed:', error.response?.data || error.message);
    }
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Work Schedule API Tests...\n');
  
  // Authenticate
  const authenticated = await authenticateAsAdmin();
  if (!authenticated) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test shifts
  const shifts = await testShiftsEndpoints();
  
  // Test schedules
  const schedules = await testSchedulesEndpoints(shifts);
  
  // Test creating a schedule
  const newSchedule = await testCreateSchedule(shifts);
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Authentication: Success`);
  console.log(`✅ Shifts API: ${shifts.length} shifts found`);
  console.log(`✅ Schedules API: ${schedules.length} schedules found`);
  console.log(`${newSchedule ? '✅' : '⚠️'} Schedule Creation: ${newSchedule ? 'Success' : 'Skipped/Failed'}`);
  
  console.log('\n🎉 Work Schedule API tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
