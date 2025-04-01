import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import PrescriptionView from './PrescriptionView';

function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Get user token from localStorage
  const token = localStorage.getItem('token');
  // Extract userId from token
  const getUserIdFromToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };
  const userId = getUserIdFromToken(token);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        if (!token || !userId) {
          toast.error('Please log in to view prescriptions');
          return;
        }

        console.log('Fetching prescriptions for user:', userId);

        const response = await fetch(`http://localhost:3000/api/prescriptions/patient/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch prescriptions');
        }

        const data = await response.json();
        setPrescriptions(data);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        toast.error(error.message || 'Failed to fetch prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [token, userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!prescriptions.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No prescriptions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <div
          key={prescription._id}
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedPrescription(prescription)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Dr. {prescription.doctor?.name || 'Unknown Doctor'}
              </h3>
              <p className="text-sm text-gray-600">
                {new Date(prescription.date).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              prescription.status === 'active' ? 'bg-green-100 text-green-800' :
              prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {prescription.status}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{prescription.diagnosis}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {prescription.medications.length} medications
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPrescription(prescription);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
        </div>
      ))}

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Prescription Details</h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <PrescriptionView prescription={selectedPrescription} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientPrescriptions; 