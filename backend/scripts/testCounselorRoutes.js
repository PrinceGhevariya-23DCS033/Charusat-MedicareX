const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let counselorToken = '';

// Test login as counselor
async function testCounselorLogin() {
  try {
    console.log('\n=== Testing Counselor Login ===');
    const response = await axios.post(`${BASE_URL}/users/login`, {
      username: 'counselor1', // Replace with actual counselor username
      password: 'password123' // Replace with actual password
    });
    
    counselorToken = response.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${counselorToken}`;
    
    console.log('Login successful:', response.data);
    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test get pending appointments
async function testGetPendingAppointments() {
  try {
    console.log('\n=== Testing Get Pending Appointments ===');
    const response = await axios.get(`${BASE_URL}/appointments/counselor/pending`);
    console.log('Pending appointments:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to get pending appointments:', error.response?.data || error.message);
    return false;
  }
}

// Test get appointment history
async function testGetAppointmentHistory() {
  try {
    console.log('\n=== Testing Get Appointment History ===');
    const response = await axios.get(`${BASE_URL}/appointments/counselor/history`);
    console.log('Appointment history:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to get appointment history:', error.response?.data || error.message);
    return false;
  }
}

// Test get dashboard stats
async function testGetDashboardStats() {
  try {
    console.log('\n=== Testing Get Dashboard Stats ===');
    const response = await axios.get(`${BASE_URL}/appointments/counselor/stats`);
    console.log('Dashboard stats:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to get dashboard stats:', error.response?.data || error.message);
    return false;
  }
}

// Test approve appointment
async function testApproveAppointment(appointmentId) {
  try {
    console.log('\n=== Testing Approve Appointment ===');
    const response = await axios.put(`${BASE_URL}/appointments/counselor/${appointmentId}/approve`);
    console.log('Appointment approved:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to approve appointment:', error.response?.data || error.message);
    return false;
  }
}

// Test reject appointment
async function testRejectAppointment(appointmentId) {
  try {
    console.log('\n=== Testing Reject Appointment ===');
    const response = await axios.put(`${BASE_URL}/appointments/counselor/${appointmentId}/reject`);
    console.log('Appointment rejected:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to reject appointment:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting counselor route tests...\n');
  
  const loginSuccess = await testCounselorLogin();
  if (!loginSuccess) {
    console.error('Login failed. Stopping tests.');
    return;
  }

  const results = {
    pendingAppointments: await testGetPendingAppointments(),
    appointmentHistory: await testGetAppointmentHistory(),
    dashboardStats: await testGetDashboardStats()
  };

  // If there are pending appointments, test approve/reject
  const pendingResponse = await axios.get(`${BASE_URL}/appointments/counselor/pending`);
  if (pendingResponse.data.length > 0) {
    const appointmentId = pendingResponse.data[0]._id;
    results.approveAppointment = await testApproveAppointment(appointmentId);
    results.rejectAppointment = await testRejectAppointment(appointmentId);
  }

  console.log('\n=== Test Results ===');
  Object.entries(results).forEach(([test, success]) => {
    console.log(`${test}: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  });
}

// Run the tests
runAllTests().catch(console.error); 