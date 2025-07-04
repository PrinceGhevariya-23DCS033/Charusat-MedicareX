import { Tab } from '@headlessui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCalendar, FaEnvelope, FaFile, FaFlask, FaHistory, FaPhone, FaPrescription, FaPrint, FaUser, FaUserInjured } from 'react-icons/fa';
import PrescriptionForm from '../prescriptions/PrescriptionForm';

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointmentForm, setAppointmentForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: ''
  });

  const [schedule, setSchedule] = useState({
    workingDays: [
      { day: 'monday', isWorking: true, startTime: '09:00', endTime: '20:00' },
      { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '20:00' },
      { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '20:00' },
      { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '20:00' },
      { day: 'friday', isWorking: true, startTime: '09:00', endTime: '20:00' },
      { day: 'saturday', isWorking: false },
      { day: 'sunday', isWorking: false }
    ],
    appointmentDuration: 30, // in minutes
    breakTime: 60, // in minutes
    breakStartTime: '13:00', // lunch break start time
    maxAppointmentsPerDay: 20
  });

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);

  const [showLabTestForm, setShowLabTestForm] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [labTestForm, setLabTestForm] = useState({
    patient: '',
    testType: '',
    testName: '',
    description: '',
    scheduledDate: '',
    notes: ''
  });

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [patientDetails, setPatientDetails] = useState({});
  const [loadingPatient, setLoadingPatient] = useState(false);

  const [showLabTestResultsForm, setShowLabTestResultsForm] = useState(false);
  const [labTestResultsForm, setLabTestResultsForm] = useState({
    results: '',
    reportFile: null
  });

  const [diagnosis, setDiagnosis] = useState('');

  const token = localStorage.getItem('token');
  const doctorId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

  // Add this function to handle token validation
  const validateToken = () => {
    if (!token) {
      setError('Please log in to continue');
      return false;
    }
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded.id || decoded.role !== 'doctor') {
        setError('Invalid user session');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      setError('Invalid session. Please log in again');
      return false;
    }
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchQuery)
    );
  });

  // Update the useEffect for fetching appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!validateToken()) return;

      setLoading(true);
      try {
        // Fetch appointments where the doctor is assigned
        const response = await axios.get(`http://localhost:3000/api/appointments/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data)) {
          // Sort appointments by date and time
          const sortedAppointments = response.data.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
              return a.time.localeCompare(b.time);
            }
            return dateA - dateB;
          });

          setAppointments(sortedAppointments);

          // Extract unique patients from appointments
          const uniquePatients = sortedAppointments.reduce((acc, apt) => {
            if (apt.patient && !acc.find(p => p._id === apt.patient._id)) {
              acc.push(apt.patient);
            }
            return acc;
          }, []);
          setPatients(uniquePatients);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        if (error.response?.status === 403) {
          setError('You do not have permission to view appointments');
        } else if (error.response?.status === 401) {
          setError('Please log in again to view appointments');
        } else {
          setError(error.response?.data?.error || 'Error fetching appointments');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [token, doctorId]);

  // Update the useEffect for fetching schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!validateToken()) return;

      setScheduleLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/schedules/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data) {
          setSchedule(response.data);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        if (error.response?.status === 403) {
          setError('You do not have permission to view schedule');
        } else if (error.response?.status === 401) {
          setError('Please log in again to view schedule');
        } else {
          setError(error.response?.data?.error || 'Error fetching schedule');
        }
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [token, doctorId]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!token || !doctorId) return;

      try {
        const response = await axios.get(`http://localhost:3000/api/prescriptions/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setPrescriptions(response.data);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      }
    };

    fetchPrescriptions();
  }, [token, doctorId]);

  useEffect(() => {
    const testRoute = async () => {
      try {
        console.log('Testing schedules route');
        const response = await axios.get('http://localhost:3000/api/schedules/test');
        console.log('Test route response:', response.data);
      } catch (error) {
        console.error('Test route error:', error);
      }
    };

    testRoute();
  }, []);

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/lab-tests/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLabTests(response.data);
      } catch (error) {
        console.error('Error fetching lab tests:', error);
        toast.error('Failed to fetch lab tests');
      }
    };

    if (doctorId) {
      fetchLabTests();
    }
  }, [doctorId, token]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('Fetching patients for doctor...');
        const response = await axios.get('http://localhost:3000/api/users/doctor/patients', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Patients response:', response.data);
        if (Array.isArray(response.data)) {
          setPatients(response.data);
        } else {
          console.error('Invalid patients data format:', response.data);
          setError('Invalid data format received from server');
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError(error.response?.data?.error || 'Error fetching patients');
      }
    };

    if (token) {
      fetchPatients();
    }
  }, [token]);

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      // Validate appointment exists
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (!appointment) {
        setError('Appointment not found');
        return;
      }

      // Validate status transition
      const validTransitions = {
        'scheduled': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled'],
        'completed': ['cancelled']
      };

      if (!validTransitions[appointment.status]?.includes(newStatus)) {
        setError(`Cannot change status from ${appointment.status} to ${newStatus}`);
        return;
      }

      console.log('Updating appointment status:', {
        appointmentId,
        currentStatus: appointment.status,
        newStatus,
        token: token ? 'Present' : 'Missing'
      });

      const response = await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data) {
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
        setSuccess('Appointment status updated successfully');
      } else {
        setError('Failed to update appointment status: No response data');
      }
    } catch (error) {
      console.error('Error updating appointment status:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        appointmentId
      });
      
      if (error.response?.status === 404) {
        setError('Appointment not found');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Invalid request');
      } else if (error.response?.status === 401) {
        setError('Please log in again to continue');
        // Optionally redirect to login
      } else if (error.response?.status === 403) {
        setError('You do not have permission to update this appointment');
      } else {
        setError(error.response?.data?.details || error.message || 'Error updating appointment status');
      }
    }
  };

  const handleUpdateAppointmentDetails = async (appointmentId) => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        appointmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, ...appointmentForm } 
            : apt
        ));
        setSuccess('Appointment details updated successfully');
        setShowAppointmentDetails(false);
        setAppointmentForm({ diagnosis: '', prescription: '', notes: '' });
      } else {
        setError('Failed to update appointment details');
      }
    } catch (error) {
      setError('Error updating appointment details');
      console.error('Error:', error);
    }
  };

  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosis(appointment.diagnosis || '');
    setShowAppointmentDetails(true);
    if (appointment.patient?._id) {
      fetchPatientDetails(appointment.patient._id);
    }
  };

  const handleCloseAppointmentDetails = () => {
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
    setAppointmentForm({ diagnosis: '', prescription: '', notes: '' });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous errors when user starts typing
    setError('');
  };

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: '',
    diagnosis: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handlePrint = async () => {
    try {
      if (!selectedPrescription) {
        toast.error('No prescription selected');
        return;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Create the HTML content for printing
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .prescription-details {
                margin-bottom: 30px;
              }
              .medications {
                margin-bottom: 30px;
              }
              .medication-item {
                margin-bottom: 15px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
              }
              .signature {
                margin-top: 100px;
                text-align: right;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Medical Prescription</h1>
              <p>Date: ${format(new Date(selectedPrescription.date), 'MMMM d, yyyy')}</p>
            </div>
            
            <div class="prescription-details">
              <h2>Patient Information</h2>
              <p><strong>Name:</strong> ${selectedPrescription.patient.name}</p>
              <p><strong>Diagnosis:</strong> ${selectedPrescription.diagnosis}</p>
            </div>
            
            <div class="medications">
              <h2>Medications</h2>
              ${selectedPrescription.medications.map(med => `
                <div class="medication-item">
                  <p><strong>${med.name}</strong></p>
                  <p>Dosage: ${med.dosage}</p>
                  <p>Frequency: ${med.frequency}</p>
                  <p>Duration: ${med.duration}</p>
                  ${med.instructions ? `<p>Instructions: ${med.instructions}</p>` : ''}
                </div>
              `).join('')}
            </div>
            
            ${selectedPrescription.notes ? `
              <div class="notes">
                <h2>Additional Notes</h2>
                <p>${selectedPrescription.notes}</p>
              </div>
            ` : ''}
            
            <div class="signature">
              <p>Doctor's Signature: _________________</p>
              <p>Date: ${format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
            
            <div class="footer">
              <p>This is a computer-generated prescription. Please consult your doctor for any questions.</p>
            </div>
          </body>
        </html>
      `;

      // Write the content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for images to load before printing
      printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
      };
    } catch (error) {
      console.error('Error printing prescription:', error);
      toast.error('Failed to print prescription');
    }
  };

  const handleScheduleUpdate = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/schedules/doctor/${doctorId}`,
        schedule,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedule(response.data);
      setSuccess('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError(error.response?.data?.error || 'Error updating schedule');
    }
  };

  const handleWorkingDayChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      workingDays: prev.workingDays.map(wd => 
        wd.day === day ? { ...wd, [field]: value } : wd
      )
    }));
  };

  const handleCreatePrescription = async (prescriptionData) => {
    try {
      // Get doctor ID from token if not in localStorage
      let currentDoctorId = doctorId;
      if (!currentDoctorId && token) {
        try {
          // Decode the token to get the doctor's ID
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          currentDoctorId = tokenData.id;
        } catch (error) {
          console.error('Error decoding token:', error);
          toast.error('Error getting doctor information');
          return;
        }
      }

      if (!currentDoctorId) {
        toast.error('Doctor ID not found');
        return;
      }

      console.log('Creating prescription with data:', {
        ...prescriptionData,
        doctor: currentDoctorId
      });

      const response = await fetch('http://localhost:3000/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...prescriptionData,
          doctor: currentDoctorId
        })
      });

      if (response.ok) {
        const newPrescription = await response.json();
        setPrescriptions([newPrescription, ...prescriptions]);
        setShowPrescriptionForm(false);
        setSelectedAppointment(null);
        toast.success('Prescription created successfully');
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        toast.error(error.error || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    }
  };

  const handleCreateLabTest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/lab-tests', labTestForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLabTests([response.data, ...labTests]);
      setShowLabTestForm(false);
      setLabTestForm({
        patient: '',
        testType: '',
        testName: '',
        description: '',
        scheduledDate: '',
        notes: ''
      });
      toast.success('Lab test request created successfully');
    } catch (error) {
      console.error('Error creating lab test:', error);
      toast.error('Failed to create lab test request');
    }
  };

  const handleUpdateLabTestStatus = async (testId, newStatus) => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/lab-tests/${testId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLabTests(labTests.map(test => 
        test._id === testId ? response.data : test
      ));
      toast.success('Lab test status updated successfully');
    } catch (error) {
      console.error('Error updating lab test status:', error);
      toast.error('Failed to update lab test status');
    }
  };

  const handleUpdateLabTestResults = async (testId) => {
    try {
      if (!testId) {
        toast.error('Invalid test ID');
        return;
      }

      const formData = new FormData();
      formData.append('results', labTestResultsForm.results);
      
      if (labTestResultsForm.reportFile) {
        formData.append('reportFile', labTestResultsForm.reportFile);
      }

      console.log('Updating lab test results:', {
        testId,
        hasResults: !!labTestResultsForm.results,
        hasFile: !!labTestResultsForm.reportFile
      });

      const response = await axios.patch(
        `http://localhost:3000/api/lab-tests/${testId}/results`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      if (response.data) {
      setLabTests(labTests.map(test => 
        test._id === testId ? response.data : test
      ));
        setShowLabTestResultsForm(false);
        setLabTestResultsForm({ results: '', reportFile: null });
      toast.success('Lab test results updated successfully');
      }
    } catch (error) {
      console.error('Error updating lab test results:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update lab test results';
      toast.error(errorMessage);
    }
  };

  const handleViewPatientHistory = async (patientId) => {
    try {
      setLoading(true);
      setError('');
      setSelectedPatient(patientId);
      
      // Ensure we have a valid token
      if (!token) {
        setError('Please log in to view patient history');
        return;
      }

      // Fetch patient details and history
      const response = await axios.get(
        `http://localhost:3000/api/users/doctor/patient/${patientId}`, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      const { recentAppointments, recentPrescriptions, ...patientData } = response.data;
      
      // Set patient data
      setSelectedPatient(patientData);

      // Combine all history with proper error handling
      const history = [
        ...(recentAppointments || []).map(apt => ({
          type: 'appointment',
          date: apt.date,
          title: `Appointment`,
          details: {
            type: apt.type,
            status: apt.status,
            symptoms: apt.symptoms,
            diagnosis: apt.diagnosis
          }
        })),
        ...(recentPrescriptions || []).map(pres => ({
          type: 'prescription',
          date: pres.date,
          title: `Prescription`,
          details: {
            diagnosis: pres.diagnosis,
            medications: pres.medications || []
          }
        }))
      ];

      // Sort by date
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPatientHistory(history);
      setShowPatientHistory(true);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to view this patient\'s history');
      } else if (error.response?.status === 401) {
        setError('Please log in again to view patient history');
      } else if (error.response?.status === 404) {
        setError('Patient history not found');
      } else {
        setError(error.response?.data?.error || 'Error fetching patient history');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      // Validate appointment ID
      if (!appointmentId || typeof appointmentId !== 'string' || appointmentId.length < 24) {
        console.error('Invalid appointment ID:', appointmentId);
        setError('Invalid appointment ID');
        return;
      }

      // Validate appointment exists
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (!appointment) {
        console.error('Appointment not found in local state:', appointmentId);
        setError('Appointment not found');
        return;
      }

      // Validate appointment status
      if (appointment.status !== 'scheduled') {
        console.error('Invalid appointment status:', {
          appointmentId,
          currentStatus: appointment.status
        });
        setError('Only scheduled appointments can be started');
        return;
      }

      // Validate doctor is assigned to this appointment
      if (appointment.doctor._id !== doctorId) {
        console.error('Doctor not assigned to this appointment:', {
          appointmentId,
          assignedDoctorId: appointment.doctor._id,
          currentDoctorId: doctorId
        });
        setError('You are not assigned to this appointment');
        return;
      }

      console.log('Starting consultation:', {
        appointmentId,
        currentStatus: appointment.status,
        doctorId: doctorId,
        token: token ? 'Present' : 'Missing',
        appointmentDoctorId: appointment.doctor._id
      });

      const response = await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}/status`,
        { status: 'in-progress' },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data) {
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId ? { ...apt, status: 'in-progress' } : apt
        ));
        setSuccess('Consultation started');
        // Show the consultation form
        setSelectedAppointment(response.data);
        setAppointmentForm({
          diagnosis: '',
          prescription: '',
          notes: ''
        });
        setShowAppointmentDetails(true);
      } else {
        console.error('No response data received');
        setError('Failed to start consultation: No response data');
      }
    } catch (error) {
      console.error('Error starting consultation:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        appointmentId,
        doctorId: doctorId
      });
      
      if (error.response?.status === 404) {
        setError('Appointment not found');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Invalid request');
      } else if (error.response?.status === 401) {
        setError('Please log in again to continue');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to start this consultation');
      } else {
        setError(error.response?.data?.details || error.message || 'Error starting consultation');
      }
    }
  };

  const handleCompleteConsultation = async (appointmentId) => {
    try {
      // Validate appointment exists and status transition is valid
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (!appointment) {
        setError('Appointment not found');
        return;
      }

      const validTransitions = {
        'pending': ['completed', 'cancelled', 'in-progress'],
        'scheduled': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled'],
        'completed': ['cancelled']
      };

      if (!validTransitions[appointment.status]?.includes('completed')) {
        setError(`Cannot complete consultation from status ${appointment.status}`);
        return;
      }

      // First update the diagnosis
      const diagnosisResponse = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/diagnosis`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ diagnosis })
      });

      if (!diagnosisResponse.ok) {
        throw new Error('Failed to update diagnosis');
      }

      // Then update the appointment status
      console.log('Updating appointment status to completed for appointment:', appointmentId);
      const response = await axios.put(
        `http://localhost:3000/api/appointments/${appointmentId}/status`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data) {
        // Update the appointments array with the completed appointment
        const updatedAppointment = { ...appointment, status: 'completed', diagnosis };
        setAppointments(prevAppointments => 
          prevAppointments.map(apt => 
            apt._id === appointmentId ? updatedAppointment : apt
          )
        );
        
        // Close the appointment details modal
        setShowAppointmentDetails(false);
        setSelectedAppointment(null);
        setDiagnosis('');
        setSuccess('Consultation completed successfully');
        
        // Force a re-render of the filtered appointments
        setActiveTab('completed');
      } else {
        throw new Error('Failed to update appointment status: No response data');
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
      if (error.response?.status === 404) {
        setError('Appointment not found');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Invalid request');
      } else if (error.response?.status === 401) {
        setError('Please log in again to continue');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to complete this consultation');
      } else {
        setError(error.response?.data?.details || error.message || 'Failed to complete consultation. Please try again.');
      }
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (!apt.date) return false;
    
    const appointmentDate = new Date(apt.date).toISOString().split('T')[0];
    const isDateMatch = appointmentDate === selectedDate;
    const isCompleted = apt.status === 'completed';
    
    if (activeTab === 'upcoming') {
      // For upcoming tab, show only non-completed appointments for the selected date
      return isDateMatch && !isCompleted;
    } else if (activeTab === 'completed') {
      // For completed tab, show all completed appointments regardless of date
      return isCompleted;
    }
    return false;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Update the fetchPatientDetails function
  const fetchPatientDetails = async (patientId) => {
    if (!validateToken() || !patientId) return;

    setLoadingPatient(true);
    try {
      console.log('Fetching patient details for ID:', patientId);
      const response = await axios.get(`http://localhost:3000/api/users/doctor/patient/${patientId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        console.log('Received patient data:', response.data);
        setPatientDetails(prev => ({
          ...prev,
          [patientId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch patient details';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingPatient(false);
    }
  };

  // Update the renderPatientInformation function
  const renderPatientInformation = (patient) => {
    if (!patient) return null;

    const details = patientDetails[patient._id] || patient;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaUser className="mr-2 text-indigo-600" />
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base text-gray-900">{details.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900">{details.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-base text-gray-900">{details.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Age</p>
                <p className="text-base text-gray-900">{details.age || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Blood Group</p>
                <p className="text-base text-gray-900">{details.bloodGroup || 'N/A'}</p>
              </div>
              {details.studentId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Student ID</p>
                  <p className="text-base text-gray-900">{details.studentId}</p>
                </div>
              )}
              {details.allergies && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Allergies</p>
                  <p className="text-base text-gray-900">{details.allergies}</p>
                </div>
              )}
              {details.medicalHistory && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Medical History</p>
                  <p className="text-base text-gray-900">{details.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleUpdateDiagnosis = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${selectedAppointment._id}/diagnosis`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ diagnosis })
      });

      if (!response.ok) {
        throw new Error('Failed to update diagnosis');
      }

      const updatedAppointment = await response.json();
      setSelectedAppointment(updatedAppointment);
      // Show success message or handle as needed
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      // Handle error appropriately
    }
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Welcome back, Doctor</span>
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold">
            D
          </div>
        </div>
      </div>
      
      <Tab.Group>
        <Tab.List className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm">
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              selected ? 'bg-[var(--accent)] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }>
            <FaCalendar className="w-5 h-5" />
            <span className="font-medium">Appointments</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              selected ? 'bg-[var(--accent)] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }>
            <FaUserInjured className="w-5 h-5" />
            <span className="font-medium">Patients</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              selected ? 'bg-[var(--accent)] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }>
            <FaPrescription className="w-5 h-5" />
            <span className="font-medium">Prescriptions</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              selected ? 'bg-[var(--accent)] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }>
            <FaFlask className="w-5 h-5" />
            <span className="font-medium">Lab Tests</span>
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Appointments Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-gray-800">Appointments</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          activeTab === 'upcoming'
                            ? 'bg-[var(--accent)] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          activeTab === 'completed'
                            ? 'bg-[var(--accent)] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                  {activeTab === 'upcoming' && (
                    <div className="relative">
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                      <FaCalendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  )}
                </div>
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-6">
                    {filteredAppointments.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <FaCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                          {activeTab === 'upcoming' 
                            ? 'No upcoming appointments for this date'
                            : 'No completed appointments found'}
                        </p>
                        {activeTab === 'upcoming' && (
                          <p className="text-gray-400 text-sm mt-2">Select a different date to view appointments</p>
                        )}
                      </div>
                    ) : (
                      filteredAppointments.map(apt => (
                        <div 
                          key={apt._id} 
                          className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-semibold text-xl text-gray-800">{apt.patient?.name}</h4>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <p className="flex items-center text-gray-600">
                                  <FaCalendar className="mr-3 text-gray-400" />
                                  {formatDate(apt.date)} at {formatTime(apt.time)}
                                </p>
                                <p className="flex items-center text-gray-600">
                                  <FaUserInjured className="mr-3 text-gray-400" />
                                  {apt.type.charAt(0).toUpperCase() + apt.type.slice(1)}
                                </p>
                                {apt.symptoms && (
                                  <p className="flex items-center text-gray-600">
                                    <FaPrescription className="mr-3 text-gray-400" />
                                    {apt.symptoms}
                                  </p>
                                )}
                                {apt.diagnosis && activeTab === 'completed' && (
                                  <p className="flex items-center text-gray-600">
                                    <FaFlask className="mr-3 text-gray-400" />
                                    Diagnosis: {apt.diagnosis}
                                  </p>
                                )}
                                <p className="flex items-center text-sm text-gray-500">
                                  Created by: {apt.creator?.name} ({apt.creator?.role})
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <button 
                                onClick={() => handleViewAppointmentDetails(apt)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                              >
                                View Details
                              </button>
                              {activeTab === 'upcoming' && apt.status === 'scheduled' && (
                                <>
                                  <button 
                                    onClick={() => handleStartConsultation(apt._id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-opacity-90 transition-all duration-200"
                                  >
                                    Start Consultation
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateAppointmentStatus(apt._id, 'cancelled')}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {activeTab === 'upcoming' && apt.status === 'in-progress' && (
                                <button 
                                  onClick={() => handleCompleteConsultation(apt._id)}
                                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all duration-200"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Schedule Management</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Duration (minutes)</label>
                    <input
                      type="number"
                      min="15"
                      max="60"
                      value={schedule.appointmentDuration}
                      onChange={(e) => setSchedule(prev => ({ ...prev, appointmentDuration: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (minutes)</label>
                    <input
                      type="number"
                      min="30"
                      max="120"
                      value={schedule.breakTime}
                      onChange={(e) => setSchedule(prev => ({ ...prev, breakTime: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Break Start Time</label>
                    <input
                      type="time"
                      value={schedule.breakStartTime}
                      onChange={(e) => setSchedule(prev => ({ ...prev, breakStartTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Appointments Per Day</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={schedule.maxAppointmentsPerDay}
                      onChange={(e) => setSchedule(prev => ({ ...prev, maxAppointmentsPerDay: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Working Hours</label>
                    {schedule.workingDays.map(day => (
                      <div key={day.day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={day.isWorking}
                            onChange={(e) => handleWorkingDayChange(day.day, 'isWorking', e.target.checked)}
                            className="w-5 h-5 text-[var(--accent)] rounded border-gray-300 focus:ring-[var(--accent)]"
                          />
                          <span className="capitalize font-medium text-gray-700">{day.day}</span>
                        </div>
                        {day.isWorking && (
                          <>
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => handleWorkingDayChange(day.day, 'startTime', e.target.value)}
                              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => handleWorkingDayChange(day.day, 'endTime', e.target.value)}
                              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleScheduleUpdate}
                    className="w-full px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm"
                  >
                    Update Schedule
                  </button>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Patient Details Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">My Patients</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                    {error}
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FaUserInjured className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {searchQuery ? 'No patients found matching your search' : 'No patients found'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-sm text-[var(--accent)] hover:text-opacity-80 transition-colors duration-200"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPatients.map(patient => (
                      <div
                        key={patient._id}
                        className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg text-gray-800">{patient.name}</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center">
                                <FaEnvelope className="mr-2" />
                                {patient.email}
                              </p>
                              <p className="flex items-center">
                                <FaPhone className="mr-2" />
                                {patient.phone}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewPatientHistory(patient._id)}
                            className="px-4 py-2 text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)]/20 transition-all duration-200"
                          >
                            View History
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showPatientHistory && selectedPatient && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800">Patient History</h3>
                    <button
                      onClick={() => setShowPatientHistory(false)}
                      className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                      {error}
                    </div>
                  ) : patientHistory.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FaHistory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientHistory.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-800">{item.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(item.date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'appointment' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'prescription' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.type === 'appointment' && (
                              <>
                                <p>Type: {item.details.type}</p>
                                <p>Status: {item.details.status}</p>
                                {item.details.symptoms && <p>Symptoms: {item.details.symptoms}</p>}
                                {item.details.diagnosis && <p>Diagnosis: {item.details.diagnosis}</p>}
                              </>
                            )}
                            {item.type === 'prescription' && (
                              <>
                                <p>Diagnosis: {item.details.diagnosis}</p>
                                <p>Medications: {item.details.medications.length}</p>
                              </>
                            )}
                            {item.type === 'labTest' && (
                              <>
                                <p>Test Name: {item.details.testName}</p>
                                <p>Status: {item.details.status}</p>
                                {item.details.results && <p>Results: {item.details.results}</p>}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Prescriptions Panel */}
          <Tab.Panel>
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Prescriptions</h2>
                <button
                  onClick={() => setShowPrescriptionForm(true)}
                  className="px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm flex items-center space-x-2"
                >
                  <FaPrescription className="w-5 h-5" />
                  <span>Create New Prescription</span>
                </button>
              </div>

              {showPrescriptionForm ? (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800">Create Prescription</h3>
                    <button
                      onClick={() => {
                        setShowPrescriptionForm(false);
                        setSelectedAppointment(null);
                      }}
                      className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <PrescriptionForm
                    appointment={selectedAppointment}
                    onSubmit={handleCreatePrescription}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription._id}
                      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPrescription(prescription);
                        setShowPrescriptionDetails(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {prescription.patient.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {format(new Date(prescription.date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                          prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{prescription.diagnosis}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {prescription.medications.length} medications
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrescription(prescription);
                          }}
                          className="text-[var(--accent)] hover:text-opacity-80 transition-colors duration-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Lab Tests Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">Lab Test Requests</h3>
                  <button
                    onClick={() => setShowLabTestForm(true)}
                    className="px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm flex items-center space-x-2"
                  >
                    <FaFlask className="w-5 h-5" />
                    <span>Request New Test</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {labTests.map(test => (
                    <div key={test._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800">{test.testName}</h4>
                          <p className="text-sm text-gray-600">Patient: {test.patient?.name}</p>
                          <p className="text-sm text-gray-600">Type: {test.testType}</p>
                          <p className="text-sm text-gray-600">Status: <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            test.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            test.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            test.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>{test.status}</span></p>
                          <p className="text-sm text-gray-600">Requested: {new Date(test.requestedDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button 
                            onClick={() => setSelectedLabTest(test)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                          >
                            View Details
                          </button>
                          {test.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateLabTestStatus(test._id, 'in-progress')}
                              className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-opacity-90 transition-all duration-200"
                            >
                              Start Test
                            </button>
                          )}
                          {test.status === 'in-progress' && (
                            <button 
                              onClick={() => setSelectedLabTest(test)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all duration-200"
                            >
                              Add Results
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showLabTestForm && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800">Request Lab Test</h3>
                    <button
                      onClick={() => setShowLabTestForm(false)}
                      className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleCreateLabTest} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                        value={labTestForm.patient}
                        onChange={(e) => setLabTestForm({ ...labTestForm, patient: e.target.value })}
                        required
                      >
                        <option value="">Select Patient</option>
                        {patients.map(patient => (
                          <option key={patient._id} value={patient._id}>{patient.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                        value={labTestForm.testType}
                        onChange={(e) => setLabTestForm({ ...labTestForm, testType: e.target.value })}
                        required
                      >
                        <option value="">Select Test Type</option>
                        <option value="Blood Test">Blood Test</option>
                        <option value="Urine Test">Urine Test</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="MRI">MRI</option>
                        <option value="CT Scan">CT Scan</option>
                        <option value="Ultrasound">Ultrasound</option>
                        <option value="ECG">ECG</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                        value={labTestForm.testName}
                        onChange={(e) => setLabTestForm({ ...labTestForm, testName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 h-32 resize-none"
                        value={labTestForm.description}
                        onChange={(e) => setLabTestForm({ ...labTestForm, description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                        value={labTestForm.scheduledDate}
                        onChange={(e) => setLabTestForm({ ...labTestForm, scheduledDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 h-32 resize-none"
                        value={labTestForm.notes}
                        onChange={(e) => setLabTestForm({ ...labTestForm, notes: e.target.value })}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm"
                    >
                      Submit Request
                    </button>
                  </form>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Appointment Details</h3>
              <button
                onClick={handleCloseAppointmentDetails}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {renderPatientInformation(selectedAppointment.patient)}

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaCalendar className="mr-2 text-indigo-600" />
                Appointment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base text-gray-900">{format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-base text-gray-900">{selectedAppointment.time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`text-base font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-base text-gray-900">{selectedAppointment.type}</p>
                </div>
                {selectedAppointment.symptoms && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Symptoms</p>
                    <p className="text-base text-gray-900">{selectedAppointment.symptoms}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows="4"
                    placeholder="Enter diagnosis here..."
                  />
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-base text-gray-900">{selectedAppointment.notes}</p>
              </div>
                )}
                  </div>
                  </div>

            {/* Existing action buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCloseAppointmentDetails}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleCompleteConsultation(selectedAppointment._id)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrescriptionDetails && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Prescription Details</h3>
              <button
                onClick={() => {
                  setShowPrescriptionDetails(false);
                  setSelectedPrescription(null);
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Patient Information Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUser className="mr-2 text-indigo-600" />
                  Patient Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base text-gray-900">{selectedPrescription.patient.name || 'N/A'}</p>
                </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{selectedPrescription.patient.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base text-gray-900">{selectedPrescription.patient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Age</p>
                    <p className="text-base text-gray-900">{selectedPrescription.patient.age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Blood Group</p>
                    <p className="text-base text-gray-900">{selectedPrescription.patient.bloodGroup || 'N/A'}</p>
                  </div>
                  {selectedPrescription.patient.studentId && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Student ID</p>
                      <p className="text-base text-gray-900">{selectedPrescription.patient.studentId}</p>
                    </div>
                  )}
                  {selectedPrescription.patient.allergies && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Allergies</p>
                      <p className="text-base text-gray-900">{selectedPrescription.patient.allergies}</p>
                    </div>
                  )}
                  {selectedPrescription.patient.medicalHistory && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Medical History</p>
                      <p className="text-base text-gray-900">{selectedPrescription.patient.medicalHistory}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-800">{format(new Date(selectedPrescription.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPrescription.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedPrescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-medium text-gray-800">{selectedPrescription.diagnosis}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Medications</h4>
                <div className="space-y-3">
                  {selectedPrescription.medications.map((medication, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{medication.name}</p>
                          <p className="text-sm text-gray-600">{medication.dosage}</p>
                          <p className="text-sm text-gray-600">{medication.duration}</p>
                          {medication.instructions && (
                            <p className="text-sm text-gray-600 mt-1">Instructions: {medication.instructions}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{medication.frequency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Notes</h4>
                  <p className="text-gray-600">{selectedPrescription.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowPrescriptionDetails(false);
                    setSelectedPrescription(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center space-x-2"
                >
                  <FaPrint className="w-4 h-4" />
                  <span>Print Prescription</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLabTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Lab Test Details</h3>
              <button
                onClick={() => {
                  setSelectedLabTest(null);
                  setShowLabTestResultsForm(false);
                  setLabTestResultsForm({ results: '', reportFile: null });
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-medium text-gray-800">{selectedLabTest.patient?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Test Name</p>
                  <p className="font-medium text-gray-800">{selectedLabTest.testName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Test Type</p>
                  <p className="font-medium text-gray-800">{selectedLabTest.testType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedLabTest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedLabTest.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    selectedLabTest.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedLabTest.status.charAt(0).toUpperCase() + selectedLabTest.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested Date</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(selectedLabTest.requestedDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled Date</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(selectedLabTest.scheduledDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Description</h4>
                <p className="text-gray-600">{selectedLabTest.description}</p>
              </div>

              {selectedLabTest.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Notes</h4>
                  <p className="text-gray-600">{selectedLabTest.notes}</p>
                </div>
              )}

              {selectedLabTest.status === 'completed' && selectedLabTest.results && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Test Results</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">{selectedLabTest.results}</p>
                    {selectedLabTest.reportFile && (
                      <div className="mt-4">
                        <a
                          href={`http://localhost:3000/${selectedLabTest.reportFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:text-opacity-80 transition-colors duration-200 flex items-center space-x-2"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`http://localhost:3000/${selectedLabTest.reportFile}`, '_blank');
                          }}
                        >
                          <FaFile className="w-4 h-4" />
                          <span>View Report</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLabTest.status === 'in-progress' && showLabTestResultsForm && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Add Test Results</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 h-32 resize-none"
                      value={labTestResultsForm.results}
                      onChange={(e) => setLabTestResultsForm(prev => ({ ...prev, results: e.target.value }))}
                      placeholder="Enter test results"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report File</label>
                    <input
                      type="file"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                      onChange={(e) => setLabTestResultsForm(prev => ({ ...prev, reportFile: e.target.files[0] }))}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>
              <div className="flex justify-end space-x-4">
                <button
                      onClick={() => {
                        setShowLabTestResultsForm(false);
                        setLabTestResultsForm({ results: '', reportFile: null });
                      }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                      Cancel
                </button>
                  <button
                      onClick={() => handleUpdateLabTestResults(selectedLabTest._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-opacity-90 transition-all duration-200"
                    >
                      Submit Results
                    </button>
                  </div>
                </div>
              )}

              {selectedLabTest.status === 'in-progress' && !showLabTestResultsForm && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowLabTestResultsForm(true)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-opacity-90 transition-all duration-200"
                  >
                    Add Results
                  </button>
                </div>
                )}
              </div>
            </div>
        </div>
      )}

      {showLabTestResultsForm && (
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Add Test Results</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 h-32 resize-none"
              value={labTestResultsForm.results}
              onChange={(e) => setLabTestResultsForm(prev => ({ ...prev, results: e.target.value }))}
              placeholder="Enter test results"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report File</label>
            <input
              type="file"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
              onChange={(e) => setLabTestResultsForm(prev => ({ ...prev, reportFile: e.target.files[0] }))}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowLabTestResultsForm(false);
                setLabTestResultsForm({ results: '', reportFile: null });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdateLabTestResults(selectedLabTest._id)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              Submit Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
