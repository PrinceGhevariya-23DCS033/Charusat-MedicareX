import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaUserInjured, FaUserMd } from 'react-icons/fa';

// Configure axios defaults
axios.defaults.baseURL = ''; // Remove the base URL since we're using Vite's proxy
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
axios.defaults.headers.common['Cache-Control'] = 'no-cache';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';
axios.defaults.headers.common['Accept'] = 'application/json';

// Add timestamp to GET requests to prevent caching
axios.interceptors.request.use((config) => {
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: new Date().getTime()
    };
  }
  console.log('Request Config:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    params: config.params
  });
  return config;
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    return Promise.reject(error);
  }
);

function CounselorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await fetchDashboardData();
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        setError('Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching dashboard data...');
      
      const [statsRes, requestsRes, historyRes] = await Promise.all([
        axios.get('http://localhost:3000/api/appointments/counselor/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:3000/api/appointments/counselor/pending', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:3000/api/appointments/counselor/history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      console.log('Raw appointment requests:', requestsRes.data);
      
      // Ensure we have valid data
      const validRequests = Array.isArray(requestsRes.data.data) 
        ? requestsRes.data.data.filter(apt => 
            apt.patient && 
            apt.patient.isCharusatStudent && 
            apt.counselorApproval === 'pending'
          )
        : [];

      console.log('Filtered CHARUSAT requests:', validRequests);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      setAppointmentRequests(validRequests);
      setAppointmentHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:3000/api/appointments/counselor/${appointmentId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Appointment approved successfully');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to approve appointment');
      }
    } catch (err) {
      console.error('Error approving appointment:', err);
      toast.error(err.response?.data?.message || 'Error approving appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:3000/api/appointments/counselor/${appointmentId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Appointment rejected successfully');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to reject appointment');
      }
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      toast.error(err.response?.data?.message || 'Error rejecting appointment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Counselor Dashboard</h2>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Appointments</h3>
          <p className="text-3xl font-bold text-primary mt-2">{stats.totalAppointments}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700">Pending Approvals</h3>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.pendingAppointments}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700">Approved Appointments</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">{stats.approvedAppointments}</p>
        </div>
      </div>

      {/* Current Appointment Requests */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Pending Appointment Requests</h3>
        {appointmentRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending appointment requests from CHARUSAT students.
          </div>
        ) : (
          <div className="space-y-4">
            {appointmentRequests.map(appointment => (
              <div key={appointment._id} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <FaUserInjured className="text-blue-500" />
                      <p className="font-semibold text-lg">{appointment.patient?.name || 'Unknown Patient'}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-600">Student ID: {appointment.patient?.studentId || 'N/A'}</p>
                      <p className="text-gray-600">Institute: {appointment.patient?.studentInstitute || 'CHARUSAT'}</p>
                      <p className="text-gray-600">Branch: {appointment.patient?.studentBranch || 'N/A'}</p>
                      <p className="text-gray-600">Batch: {appointment.patient?.studentBatch || 'N/A'}</p>
                      <p className="text-sm text-gray-500">Appointment Date: {new Date(appointment.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Time: {appointment.time}</p>
                      <div className="flex items-center gap-2">
                        <FaUserMd className="text-blue-500" />
                        <p className="text-sm text-gray-500">Doctor: Dr. {appointment.doctor?.name || 'Unknown Doctor'} ({appointment.department})</p>
                      </div>
                      {appointment.symptoms && (
                        <p className="text-sm text-gray-500">Symptoms: {appointment.symptoms}</p>
                      )}
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.counselorApproval === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.counselorApproval === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Status: {appointment.counselorApproval.charAt(0).toUpperCase() + appointment.counselorApproval.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApproveRequest(appointment._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      disabled={appointment.counselorApproval !== 'pending'}
                    >
                      <FaCheckCircle />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(appointment._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      disabled={appointment.counselorApproval !== 'pending'}
                    >
                      <FaTimesCircle />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Appointment History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(appointmentHistory) && appointmentHistory.map(history => (
                <tr key={history._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{history.patient?.name}</div>
                    <div className="text-sm text-gray-500">{history.patient?.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{history.doctor?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(history.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${history.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        history.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {history.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{history.bill || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CounselorDashboard;