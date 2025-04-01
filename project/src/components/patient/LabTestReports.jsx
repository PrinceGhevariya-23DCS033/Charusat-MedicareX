import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCalendar, FaFileAlt, FaFlask, FaUserMd } from 'react-icons/fa';

const LabTestReports = () => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  // Get user token and ID from localStorage
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/lab-tests/patient/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLabTests(response.data);
      } catch (error) {
        console.error('Error fetching lab tests:', error);
        toast.error('Failed to fetch lab test reports');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchLabTests();
    }
  }, [userId, token]);

  const filteredTests = labTests.filter(test => {
    if (filter === 'all') return true;
    if (filter === 'pending') return test.status === 'pending';
    if (filter === 'completed') return test.status === 'completed';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Lab Test Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Tests
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'pending'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'completed'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="text-center py-8">
          <FaFlask className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No lab tests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all'
              ? 'You have no lab tests yet.'
              : filter === 'pending'
              ? 'You have no pending lab tests.'
              : 'You have no completed lab tests.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div
              key={test._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTest(test)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{test.testName}</h3>
                  <p className="text-sm text-gray-600">{test.testType}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaUserMd className="mr-2" />
                  <span>Doctor: {test.doctor?.name}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendar className="mr-2" />
                  <span>Requested: {formatDate(test.requestedDate)}</span>
                </div>
                {test.scheduledDate && (
                  <div className="flex items-center">
                    <FaCalendar className="mr-2" />
                    <span>Scheduled: {formatDate(test.scheduledDate)}</span>
                  </div>
                )}
              </div>

              {test.status === 'completed' && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(test.reportFile, '_blank');
                    }}
                    className="text-[var(--accent)] hover:text-[var(--accent-dark)] flex items-center"
                  >
                    <FaFileAlt className="mr-2" />
                    View Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lab Test Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Lab Test Details</h2>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Test Information</h3>
                  <p className="text-gray-600">Name: {selectedTest.testName}</p>
                  <p className="text-gray-600">Type: {selectedTest.testType}</p>
                  <p className="text-gray-600">Status: <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedTest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedTest.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    selectedTest.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>{selectedTest.status}</span></p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Doctor Information</h3>
                  <p className="text-gray-600">Name: {selectedTest.doctor?.name}</p>
                  <p className="text-gray-600">Email: {selectedTest.doctor?.email}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-700">Description</h3>
                  <p className="text-gray-600">{selectedTest.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Schedule</h3>
                  <p className="text-gray-600">Requested: {formatDate(selectedTest.requestedDate)}</p>
                  {selectedTest.scheduledDate && (
                    <p className="text-gray-600">Scheduled: {formatDate(selectedTest.scheduledDate)}</p>
                  )}
                </div>
              </div>

              {selectedTest.status === 'completed' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Test Results</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedTest.results}</p>
                  </div>
                  {selectedTest.reportFile && (
                    <div>
                      <a
                        href={selectedTest.reportFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary w-full"
                      >
                        Download Report
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTestReports; 