const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');

// Test route - no auth required
router.get('/test', (req, res) => {
  console.log('Test route hit in schedules router');
  res.json({ 
    message: 'Schedules router is working',
    timestamp: new Date().toISOString()
  });
});

// Check if doctor exists
router.get('/check-doctor/:doctorId', async (req, res) => {
  try {
    console.log('Checking doctor:', req.params.doctorId);
    const doctor = await User.findById(req.params.doctorId);
    console.log('Doctor found:', doctor ? {
      id: doctor._id,
      role: doctor.role,
      name: doctor.name
    } : 'No doctor found');
    res.json({ exists: !!doctor, doctor });
  } catch (error) {
    console.error('Error checking doctor:', error);
    res.status(500).json({ error: 'Error checking doctor' });
  }
});

// Get doctor's schedule
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    console.log('\n=== Fetching Schedule ===');
    console.log('Doctor ID:', req.params.doctorId);
    console.log('Authenticated user:', {
      id: req.user._id,
      role: req.user.role
    });
    
    // First check if the doctor exists
    const doctor = await User.findById(req.params.doctorId);
    console.log('Found doctor:', doctor ? {
      id: doctor._id,
      role: doctor.role,
      name: doctor.name
    } : 'No doctor found');
    
    if (!doctor) {
      console.log('Doctor not found in database');
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.role !== 'doctor') {
      console.log('User is not a doctor:', doctor.role);
      return res.status(400).json({ error: 'User is not a doctor' });
    }

    // Check if the requesting user has permission
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.doctorId) {
      console.log('Access denied - User role:', req.user.role, 'User ID:', req.user._id);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Try to find existing schedule
    let schedule = await Schedule.findOne({ doctor: req.params.doctorId });
    console.log('Found schedule:', schedule ? 'Yes' : 'No');

    // If no schedule exists, create a default one
    if (!schedule) {
      console.log('Creating default schedule for doctor:', doctor.name);
      schedule = new Schedule({
        doctor: req.params.doctorId,
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
      
      try {
        await schedule.save();
        console.log('Default schedule created successfully');
      } catch (saveError) {
        console.error('Error saving default schedule:', saveError);
        return res.status(500).json({ error: 'Error creating default schedule' });
      }
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error in GET /doctor/:doctorId:', error);
    res.status(500).json({ error: 'Error fetching schedule' });
  }
});

// Update doctor's schedule
router.patch('/doctor/:doctorId', auth, async (req, res) => {
  try {
    console.log('Updating schedule for doctor:', req.params.doctorId);
    console.log('Request body:', req.body);
    
    const doctor = await User.findById(req.params.doctorId);
    console.log('Found doctor:', doctor ? 'Yes' : 'No');
    
    if (!doctor || doctor.role !== 'doctor') {
      console.log('Doctor not found or not a doctor role');
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if the requesting user has permission
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.doctorId) {
      console.log('Access denied - User role:', req.user.role, 'User ID:', req.user._id);
      return res.status(403).json({ error: 'Access denied' });
    }

    const { workingDays, appointmentDuration, maxAppointmentsPerDay } = req.body;

    // Validate working days
    if (workingDays) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const hasAllDays = validDays.every(day => workingDays.some(wd => wd.day === day));
      
      if (!hasAllDays) {
        return res.status(400).json({ error: 'Schedule must include all days of the week' });
      }

      // Validate time format for working days
      for (const day of workingDays) {
        if (day.isWorking) {
          if (!day.startTime || !day.endTime) {
            return res.status(400).json({ error: 'Working days must have start and end times' });
          }
          if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(day.startTime) || 
              !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(day.endTime)) {
            return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
          }
        }
      }
    }

    // Validate appointment duration
    if (appointmentDuration && (appointmentDuration < 5 || appointmentDuration > 60)) {
      return res.status(400).json({ error: 'Appointment duration must be between 5 and 60 minutes' });
    }

    // Validate max appointments per day
    if (maxAppointmentsPerDay && (maxAppointmentsPerDay < 1 || maxAppointmentsPerDay > 50)) {
      return res.status(400).json({ error: 'Maximum appointments per day must be between 1 and 50' });
    }

    let schedule = await Schedule.findOne({ doctor: req.params.doctorId });

    if (!schedule) {
      schedule = new Schedule({
        doctor: req.params.doctorId,
        workingDays: workingDays || [
          { day: 'monday', startTime: '09:00', endTime: '17:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
          { day: 'thursday', startTime: '09:00', endTime: '17:00' },
          { day: 'friday', startTime: '09:00', endTime: '17:00' },
          { day: 'saturday', isWorking: false },
          { day: 'sunday', isWorking: false }
        ]
      });
    }

    // Update fields
    if (workingDays) schedule.workingDays = workingDays;
    if (appointmentDuration) schedule.appointmentDuration = appointmentDuration;
    if (maxAppointmentsPerDay) schedule.maxAppointmentsPerDay = maxAppointmentsPerDay;

    await schedule.save();
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Error updating schedule' });
  }
});

// Get available time slots for a specific date
router.get('/available/:doctorId/:date', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const schedule = await Schedule.findOne({ doctor: req.params.doctorId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const date = new Date(req.params.date);
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayIndex = date.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[dayIndex];

    const workingDay = schedule.workingDays.find(day => day.day === dayOfWeek);
    if (!workingDay || !workingDay.isWorking) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      doctor: req.params.doctorId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      },
      status: 'scheduled'
    });

    // Generate available time slots
    const availableSlots = [];
    const startTime = new Date(`2000-01-01T${workingDay.startTime}`);
    const endTime = new Date(`2000-01-01T${workingDay.endTime}`);
    const duration = schedule.appointmentDuration * 60000; // Convert to milliseconds

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      // Check if slot is already booked
      const isBooked = existingAppointments.some(apt => apt.time === timeString);
      
      if (!isBooked) {
        availableSlots.push(timeString);
      }

      currentTime = new Date(currentTime.getTime() + duration);
    }

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Error fetching available slots' });
  }
});

module.exports = router; 