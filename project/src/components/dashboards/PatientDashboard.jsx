import { Tab } from '@headlessui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaBook,
  FaCalendar,
  FaCalendarAlt,
  FaCalendarCheck,
  FaCalendarPlus,
  FaCheckCircle,
  FaClock,
  FaComments,
  FaCreditCard,
  FaExclamationCircle,
  FaFileInvoiceDollar,
  FaFileMedical,
  FaFlask,
  FaNotesMedical,
  FaPrescription,
  FaPrint,
  FaRegClock,
  FaSearch,
  FaTimes,
  FaTimesCircle,
  FaUserMd
} from 'react-icons/fa';
import PatientPrescriptions from '../prescriptions/PatientPrescriptions';
import PrescriptionView from '../prescriptions/PrescriptionView';

function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    symptoms: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [reschedulingDetails, setReschedulingDetails] = useState({
    date: '',
    time: ''
  });
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordFilter, setRecordFilter] = useState('all'); // all, appointments, prescriptions, labTests
  const [searchTerm, setSearchTerm] = useState('');
  const [labTests, setLabTests] = useState([]);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [labTestFilter, setLabTestFilter] = useState('all'); // all, pending, completed
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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

  const [healthMetrics] = useState([
    {
      id: 1,
      date: "2024-03-15",
      type: "Blood Pressure",
      value: "120/80"
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (token && userId) {
        try {
          setLoading(true);
          setError('');

          // Fetch appointments for the current user
          const appointmentsResponse = await axios.get(`http://localhost:3000/api/appointments/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Sort appointments by date and time
          const sortedAppointments = appointmentsResponse.data.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
              return a.time.localeCompare(b.time);
            }
            return dateA - dateB;
          });
          setAppointments(sortedAppointments);

          // Fetch doctors
          const doctorsResponse = await axios.get('http://localhost:3000/api/users/doctors', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const doctorsList = doctorsResponse.data.filter(user => user.role === 'doctor' && user.isActive);
          setDoctors(doctorsList);

          // Fetch bills
          const billsResponse = await axios.get(`http://localhost:3000/api/billing/patient/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBills(billsResponse.data);

        } catch (error) {
          console.error('Error fetching data:', error);
          if (error.response?.status === 403) {
            setError('Access denied. Please make sure you are logged in with the correct account.');
          } else if (error.response?.status === 401) {
            setError('Please log in to access the dashboard');
          } else {
            setError(error.response?.data?.error || 'Error fetching data');
          }
        } finally {
          setLoading(false);
        }
      } else {
        console.error('Missing token or userId');
        setError('Please log in to access the dashboard');
      }
    };

    fetchData();
  }, [token, userId]);

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

        if (response.ok) {
          const data = await response.json();
          setPrescriptions(data);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to fetch prescriptions');
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        toast.error('Failed to fetch prescriptions');
      }
    };

    fetchPrescriptions();
  }, [token, userId]);

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!token || !userId) return;

      try {
        // Fetch appointments
        const appointmentsResponse = await axios.get(`http://localhost:3000/api/appointments/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch prescriptions
        const prescriptionsResponse = await axios.get(`http://localhost:3000/api/prescriptions/patient/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Initialize lab tests array
        let labTestsData = [];

        // Try to fetch lab tests if the endpoint exists
        try {
          const labTestsResponse = await axios.get(`http://localhost:3000/api/lab-tests/patient/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          labTestsData = labTestsResponse.data;
        } catch (labError) {
          console.log('Lab tests endpoint not available:', labError.message);
          // Continue without lab tests data
        }

        // Combine all records
        const allRecords = [
          ...appointmentsResponse.data.map(apt => ({
            ...apt,
            type: 'appointment',
            date: apt.date,
            title: `Appointment with ${apt.doctor?.name || 'Doctor'}`,
            description: apt.symptoms || 'No symptoms provided',
            status: apt.status
          })),
          ...prescriptionsResponse.data.map(pres => ({
            ...pres,
            type: 'prescription',
            date: pres.date,
            title: `Prescription from ${pres.doctor?.name || 'Doctor'}`,
            description: pres.diagnosis || 'No diagnosis provided',
            status: pres.status
          })),
          ...labTestsData.map(test => ({
            ...test,
            type: 'labTest',
            date: test.date,
            title: `Lab Test: ${test.testType}`,
            description: test.notes || 'No notes provided',
            status: test.status
          }))
        ];

        // Sort by date
        allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMedicalRecords(allRecords);
      } catch (error) {
        console.error('Error fetching medical records:', error);
        toast.error('Failed to fetch medical records');
      }
    };

    fetchMedicalRecords();
  }, [token, userId]);

  useEffect(() => {
    const fetchLabTests = async () => {
      if (!token || !userId) return;

      try {
        const response = await axios.get(`http://localhost:3000/api/lab-tests/patient/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLabTests(response.data);
      } catch (error) {
        console.error('Error fetching lab tests:', error);
        toast.error('Failed to fetch lab tests');
      }
    };

    fetchLabTests();
  }, [token, userId]);

  const handleDoctorSelect = async (doctorId) => {
    console.log('Selected doctor ID:', doctorId);
    const doctor = doctors.find(d => d._id === doctorId);
    console.log('Found doctor:', doctor);
    setSelectedDoctor(doctor);
    setNewAppointment(prev => ({ ...prev, doctorId }));
    setAvailableSlots([]);
  };

  const handleDateSelect = async (date) => {
    setNewAppointment(prev => ({ ...prev, date }));
    if (!newAppointment.doctorId) {
      setError('Please select a doctor first');
      return;
    }

    setLoadingSlots(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/appointments/available-slots/${newAppointment.doctorId}/${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setAvailableSlots(response.data.availableSlots);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Error fetching available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate token
    if (!token) {
      setError('Please log in to book an appointment');
      return;
    }

    try {
      // Validate token expiration
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const tokenExpiration = tokenPayload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= tokenExpiration) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      // Validate required fields
      if (!newAppointment.doctorId || !newAppointment.date || !newAppointment.time) {
        setError('Please fill in all required fields');
        return;
      }

      // Check if the selected slot is still available
      const selectedSlot = availableSlots.find(slot => slot.time === newAppointment.time);
      if (!selectedSlot || !selectedSlot.isAvailable) {
        setError('The selected time slot is no longer available. Please select another time.');
        return;
      }

      try {
        // Check for existing appointments at the same time
        const existingAppointment = appointments.find(
          app => app.date === newAppointment.date && 
          app.time === newAppointment.time &&
          app.status !== 'cancelled'
        );

        if (existingAppointment) {
          setError('You already have an appointment scheduled for this time');
          return;
        }

        // Get the selected doctor's details
        const doctor = doctors.find(d => d._id === newAppointment.doctorId);
        if (!doctor) {
          setError('Selected doctor not found');
          return;
        }

        // Format the appointment data
        const appointmentData = {
          doctorId: newAppointment.doctorId,
          patientId: userId,
          date: newAppointment.date,
          time: newAppointment.time,
          type: newAppointment.type || 'consultation',
          symptoms: newAppointment.symptoms || '',
          status: 'scheduled',
          department: doctor.department || 'General',
          doctorName: `${doctor.firstName} ${doctor.lastName}`
        };

        console.log('Sending appointment data:', appointmentData);

        // Create the appointment
        const response = await axios.post(
          'http://localhost:3000/api/appointments',
          appointmentData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        // Update the appointments list
        setAppointments(prev => [...prev, response.data]);
        setSuccess('Appointment booked successfully!');
        // Reset the form
        setNewAppointment({
          doctorId: '',
          date: '',
          time: '',
          type: 'consultation',
          symptoms: ''
        });
        setAvailableSlots([]);
      } catch (error) {
        console.error('Appointment creation error:', error.response?.data || error);
        if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (error.response?.data?.error) {
          setError(error.response.data.error);
        } else {
          setError(error.message || 'Error booking appointment');
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setError('Error validating session. Please try again.');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      // Check if appointment is already completed
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (appointment.status === 'completed') {
        throw new Error('Cannot cancel a completed appointment');
      }

      const response = await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setAppointments(appointments.map(apt => 
        apt._id === appointmentId ? { ...apt, status: 'cancelled' } : apt
      ));
      setSuccess('Appointment cancelled successfully');
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Error cancelling appointment');
    }
  };

  const handleRescheduleAppointment = async (appointmentId) => {
    try {
      // Check if appointment is already completed
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (appointment.status === 'completed') {
        throw new Error('Cannot reschedule a completed appointment');
      }

      if (!reschedulingDetails.date || !reschedulingDetails.time) {
        setError('Please select both date and time for rescheduling');
        return;
      }

      // Validate new date is not in the past
      const newDate = new Date(reschedulingDetails.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        setError('New appointment date cannot be in the past');
        return;
      }

      // Check doctor's availability for the new date and time
      const availabilityResponse = await axios.get(
        `http://localhost:3000/api/appointments/available-slots/${appointment.doctor._id}/${reschedulingDetails.date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const availableSlots = availabilityResponse.data.availableSlots;
      const isSlotAvailable = availableSlots.some(slot => slot.time === reschedulingDetails.time && slot.isAvailable);

      if (!isSlotAvailable) {
        throw new Error('This time slot is not available. Please select a different time.');
      }

      const response = await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}/reschedule`,
        { 
          date: reschedulingDetails.date, 
          time: reschedulingDetails.time 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Update local state with the new appointment details
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId 
          ? { 
              ...apt, 
              date: reschedulingDetails.date, 
              time: reschedulingDetails.time,
              status: 'scheduled'
            } 
          : apt
      ));

      setSuccess('Appointment rescheduled successfully');
      setReschedulingAppointment(null);
      setReschedulingDetails({ date: '', time: '' });
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Error rescheduling appointment');
    }
  };

  const startRescheduling = (appointment) => {
    setReschedulingAppointment(appointment);
    setReschedulingDetails({
      date: new Date(appointment.date).toISOString().split('T')[0],
      time: appointment.time
    });
  };

  const handlePayment = async (billId) => {
    try {
      setPaymentLoading(true);
      setError('');
      setSuccess('');

      if (!paymentMethod) {
        setError('Please select a payment method');
        return;
      }

      console.log('Processing payment:', {
        billId,
        paymentMethod,
        status: 'paid'
      });

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to make a payment');
        return;
      }

      // Get the user ID from the token
      const userId = getUserIdFromToken(token);
      if (!userId) {
        setError('Invalid user session');
        return;
      }

      const response = await axios.patch(
        `http://localhost:3000/api/billing/${billId}/status`,
        { 
          status: 'paid',
          paymentMethod: paymentMethod
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Payment response:', response.data);

      // Update local state with the populated bill data from response
      setBills(bills.map(bill => 
        bill._id === billId 
          ? response.data
          : bill
      ));

      setSuccess('Payment successful!');
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentMethod('');
    } catch (error) {
      console.error('Payment error:', error.response?.data || error);
      setError(error.response?.data?.error || 'Error processing payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePrintInvoice = (bill) => {
    console.log('\n=== Print Invoice Data ===');
    console.log('Bill ID:', bill._id);
    console.log('Patient Data:', {
      id: bill.patient?._id,
      name: bill.patient?.name,
      email: bill.patient?.email,
      phone: bill.patient?.phone
    });
    console.log('Appointment Data:', {
      id: bill.appointment?._id,
      date: bill.appointment?.date,
      time: bill.appointment?.time,
      doctor: bill.appointment?.doctor
    });
    console.log('Items:', bill.items);
    console.log('Amount:', bill.amount);
    console.log('Status:', bill.status);
    console.log('=== End Print Invoice Data ===\n');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${bill._id.slice(-6)}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8f9fa;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .header h1 {
              color: #2c3e50;
              margin: 0;
              font-size: 24px;
            }
            .invoice-number {
              color: #7f8c8d;
              font-size: 14px;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              color: #2c3e50;
              font-size: 18px;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 150px 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .info-label {
              color: #7f8c8d;
              font-weight: 500;
            }
            .info-value {
              color: #2c3e50;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .items-table th, .items-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            .items-table th {
              background: #f8f9fa;
              color: #2c3e50;
              font-weight: 500;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
            }
            .total-amount {
              font-size: 24px;
              color: #2c3e50;
              font-weight: bold;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 12px;
              font-weight: 500;
            }
            .status-paid {
              background: #e8f5e9;
              color: #2e7d32;
            }
            .status-pending {
              background: #fff3e0;
              color: #ef6c00;
            }
            .status-cancelled {
              background: #ffebee;
              color: #c62828;
            }
            @media print {
              body {
                background: white;
              }
              .invoice-container {
                box-shadow: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>Medical Invoice</h1>
              <div class="invoice-number">Invoice #${bill._id.slice(-6)}</div>
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div class="info-label">Name</div>
                <div class="info-value">${bill.patient?.name || 'N/A'}</div>
                <div class="info-label">Email</div>
                <div class="info-value">${bill.patient?.email || 'N/A'}</div>
                <div class="info-label">Phone</div>
                <div class="info-value">${bill.patient?.phone || 'N/A'}</div>
                <div class="info-label">Appointment Date</div>
                <div class="info-value">${bill.appointment?.date ? new Date(bill.appointment.date).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Bill Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${bill.items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.price.toFixed(2)}</td>
                      <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Payment Information</div>
              <div class="info-grid">
                <div class="info-label">Total Amount</div>
                <div class="info-value total-amount">₹${bill.amount.toFixed(2)}</div>
                <div class="info-label">Payment Method</div>
                <div class="info-value">${bill.paymentMethod || 'N/A'}</div>
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${bill.status.toLowerCase()}">
                    ${bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </span>
                </div>
                <div class="info-label">Date</div>
                <div class="info-value">${new Date(bill.createdAt).toLocaleDateString()}</div>
                ${bill.paymentDate ? `
                  <div class="info-label">Payment Date</div>
                  <div class="info-value">${new Date(bill.paymentDate).toLocaleDateString()}</div>
                ` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handlePrintRecord = (record) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical Record - ${record.title}</title>
          <style>
            @media print {
              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
              }
              .print-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: none;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eee;
              }
              .header h1 {
                color: #2c3e50;
                margin: 0;
                font-size: 24px;
              }
              .record-date {
                color: #7f8c8d;
                font-size: 14px;
                margin-top: 5px;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                color: #2c3e50;
                font-size: 18px;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 1px solid #eee;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 10px;
                margin-bottom: 10px;
              }
              .info-label {
                color: #7f8c8d;
                font-weight: 500;
              }
              .info-value {
                color: #2c3e50;
              }
              .status-badge {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: 500;
              }
              .status-completed {
                background: #e8f5e9;
                color: #2e7d32;
              }
              .status-in-progress {
                background: #fff3e0;
                color: #ef6c00;
              }
              .status-cancelled {
                background: #ffebee;
                color: #c62828;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>Medical Record</h1>
              <div class="record-date">
                ${new Date(record.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Record Information</div>
              <div class="info-grid">
                <div class="info-label">Type</div>
                <div class="info-value capitalize">${record.type}</div>
                <div class="info-label">Title</div>
                <div class="info-value">${record.title}</div>
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${record.status.toLowerCase()}">
                    ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Details</div>
              <p class="info-value">${record.description}</p>
            </div>

            ${record.type === 'appointment' ? `
              <div class="section">
                <div class="section-title">Appointment Details</div>
                <div class="info-grid">
                  <div class="info-label">Doctor</div>
                  <div class="info-value">${record.doctor?.name || 'Not specified'}</div>
                  <div class="info-label">Department</div>
                  <div class="info-value">${record.department || 'Not specified'}</div>
                  <div class="info-label">Type</div>
                  <div class="info-value capitalize">${record.type}</div>
                  ${record.symptoms ? `
                    <div class="info-label">Symptoms</div>
                    <div class="info-value">${record.symptoms}</div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            ${record.notes ? `
              <div class="section">
                <div class="section-title">Notes</div>
                <p class="info-value">${record.notes}</p>
              </div>
            ` : ''}

            ${record.results ? `
              <div class="section">
                <div class="section-title">Results</div>
                <p class="info-value">${record.results}</p>
              </div>
            ` : ''}

            <div class="section no-print">
              <button onclick="window.print()" class="print-button">Print Record</button>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredRecords = medicalRecords.filter(record => {
    const matchesFilter = recordFilter === 'all' || record.type === recordFilter;
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredLabTests = labTests.filter(test => {
    if (labTestFilter === 'all') return true;
    return test.status === labTestFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4DC6B6]/10 to-[#4DC6B6]/5 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Patient Dashboard</h2>
      
      <Tab.Group>
          <Tab.List className="flex space-x-4 bg-white p-2 rounded-xl shadow-sm overflow-x-auto">
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaCalendar className="text-lg" />
            <span>Appointments</span>
          </Tab>
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaFileMedical className="text-lg" />
            <span>Medical Records</span>
          </Tab>
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaPrescription className="text-lg" />
            <span>Prescriptions</span>
          </Tab>
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaFlask className="text-lg" />
            <span>Lab Tests</span>
          </Tab>
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaFileInvoiceDollar className="text-lg" />
            <span>Billing</span>
          </Tab>
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaComments className="text-lg" />
            <span>Feedback</span>
          </Tab>
          <Tab className={({ selected }) =>
              `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                selected 
                  ? 'bg-[#4DC6B6] text-white shadow-md' 
                  : 'text-gray-600 hover:text-[#4DC6B6] hover:bg-[#4DC6B6]/5'
              }`
            }>
              <FaBook className="text-lg" />
            <span>Resources</span>
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Appointments Panel */}
          <Tab.Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#4DC6B6]/10 rounded-lg">
                      <FaCalendarPlus className="text-2xl text-[#4DC6B6]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Book Appointment</h3>
                </div>
                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      <FaExclamationCircle className="text-red-500" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                      <FaCheckCircle className="text-green-500" />
                    <span>{success}</span>
                  </div>
                )}
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 mb-2">
                        <FaUserMd className="text-[#4DC6B6]" />
                        <span>Doctor</span>
                    </label>
                    <select 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent transition-all duration-200"
                      value={newAppointment.doctorId}
                      onChange={(e) => handleDoctorSelect(e.target.value)}
                      required
                    >
                      <option value="">Select a doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            {doctor.name} - {doctor.department}
                          </option>
                        ))}
                    </select>
                  </div>
                  {selectedDoctor && (
                      <div className="bg-[#4DC6B6]/10 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-[#4DC6B6] mb-3">
                          <FaUserMd className="inline-block mr-2" />
                        <span>Doctor Information</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                            <p className="font-medium text-gray-800">{selectedDoctor.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                            <p className="font-medium text-gray-800">{selectedDoctor.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Specialization</p>
                            <p className="font-medium text-gray-800">{selectedDoctor.specialization || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                            <p className="font-medium text-gray-800">{selectedDoctor.experience || 'Not specified'} years</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 mb-2">
                        <FaCalendarAlt className="text-[#4DC6B6]" />
                      <span>Date</span>
                    </label>
                    <input 
                      type="date" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent transition-all duration-200"
                      value={newAppointment.date}
                      onChange={(e) => handleDateSelect(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 mb-2">
                        <FaClock className="text-[#4DC6B6]" />
                      <span>Time</span>
                    </label>
                    {loadingSlots ? (
                      <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        <span className="text-gray-500">Loading available slots...</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        <span className="text-gray-500">Select a date to see available slots</span>
                      </div>
                    ) : (
                      <select 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent transition-all duration-200"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                        required
                      >
                        <option value="">Select time</option>
                        {availableSlots.map(slot => (
                          <option 
                            key={slot.time} 
                            value={slot.time}
                            disabled={!slot.isAvailable}
                            className={!slot.isAvailable ? 'text-gray-400' : ''}
                          >
                            {slot.time} {!slot.isAvailable && `(${slot.reason})`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 mb-2">
                        <FaNotesMedical className="text-[#4DC6B6]" />
                      <span>Symptoms</span>
                    </label>
                    <textarea 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent transition-all duration-200"
                      value={newAppointment.symptoms}
                      onChange={(e) => setNewAppointment({ ...newAppointment, symptoms: e.target.value })}
                      rows="3"
                        placeholder="Describe your symptoms..."
                      ></textarea>
                  </div>
                  <button 
                    type="submit" 
                      className="w-full bg-[#4DC6B6] text-white py-3 px-6 rounded-lg hover:bg-[#4DC6B6]/90 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                      Book Appointment
                  </button>
                </form>
              </div>

                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <FaCalendarCheck className="text-2xl text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h3>
                </div>
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-8">
                        <FaCalendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
                        <p className="mt-1 text-sm text-gray-500">Book your first appointment to get started.</p>
                    </div>
                  ) : (
                      appointments.map((apt) => (
                        <div
                          key={apt._id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                        >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800">{apt.doctor?.name || 'Doctor not assigned'}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  apt.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                  apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center gap-2">
                                  <FaNotesMedical className="text-[#4DC6B6]" />
                              <span>Department: {apt.department}</span>
                            </p>
                                <p className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-[#4DC6B6]" />
                              <span>Date: {new Date(apt.date).toLocaleDateString()}</span>
                            </p>
                                <p className="flex items-center gap-2">
                                  <FaRegClock className="text-[#4DC6B6]" />
                              <span>Time: {apt.time}</span>
                            </p>
                                <p className="flex items-center gap-2">
                                  <FaNotesMedical className="text-[#4DC6B6]" />
                              <span>Type: {apt.type}</span>
                            </p>
                            {apt.symptoms && (
                                  <p className="flex items-center gap-2">
                                    <FaFileMedical className="text-[#4DC6B6]" />
                                <span>Symptoms: {apt.symptoms}</span>
                              </p>
                            )}
                              </div>
                          </div>
                          <div className="flex gap-2">
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <>
                                <button 
                                  onClick={() => handleCancelAppointment(apt._id)}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  >
                                    <FaTimesCircle className="text-lg" />
                                </button>
                                <button 
                                  onClick={() => {
                                    startRescheduling(apt);
                                    setReschedulingDetails({ 
                                      date: new Date(apt.date).toISOString().split('T')[0], 
                                      time: apt.time 
                                    });
                                  }}
                                    className="p-2 text-[#4DC6B6] hover:text-[#4DC6B6]/80 hover:bg-[#4DC6B6]/5 rounded-lg transition-colors duration-200"
                                >
                                    <FaCalendarAlt className="text-lg" />
                                </button>
                                </>
                              )}
                              </div>
                            </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Medical Records Panel */}
          <Tab.Panel>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Medical Records</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search records..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent transition-all duration-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <select
                      className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent transition-all duration-200"
                    value={recordFilter}
                    onChange={(e) => setRecordFilter(e.target.value)}
                  >
                    <option value="all">All Records</option>
                    <option value="appointment">Appointments</option>
                    <option value="prescription">Prescriptions</option>
                    <option value="labTest">Lab Tests</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecords.map((record) => (
                  <div
                    key={`${record.type}-${record._id}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100 cursor-pointer group"
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowRecordModal(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                            {record.type === 'appointment' && (
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <FaCalendar className="text-blue-600 text-lg" />
                              </div>
                            )}
                            {record.type === 'prescription' && (
                              <div className="p-2 bg-green-50 rounded-lg">
                                <FaPrescription className="text-green-600 text-lg" />
                              </div>
                            )}
                            {record.type === 'labTest' && (
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <FaFlask className="text-purple-600 text-lg" />
                              </div>
                            )}
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                              {record.title}
                            </h3>
                          </div>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'completed' ? 'bg-green-100 text-green-800' :
                        record.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        record.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{record.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 capitalize">{record.type}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintRecord(record);
                        }}
                          className="px-4 py-2 bg-[#4DC6B6] text-white rounded-lg hover:bg-[#4DC6B6]/90 transition-colors duration-200 flex items-center gap-2"
                      >
                          <FaPrint />
                          Print Record
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FaFileMedical className="text-2xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No medical records found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Your medical records will appear here once they are added to your profile.
                  </p>
            </div>
              )}
            </div>

            {/* Record Details Modal */}
            {showRecordModal && selectedRecord && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedRecord.title}</h2>
                        <p className="text-gray-600">
                          {new Date(selectedRecord.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowRecordModal(false);
                          setSelectedRecord(null);
                        }}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <FaTimes size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {selectedRecord.type === 'appointment' && (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Doctor</h3>
                                <p className="text-gray-800">{selectedRecord.doctor?.name || 'Not specified'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Department</h3>
                                <p className="text-gray-800">{selectedRecord.department || 'Not specified'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Type</h3>
                                <p className="text-gray-800 capitalize">{selectedRecord.type}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                selectedRecord.status === 'completed' ? 'bg-green-100 text-green-800' :
                                selectedRecord.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                selectedRecord.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                                </span>
                            </div>
                          </div>
                            {selectedRecord.notes && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{selectedRecord.notes}</p>
                            </div>
                          )}
                            {selectedRecord.results && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Results</h3>
                                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{selectedRecord.results}</p>
                            </div>
                          )}
                        </>
                      )}
                      </div>

                      <div className="mt-8 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowRecordModal(false);
                            setSelectedRecord(null);
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="px-4 py-2 bg-[#4DC6B6] text-white rounded-lg hover:bg-[#4DC6B6]/90 transition-colors duration-200 flex items-center gap-2"
                        >
                          <FaPrint />
                          Print Record
                        </button>
                            </div>
                            </div>
                          </div>
                            </div>
                          )}
            </Tab.Panel>

            {/* Prescriptions Panel */}
            <Tab.Panel>
              <PatientPrescriptions />
            </Tab.Panel>

            {/* Lab Tests Panel */}
            <Tab.Panel>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Lab Test Reports</h2>
                  <div className="flex items-center space-x-4">
                    <select
                      className="input"
                      value={labTestFilter}
                      onChange={(e) => setLabTestFilter(e.target.value)}
                    >
                      <option value="all">All Tests</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLabTests.map((test) => (
                    <div
                      key={test._id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedLabTest(test);
                        setShowLabTestModal(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                            <div>
                          <h3 className="text-lg font-semibold text-gray-800">{test.testName}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(test.requestedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          test.status === 'completed' ? 'bg-green-100 text-green-800' :
                          test.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{test.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaFlask className="text-purple-500" />
                          <span className="text-sm text-gray-500">{test.testType}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLabTest(test);
                            setShowLabTestModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </div>
                                  </div>
                                ))}
                              </div>

                {filteredLabTests.length === 0 && (
                  <div className="text-center py-12">
                    <FaFlask className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No lab tests found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your lab test reports will appear here.
                    </p>
                            </div>
                          )}
              </div>

              {/* Lab Test Details Modal */}
              {showLabTestModal && selectedLabTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{selectedLabTest.testName}</h2>
                          <p className="text-gray-600">
                            {new Date(selectedLabTest.requestedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowLabTestModal(false);
                            setSelectedLabTest(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes size={24} />
                        </button>
                      </div>

                      <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Test Type</h3>
                            <p className="mt-1">{selectedLabTest.testType}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Status</h3>
                              <p className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${
                              selectedLabTest.status === 'completed' ? 'bg-green-100 text-green-800' :
                              selectedLabTest.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedLabTest.status.charAt(0).toUpperCase() + selectedLabTest.status.slice(1)}
                              </p>
                            </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Doctor</h3>
                            <p className="mt-1">{selectedLabTest.doctor?.name || 'Not specified'}</p>
                          </div>
                            <div>
                            <h3 className="text-sm font-medium text-gray-500">Scheduled Date</h3>
                            <p className="mt-1">
                              {new Date(selectedLabTest.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {selectedLabTest.description && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Description</h3>
                            <p className="mt-1">{selectedLabTest.description}</p>
                            </div>
                          )}

                        {selectedLabTest.results && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Results</h3>
                            <p className="mt-1 whitespace-pre-wrap">{selectedLabTest.results}</p>
                            </div>
                          )}

                        {selectedLabTest.reportFile && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Report File</h3>
                            <a
                              href={`http://localhost:3000${selectedLabTest.reportFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline mt-2"
                            >
                              View Report
                            </a>
                          </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                            setShowLabTestModal(false);
                            setSelectedLabTest(null);
                        }}
                        className="btn btn-outline"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          window.print();
                        }}
                          className="btn bg-[#4DC6B6] text-white hover:bg-[#4DC6B6]/90"
                      >
                        <FaPrint className="mr-2" />
                          Print Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Tab.Panel>

          {/* Billing Panel */}
          <Tab.Panel>
            <div className="card shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FaFileInvoiceDollar className="text-2xl text-[#4DC6B6]" />
                  <h3 className="text-xl font-semibold">Billing History</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <FaCheckCircle className="inline-block mr-1" />
                    Paid: {bills.filter(bill => bill.status === 'paid').length}
                  </div>
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    <FaClock className="inline-block mr-1" />
                    Pending: {bills.filter(bill => bill.status === 'pending').length}
                  </div>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <FaExclamationCircle />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  <FaCheckCircle />
                  <span>{success}</span>
                </div>
              )}
              <div className="space-y-4">
                {bills.length === 0 ? (
                  <div className="text-center py-12">
                    <FaFileInvoiceDollar className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No bills found</p>
                    <p className="text-gray-400 text-sm mt-2">Your billing history will appear here</p>
                  </div>
                ) : (
                  bills.map(bill => (
                    <div key={bill._id} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-semibold text-gray-800">Bill #{bill._id.slice(-6)}</p>
                              <p className="text-sm text-gray-500">
                                  <FaCalendarAlt className="inline-block mr-2 text-[#4DC6B6]" />
                                {new Date(bill.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                              bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                                <p className="text-xl font-bold text-[#4DC6B6]">₹{bill.amount.toFixed(2)}</p>
                            </div>
                            {bill.paymentMethod && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                                <p className="font-medium text-gray-800">{bill.paymentMethod}</p>
                              </div>
                            )}
                          </div>

                          {bill.items && bill.items.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-3">Bill Items</p>
                              <div className="space-y-2">
                                {bill.items.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">{item.name} x {item.quantity}</span>
                                    <span className="font-medium">₹{(item.quantity * item.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {bill.status === 'pending' && (
                            <button 
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPaymentModal(true);
                              }}
                                className="btn bg-[#4DC6B6] text-white hover:bg-[#4DC6B6]/90 w-full flex items-center justify-center gap-2"
                            >
                              <FaCreditCard />
                              <span>Pay Now</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handlePrintInvoice(bill)}
                            className="btn btn-secondary flex items-center gap-2 hover:bg-opacity-90 transition-all duration-200"
                          >
                            <FaPrint />
                            <span>Print</span>
                          </button>
                          <button 
                            onClick={() => setSelectedInvoice(bill)}
                            className="btn btn-primary flex items-center gap-2 hover:bg-opacity-90 transition-all duration-200"
                          >
                            <FaFileInvoiceDollar />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Tab.Panel>

          {/* Invoice Details Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-2xl font-semibold text-[#4DC6B6]">Invoice Details</h3>
                    <p className="text-gray-500">Bill #{selectedInvoice._id.slice(-6)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-gray-700">Patient Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Name</span>
                          <span className="font-medium">
                            {selectedInvoice.patient?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Email</span>
                          <span className="font-medium">
                            {selectedInvoice.patient?.email || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Phone</span>
                          <span className="font-medium">
                            {selectedInvoice.patient?.phone || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Appointment Date</span>
                          <span className="font-medium">
                            {selectedInvoice.appointment?.date 
                              ? new Date(selectedInvoice.appointment.date).toLocaleDateString() 
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-gray-700">Bill Items</h4>
                      <div className="space-y-3">
                        {selectedInvoice.items.map((item, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{item.name}</span>
                                <span className="text-[#4DC6B6]">₹{item.price.toFixed(2)} per unit</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Quantity: {item.quantity}</span>
                              <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-gray-700">Payment Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Amount</span>
                            <span className="text-2xl font-bold text-[#4DC6B6]">
                            ₹{selectedInvoice.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Method</span>
                          <span className="font-medium">{selectedInvoice.paymentMethod || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status</span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            selectedInvoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Date</span>
                          <span className="font-medium">
                            {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedInvoice.paymentDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Payment Date</span>
                            <span className="font-medium">
                              {new Date(selectedInvoice.paymentDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePrintInvoice(selectedInvoice)}
                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <FaPrint />
                        <span>Print Invoice</span>
                      </button>
                      {selectedInvoice.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(null);
                            setSelectedBill(selectedInvoice);
                          }}
                          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <FaCreditCard />
                          <span>Pay Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Panel */}
          <Tab.Panel>
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Provide Feedback</h3>
              <form className="space-y-4">
                <div>
                  <label className="block mb-2">Service Rating</label>
                  <select className="input w-full">
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Average</option>
                    <option>Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Comments</label>
                  <textarea className="input w-full h-24" placeholder="Share your experience"></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-full">Submit Feedback</button>
              </form>
            </div>
          </Tab.Panel>

          {/* Resources Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Health Articles</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-[#4DC6B6] rounded-lg cursor-pointer">
                    <p className="font-semibold">Healthy Living Tips</p>
                    <p className="text-sm">Learn about maintaining a healthy lifestyle</p>
                  </div>
                    <div className="p-4 bg-[#4DC6B6] rounded-lg cursor-pointer">
                    <p className="font-semibold">Nutrition Guide</p>
                    <p className="text-sm">Essential nutrients for your body</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Video Resources</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-[#4DC6B6] rounded-lg cursor-pointer">
                    <p className="font-semibold">Exercise Tutorials</p>
                    <p className="text-sm">Simple exercises you can do at home</p>
                  </div>
                    <div className="p-4 bg-[#4DC6B6] rounded-lg cursor-pointer">
                    <p className="font-semibold">Meditation Guide</p>
                    <p className="text-sm">Learn stress management techniques</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">FAQs</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-[#4DC6B6] rounded-lg cursor-pointer">
                    <p className="font-semibold">Common Health Questions</p>
                    <p className="text-sm">Answers to frequently asked questions</p>
                  </div>
                    <div className="p-4 bg-[#4DC6B6] rounded-lg cursor-pointer">
                    <p className="font-semibold">Hospital Services</p>
                    <p className="text-sm">Learn about our available services</p>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Add spacing after the panels */}
      <div className="h-8"></div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#4DC6B6]">Payment</h3>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                  setPaymentMethod('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-2">Bill Amount</p>
                  <p className="text-2xl font-bold text-[#4DC6B6]">₹{selectedBill.amount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Select Payment Method</label>
                <select
                    className="input w-full focus:ring-2 focus:ring-[#4DC6B6] transition-all duration-200"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <FaExclamationCircle />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => handlePayment(selectedBill._id)}
                  className="btn bg-[#4DC6B6] text-white hover:bg-[#4DC6B6]/90 w-full flex items-center justify-center gap-2"
                disabled={paymentLoading || !paymentMethod}
              >
                {paymentLoading ? (
                  <>
                    <FaCreditCard className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaCreditCard />
                    <span>Pay Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
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

      {/* Rescheduling Modal */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reschedule Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={reschedulingDetails.date}
                  onChange={(e) => setReschedulingDetails(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={reschedulingDetails.time}
                  onChange={(e) => setReschedulingDetails(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DC6B6] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setReschedulingAppointment(null);
                  setReschedulingDetails({ date: '', time: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRescheduleAppointment(reschedulingAppointment._id)}
                className="px-4 py-2 bg-[#4DC6B6] text-white rounded-lg hover:bg-[#4DC6B6]/90"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;

