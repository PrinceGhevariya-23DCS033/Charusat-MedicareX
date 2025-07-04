import axios from 'axios';
import React, { useEffect, useState } from 'react';

const DoctorDashboard = () => {
  const token = localStorage.getItem('token');
  let doctorId = null;
  let userRole = null;
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');

  try {
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      doctorId = decoded.id;
      userRole = decoded.role;
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }

  const validateToken = () => {
    if (!token) {
      setError('Please log in to continue');
      return false;
    }
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded.id || decoded.role !== 'doctor') {
        setError('Access denied. Only doctors can view this dashboard.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      setError('Invalid session. Please log in again');
      return false;
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      if (!validateToken()) return;

      try {
        const response = await axios.get('http://localhost:3000/api/users/doctor/patients', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data) {
          setPatients(response.data);
          setError(''); // Clear any previous errors
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        if (error.response?.status === 403) {
          setError('You do not have permission to view patients');
        } else if (error.response?.status === 401) {
          setError('Please log in again to view patients');
        } else {
          setError(error.response?.data?.error || 'Error fetching patients');
        }
      }
    };

    fetchPatients();
  }, [token]);

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Patients</h2>
        
        {patients.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No patients found. Patients will appear here after their first appointment with you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <div key={patient._id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-gray-800">{patient.name}</h3>
                <div className="text-sm text-gray-600 mt-2">
                  <p>Student ID: {patient.studentId}</p>
                  <p>Department: {patient.department}</p>
                  <p>Blood Group: {patient.bloodGroup}</p>
                  <p>Age: {patient.age}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleViewPatientHistory(patient._id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View History
                  </button>
                  <button 
                    onClick={() => handleCreatePrescription(patient)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    New Prescription
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard; 