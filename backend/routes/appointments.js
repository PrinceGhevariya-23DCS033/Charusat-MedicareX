const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all appointments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});

// Get appointments for a specific user (patient or doctor)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the requesting user has permission
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const appointments = await Appointment.find({
      $or: [
        { patient: req.params.userId },
        { doctor: req.params.userId }
      ]
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});

// Get appointments for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const appointments = await Appointment.find({
      date: {
        $gte: date,
        $lt: nextDate
      }
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role')
      .sort({ time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});

// Create new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, department, notes, symptoms } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !date || !time || !type || !department) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if patient and doctor exist
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(doctorId)
    ]);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if doctor belongs to the specified department
    if (doctor.department !== department) {
      return res.status(400).json({ error: 'Doctor does not belong to the specified department' });
    }

    // Check for existing appointment at the same time
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: date,
      time: time,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'Doctor already has an appointment at this time' });
    }

    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      createdBy: req.user._id,
      date,
      time,
      type,
      department,
      notes,
      symptoms
    });

    await appointment.save();

    // Populate the appointment with creator information
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ error: 'Error creating appointment' });
  }
});

// Update appointment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    // Validate appointment ID
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      console.log('Invalid appointment ID format:', appointmentId);
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }

    console.log('Status update request:', {
      appointmentId,
      newStatus: status,
      userId: req.user._id,
      userRole: req.user.role
    });

    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      console.log('Invalid status provided:', status);
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find appointment with proper error handling
    let appointment;
    try {
      appointment = await Appointment.findById(appointmentId)
        .populate({
          path: 'doctor',
          select: '_id name role department isActive'
        })
        .populate('createdBy', '_id name role');
      
      if (!appointment) {
        console.log('Appointment not found:', appointmentId);
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Validate doctor exists
      if (!appointment.doctor) {
        console.log('Doctor not found:', {
          appointmentId,
          doctorId: appointment.doctor?._id
        });
        return res.status(400).json({ error: 'Doctor not found' });
      }

      // Log doctor status for debugging
      console.log('Doctor status:', {
        doctorId: appointment.doctor._id,
        doctorName: appointment.doctor.name,
        isActive: appointment.doctor.isActive
      });

      // Only check isActive status for starting consultation
      if (status === 'in-progress' && appointment.doctor.isActive === false) {
        console.log('Doctor is inactive:', {
          appointmentId,
          doctorId: appointment.doctor._id,
          doctorName: appointment.doctor.name
        });
        return res.status(400).json({ error: 'Doctor is currently inactive. Please contact the administrator.' });
      }

      console.log('Found appointment:', {
        appointmentId: appointment._id,
        currentStatus: appointment.status,
        doctorId: appointment.doctor._id,
        doctorName: appointment.doctor.name,
        doctorActive: appointment.doctor.isActive,
        createdById: appointment.createdBy?._id
      });

    } catch (error) {
      console.error('Error finding appointment:', {
        error: error.message,
        stack: error.stack,
        appointmentId
      });
      return res.status(500).json({ 
        error: 'Error finding appointment',
        details: error.message 
      });
    }

    // Check if the user has permission to update this appointment
    const userId = req.user._id.toString();
    const doctorId = appointment.doctor?._id?.toString();
    const createdById = appointment.createdBy?._id?.toString();

    console.log('Permission check:', {
      userId,
      doctorId,
      createdById,
      userRole: req.user.role
    });

    // Allow admin to update any appointment status
    if (req.user.role === 'admin') {
      console.log('Admin updating appointment status');
    } else {
      // For non-admin users, validate they are the doctor and can only update their own appointments
      if (req.user.role !== 'doctor') {
        console.log('User is not a doctor:', {
          userId,
          userRole: req.user.role
        });
        return res.status(403).json({ error: 'Only doctors can update appointment status' });
      }

      if (userId !== doctorId) {
        console.log('Doctor does not match appointment:', {
          userId,
          doctorId
        });
        return res.status(403).json({ error: 'You can only update your own appointments' });
      }
    }

    // Validate status transition
    const validTransitions = {
      'scheduled': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': ['cancelled']
    };

    // Only enforce status transitions for non-admin users
    if (req.user.role !== 'admin') {
      if (!validTransitions[appointment.status]?.includes(status)) {
        console.log('Invalid status transition:', {
          currentStatus: appointment.status,
          newStatus: status
        });
        return res.status(400).json({ 
          error: `Cannot change status from ${appointment.status} to ${status}` 
        });
      }
    } else {
      // For admins, just validate that the new status is one of the allowed values
      if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
        console.log('Invalid status for admin:', status);
        return res.status(400).json({ 
          error: 'Invalid status. Must be one of: scheduled, in-progress, completed, cancelled' 
        });
      }
    }

    // Update the status
    try {
      appointment.status = status;
      await appointment.save();
      console.log('Appointment status saved successfully');
    } catch (error) {
      console.error('Error saving appointment:', {
        error: error.message,
        stack: error.stack,
        appointmentId
      });
      return res.status(500).json({ 
        error: 'Error saving appointment status',
        details: error.message 
      });
    }

    // Populate the appointment with all necessary information
    let updatedAppointment;
    try {
      updatedAppointment = await Appointment.findById(appointment._id)
        .populate('patient', 'name email phone')
        .populate('doctor', 'name email department')
        .populate('createdBy', 'name role');

      console.log('Appointment populated successfully');
    } catch (error) {
      console.error('Error populating appointment:', {
        error: error.message,
        stack: error.stack,
        appointmentId
      });
      return res.status(500).json({ 
        error: 'Error fetching updated appointment details',
        details: error.message 
      });
    }

    console.log('Appointment status updated successfully:', {
      appointmentId: appointment._id,
      newStatus: status
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', {
      error: error.message,
      stack: error.stack,
      appointmentId: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({ 
      error: 'Error updating appointment status',
      details: error.message 
    });
  }
});

// Update appointment details
router.patch('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'status') { // Status updates should use the status endpoint
        appointment[key] = updates[key];
      }
    });

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error updating appointment' });
  }
});

// Delete appointment (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting appointment' });
  }
});

// Get appointment statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Appointment.aggregate([
      {
        $match: {
          date: {
            $gte: today
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
      byStatus: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching appointment statistics' });
  }
});

// Get appointments for a specific doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    console.log('Fetching appointments for doctor:', {
      requestedDoctorId: req.params.doctorId,
      currentUserId: req.user._id,
      userRole: req.user.role
    });

    // Check permissions first
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== req.params.doctorId) {
      console.log('Access denied:', {
        userRole: req.user.role,
        userId: req.user._id,
        requestedDoctorId: req.params.doctorId
      });
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'You do not have permission to view these appointments'
      });
    }

    // If we have permission, fetch the appointments
    const appointments = await Appointment.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role')
      .sort({ date: -1, time: -1 });

    console.log(`Found ${appointments.length} appointments for doctor ${req.params.doctorId}`);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch appointments',
      details: error.message 
    });
  }
});

module.exports = router; 