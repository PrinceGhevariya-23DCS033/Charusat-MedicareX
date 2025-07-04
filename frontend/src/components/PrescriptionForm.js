import axios from 'axios';
import React, { useEffect, useState } from 'react';

const PrescriptionForm = () => {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const validateToken = () => {
    if (!token) {
      setError('Please log in to continue');
      return false;
    }
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded.id || decoded.role !== 'doctor') {
        setError('Access denied. Only doctors can create prescriptions.');
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
      
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/users/doctor/patients', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data) {
          setPatients(response.data);
          setError(null); // Clear any previous errors
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
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [token]);

  return (
    <div className="p-4">
      {loading && <div>Loading patients...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && patients.length === 0 && (
        <div>No patients found</div>
      )}
      {/* Add your prescription form components here */}
    </div>
  );
};

export default PrescriptionForm; 