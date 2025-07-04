const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const staffRoutes = require('./routes/staff');
const appointmentsRouter = require('./routes/appointments');
const billingRoutes = require('./routes/billing');
const inventoryRoutes = require('./routes/inventory');
const dispatchRoutes = require('./routes/dispatch');
const schedulesRouter = require('./routes/schedules');
const prescriptionsRouter = require('./routes/prescriptions');
const labTestRoutes = require('./routes/labTests');
const reportsRoutes = require('./routes/reports');
const mongoose = require('mongoose');
const Appointment = require('./models/appointment');

// Load env vars from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? 'Present' : 'Missing'
  });
  console.log('=====================\n');
  next();
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Test route for schedules
app.get('/api/schedules/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Schedules route is working' });
});

// Diagnosis endpoint
app.put('/api/appointments/:id/diagnosis', async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis } = req.body;

    // Validate appointment ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }

    // Find and update the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update the diagnosis
    appointment.diagnosis = diagnosis;
    await appointment.save();

    // Return the updated appointment
    const updatedAppointment = await Appointment.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role');

    res.json({
      success: true,
      message: 'Diagnosis updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating diagnosis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update diagnosis',
      error: error.message
    });
  }
});

// Appointment status update endpoint
app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate appointment ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }

    // Find and update the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Validate status
    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the status
    appointment.status = status;
    await appointment.save();

    // Return the updated appointment
    const updatedAppointment = await Appointment.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role');

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/reports', reportsRoutes);

// Lab Test Routes with error handling
app.use('/api/lab-tests', (req, res, next) => {
  console.log('Lab Test Route:', req.method, req.originalUrl);
  next();
}, labTestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Handle 404 errors
app.use((req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  res.status(404).json({ error: 'Route not found' });
});

// Connect to database and start server
const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', process.env.PORT || 3000);
    
    await connectDB();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log('\n=== Server Started Successfully ===');
      console.log(`Server is running on port ${PORT}`);
      console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
      console.log('\nAvailable routes:');
      console.log('User Routes:');
      console.log('- POST /api/users/register');
      console.log('- POST /api/users/login');
      console.log('- GET /api/users');
      console.log('- PATCH /api/users/:id');
      console.log('- PATCH /api/users/:id/deactivate');
      console.log('- PATCH /api/users/:id/activate');
      console.log('- DELETE /api/users/:id');
      console.log('\nStaff Routes:');
      console.log('- GET /api/staff');
      console.log('- GET /api/staff/schedule');
      console.log('- PATCH /api/staff/schedule/:id');
      console.log('- GET /api/staff/department/:department');
      console.log('- GET /api/staff/stats');
      console.log('\nAppointments Routes:');
      console.log('- GET /api/appointments');
      console.log('- POST /api/appointments');
      console.log('- PATCH /api/appointments/:id');
      console.log('- DELETE /api/appointments/:id');
      console.log('\nSchedules Routes:');
      console.log('- GET /api/schedules/test');
      console.log('- GET /api/schedules/doctor/:doctorId');
      console.log('- PATCH /api/schedules/doctor/:doctorId');
      console.log('- GET /api/schedules/available/:doctorId/:date');
      console.log('\nBilling Routes:');
      console.log('- GET /api/billing');
      console.log('- GET /api/billing/patient/:patientId');
      console.log('- POST /api/billing');
      console.log('- PATCH /api/billing/:id/status');
      console.log('- PATCH /api/billing/:id');
      console.log('- DELETE /api/billing/:id');
      console.log('- GET /api/billing/stats');
      console.log('\nInventory Routes:');
      console.log('- GET /api/inventory');
      console.log('- POST /api/inventory');
      console.log('- PATCH /api/inventory/:id');
      console.log('- DELETE /api/inventory/:id');
      console.log('\nDispatch Routes:');
      console.log('- GET /api/dispatch');
      console.log('- POST /api/dispatch');
      console.log('- PATCH /api/dispatch/:id');
      console.log('- DELETE /api/dispatch/:id');
      console.log('\nPrescriptions Routes:');
      console.log('- GET /api/prescriptions');
      console.log('- POST /api/prescriptions');
      console.log('- PATCH /api/prescriptions/:id');
      console.log('- DELETE /api/prescriptions/:id');
      console.log('\nLab Test Routes:');
      console.log('- GET /api/lab-tests');
      console.log('- POST /api/lab-tests');
      console.log('- PATCH /api/lab-tests/:id');
      console.log('- DELETE /api/lab-tests/:id');
      console.log('\n===============================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't exit the process in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

startServer();