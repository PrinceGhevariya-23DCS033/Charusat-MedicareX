import { Tab } from '@headlessui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCalendar, FaEnvelope, FaFlask, FaHistory, FaPhone, FaPrescription, FaUserInjured } from 'react-icons/fa';
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
      { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'saturday', isWorking: false },
      { day: 'sunday', isWorking: false }
    ],
    appointmentDuration: 15,
    maxAppointmentsPerDay: 20
  });

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

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

  // Get user token and doctor ID from localStorage
  const token = localStorage.getItem('token');
  const doctorId = localStorage.getItem('userId');

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchQuery)
    );
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Get doctor ID from token if not in localStorage
        let currentDoctorId = doctorId;
        if (!currentDoctorId && token) {
          try {
            // Decode the token to get the doctor's ID
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            currentDoctorId = tokenData.id;
            // Store the doctor ID in localStorage
            localStorage.setItem('userId', currentDoctorId);
          } catch (error) {
            console.error('Error decoding token:', error);
            setError('Error getting doctor information');
            return;
          }
        }

        if (!currentDoctorId) {
          setError('Doctor ID not found');
          return;
        }

        console.log('Fetching appointments for doctor:', currentDoctorId);

        // Fetch appointments where the doctor is assigned
        const response = await axios.get(`http://localhost:3000/api/appointments/user/${currentDoctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Fetched appointments:', response.data);

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

          // Add creator information to each appointment
          const appointmentsWithCreator = await Promise.all(
            sortedAppointments.map(async (apt) => {
              try {
                // Only fetch creator details if createdBy exists and is a valid ID
                if (apt.createdBy && typeof apt.createdBy === 'string' && apt.createdBy.length > 0) {
                  try {
                    const creatorResponse = await axios.get(
                      `http://localhost:3000/api/users/${apt.createdBy}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    return {
                      ...apt,
                      creator: {
                        name: creatorResponse.data.name,
                        role: creatorResponse.data.role
                      }
                    };
                  } catch (error) {
                    console.warn('Could not fetch creator details:', error.message);
                    // Return appointment with default creator info on error
                    return {
                      ...apt,
                      creator: {
                        name: 'Unknown',
                        role: 'unknown'
                      }
                    };
                  }
                }
                // If no creator, return appointment with default creator info
                return {
                  ...apt,
                  creator: {
                    name: 'System',
                    role: 'system'
                  }
                };
              } catch (error) {
                console.warn('Error processing appointment creator:', error.message);
                // Return appointment with default creator info on error
                return {
                  ...apt,
                  creator: {
                    name: 'Unknown',
                    role: 'unknown'
                  }
                };
              }
            })
          );

          setAppointments(appointmentsWithCreator);

          // Extract unique patients from appointments
          const uniquePatients = appointmentsWithCreator.reduce((acc, apt) => {
            if (apt.patient && !acc.find(p => p._id === apt.patient._id)) {
              acc.push(apt.patient);
            }
            return acc;
          }, []);
          setPatients(uniquePatients);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Error fetching appointments');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAppointments();
    } else {
      setError('Please log in to view appointments');
    }
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
    const fetchSchedule = async () => {
      if (!token || !doctorId) {
        console.log('Missing token or doctorId:', { token: !!token, doctorId });
        return;
      }
      
      setScheduleLoading(true);
      try {
        // Ensure doctorId is a valid MongoDB ObjectId
        if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
          console.error('Invalid doctor ID format:', doctorId);
          setError('Invalid doctor ID');
          return;
        }

        console.log('Fetching schedule for doctor:', doctorId);
        const response = await axios.get(
          `http://localhost:3000/api/schedules/doctor/${doctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Schedule response:', response.data);
        if (response.data) {
          setSchedule(response.data);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          doctorId,
          token: token ? 'Present' : 'Missing'
        });
        if (error.response?.status === 404) {
          // If schedule not found, use default schedule
          console.log('Creating default schedule');
          setSchedule({
            workingDays: [
              { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
              { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
              { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
              { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
              { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
              { day: 'saturday', isWorking: false },
              { day: 'sunday', isWorking: false }
            ],
            appointmentDuration: 15,
            maxAppointmentsPerDay: 20
          });
        } else {
          setError(error.response?.data?.error || 'Error loading schedule. Please try again later.');
        }
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [token, doctorId]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/prescriptions/doctor/${doctorId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPrescriptions(data);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      }
    };

    if (doctorId) {
      fetchPrescriptions();
    }
  }, [doctorId]);

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
        // Get doctor ID from token if not in localStorage
        let currentDoctorId = doctorId;
        if (!currentDoctorId && token) {
          try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            currentDoctorId = tokenData.id;
          } catch (error) {
            console.error('Error decoding token:', error);
            setError('Error getting doctor information');
            return;
          }
        }

        if (!currentDoctorId) {
          setError('Doctor ID not found');
          return;
        }

        // Fetch appointments to get associated patients
        const appointmentsResponse = await axios.get(`http://localhost:3000/api/appointments/user/${currentDoctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Extract unique patients from appointments
        const uniquePatients = appointmentsResponse.data.reduce((acc, apt) => {
          if (apt.patient && !acc.find(p => p._id === apt.patient._id)) {
            acc.push(apt.patient);
          }
          return acc;
        }, []);
        setPatients(uniquePatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Error fetching patients');
      }
    };

    if (token) {
      fetchPatients();
    }
  }, [token, doctorId]);

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
        handleViewAppointmentDetails(response.data);
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
        // Optionally redirect to login
      } else if (error.response?.status === 403) {
        setError('You do not have permission to start this consultation');
      } else {
        setError(error.response?.data?.details || error.message || 'Error starting consultation');
      }
    }
  };

  const handleCompleteConsultation = async (appointmentId) => {
    try {
      if (!appointmentForm.diagnosis || !appointmentForm.prescription) {
        setError('Please provide diagnosis and prescription before completing consultation');
        return;
      }

      const response = await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { ...appointmentForm, status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, ...appointmentForm, status: 'completed' } 
            : apt
        ));
        setSuccess('Consultation completed successfully');
        setShowAppointmentDetails(false);
        setAppointmentForm({ diagnosis: '', prescription: '', notes: '' });
      } else {
        setError('Failed to complete consultation');
      }
    } catch (error) {
      setError('Error completing consultation');
      console.error('Error:', error);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (!apt.date) return false;
    
    const appointmentDate = new Date(apt.date).toISOString().split('T')[0];
    const isDateMatch = appointmentDate === selectedDate;
    const isCompleted = apt.status === 'completed';
    
    if (activeTab === 'upcoming') {
      return isDateMatch && !isCompleted;
    } else {
      return isCompleted;
    }
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

  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      diagnosis: appointment.diagnosis || '',
      prescription: appointment.prescription || '',
      notes: appointment.notes || ''
    });
    setShowAppointmentDetails(true);
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
    const response = await fetch('http://localhost:8000/generate-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleScheduleUpdate = async () => {
    try {
      console.log('Updating schedule for doctor:', doctorId);
      console.log('Schedule data:', schedule);
      
      const response = await axios.patch(
        `http://localhost:3000/api/schedules/doctor/${doctorId}`,
        schedule,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedule(response.data);
      setSuccess('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      console.error('Error response:', error.response?.data);
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

  const handleUpdateLabTestResults = async (testId, results, reportFile) => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/lab-tests/${testId}/results`,
        { results, reportFile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLabTests(labTests.map(test => 
        test._id === testId ? response.data : test
      ));
      toast.success('Lab test results updated successfully');
    } catch (error) {
      console.error('Error updating lab test results:', error);
      toast.error('Failed to update lab test results');
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

      // Fetch patient's appointments where the current doctor is assigned
      const appointmentsResponse = await axios.get(
        `http://localhost:3000/api/appointments/doctor/${doctorId}`, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Filter appointments for this specific patient
      const patientAppointments = appointmentsResponse.data.filter(apt => 
        apt.patient._id === patientId
      );

      // Fetch prescriptions where the current doctor is assigned
      const prescriptionsResponse = await axios.get(
        `http://localhost:3000/api/prescriptions/doctor/${doctorId}`, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Filter prescriptions for this specific patient
      const patientPrescriptions = prescriptionsResponse.data.filter(pres => 
        pres.patient._id === patientId
      );

      // Fetch lab tests where the current doctor is assigned
      const labTestsResponse = await axios.get(
        `http://localhost:3000/api/lab-tests/doctor/${doctorId}`, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Filter lab tests for this specific patient
      const patientLabTests = labTestsResponse.data.filter(test => 
        test.patient._id === patientId
      );

      // Combine all history with proper error handling
      const history = [
        ...(patientAppointments || []).map(apt => ({
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
        ...(patientPrescriptions || []).map(pres => ({
          type: 'prescription',
          date: pres.date,
          title: `Prescription`,
          details: {
            diagnosis: pres.diagnosis,
            medications: pres.medications || []
          }
        })),
        ...(patientLabTests || []).map(test => ({
          type: 'labTest',
          date: test.requestedDate,
          title: `Lab Test: ${test.testType}`,
          details: {
            testName: test.testName,
            status: test.status,
            results: test.results
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
        // Optionally redirect to login
      } else if (error.response?.status === 404) {
        setError('Patient history not found');
      } else {
        setError(error.response?.data?.error || 'Error fetching patient history');
      }
    } finally {
      setLoading(false);
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
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              selected ? 'bg-[var(--accent)] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }>
            <FaEnvelope className="w-5 h-5" />
            <span className="font-medium">Leave</span>
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
                {scheduleLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={schedule.appointmentDuration}
                        onChange={(e) => setSchedule(prev => ({ ...prev, appointmentDuration: parseInt(e.target.value) }))}
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
                )}
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
                      onClick={() => setSelectedPrescription(prescription)}
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

          {/* Leave Applications Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Leave Applications</h3>
                <div className="space-y-4">
                  {leaveApplications.map(leave => (
                    <div key={leave.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800">Leave Period</h4>
                          <p className="text-gray-600">{leave.startDate} to {leave.endDate}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{leave.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Apply for Leave</h3>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <textarea 
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 h-32 resize-none"
                      placeholder="Enter reason for leave"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm"
                  >
                    Submit Application
                  </button>
                </form>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default DoctorDashboard;
