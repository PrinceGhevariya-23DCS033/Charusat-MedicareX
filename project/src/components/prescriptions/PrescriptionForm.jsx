import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const PrescriptionForm = ({ appointment, onSubmit }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState([{
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }]);
  const [notes, setNotes] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch patients when component mounts
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to continue');
          return;
        }

        // Fetch patients using the doctor-specific endpoint
        const response = await axios.get('http://localhost:3000/api/users/doctor/patients', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data) {
          setPatients(response.data);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        if (error.response?.status === 403) {
          toast.error('You do not have permission to view patients');
        } else if (error.response?.status === 401) {
          toast.error('Please log in again');
        } else {
          toast.error('Failed to fetch patients');
        }
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    // If there's an appointment, set the patient name
    if (appointment && appointment.patient) {
      setPatientName(appointment.patient.name);
      setSelectedPatient(appointment.patient);
    }
  }, [appointment]);

  const handlePatientNameChange = (e) => {
    const value = e.target.value;
    setPatientName(value);
    setShowSuggestions(true);

    if (value.trim()) {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  };

  const handlePatientSelect = (patient) => {
    setPatientName(patient.name);
    setSelectedPatient(patient);
    setShowSuggestions(false);
  };

  const addMedication = () => {
    setMedications([...medications, {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const removeMedication = (index) => {
    const newMedications = medications.filter((_, i) => i !== index);
    setMedications(newMedications);
  };

  const updateMedication = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setMedications(newMedications);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!patientName.trim()) {
      toast.error('Please select a patient');
      return;
    }

    if (!diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    if (medications.some(med => !med.name.trim() || !med.dosage.trim() || !med.frequency.trim() || !med.duration.trim())) {
      toast.error('Please fill in all required medication fields');
      return;
    }

    // Create prescription data
    const prescriptionData = {
      patient: selectedPatient._id,
      patientName: selectedPatient.name,
      diagnosis,
      medications,
      notes
    };

    // Only add appointmentId if appointment exists
    if (appointment && appointment._id) {
      prescriptionData.appointmentId = appointment._id;
    }

    onSubmit(prescriptionData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Prescription</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Name with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name
          </label>
          <input
            type="text"
            value={patientName}
            onChange={handlePatientNameChange}
            onFocus={() => setShowSuggestions(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter patient name..."
            required
          />
          {showSuggestions && filteredPatients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient._id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePatientSelect(patient)}
                >
                  {patient.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Enter patient diagnosis..."
            required
          />
        </div>

        {/* Medications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medications
          </label>
          {medications.map((medication, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">Medication {index + 1}</h3>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={medication.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={medication.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={medication.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Enter any special instructions..."
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addMedication}
            className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Medication
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Enter any additional notes..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Prescription
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm; 