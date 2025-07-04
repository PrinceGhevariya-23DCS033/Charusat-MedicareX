const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');

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

    // For doctors, only show approved appointments
    const query = user.role === 'doctor' 
      ? { doctor: req.params.userId, counselorApproval: 'approved' }
      : { patient: req.params.userId };

    const appointments = await Appointment.find(query)
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

// Check available slots for a doctor on a specific date
router.get('/available-slots/:doctorId/:date', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const appointmentDate = new Date(date);
    
    // Get doctor's schedule
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const schedule = await Schedule.findOne({ doctor: doctorId });
    if (!schedule) {
      return res.status(404).json({ error: 'Doctor schedule not found' });
    }

    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = appointmentDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Check if doctor works on this day
    const workingDay = schedule.workingDays.find(day => day.day === dayName);
    if (!workingDay || !workingDay.isWorking) {
      return res.json({ 
        availableSlots: [],
        message: 'Doctor is not working on this day',
        workingHours: null
      });
    }

    // Get existing appointments for this date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['scheduled', 'in-progress'] }
    });

    // Generate available slots
    const availableSlots = [];
    const startTime = new Date(`2000-01-01T${workingDay.startTime}`);
    const endTime = new Date(`2000-01-01T${workingDay.endTime}`);
    const breakStart = new Date(`2000-01-01T${schedule.breakStartTime}`);
    const breakEnd = new Date(breakStart.getTime() + schedule.breakTime * 60000);
    const slotDuration = schedule.appointmentDuration * 60000;

    let currentTime = startTime;
    while (currentTime < endTime) {
      // Skip break time
      if (currentTime >= breakStart && currentTime < breakEnd) {
        currentTime = breakEnd;
        continue;
      }

      const slotEnd = new Date(currentTime.getTime() + slotDuration);
      if (slotEnd > endTime) break;

      const timeString = currentTime.toTimeString().slice(0, 5);

      // Check if slot is already booked
      const isBooked = existingAppointments.some(apt => apt.time === timeString);
      
      // Check if slot would overlap with any existing appointments
      const wouldOverlap = existingAppointments.some(apt => {
        const aptTime = new Date(`2000-01-01T${apt.time}`);
        return (aptTime >= currentTime && aptTime < slotEnd) ||
               (currentTime >= aptTime && currentTime < new Date(aptTime.getTime() + slotDuration));
      });

        availableSlots.push({
        time: timeString,
        isAvailable: !isBooked && !wouldOverlap,
        isBreakTime: currentTime >= breakStart && currentTime < breakEnd,
        reason: isBooked ? 'Booked' : wouldOverlap ? 'Overlaps with another appointment' : 'Available'
        });

      currentTime = new Date(currentTime.getTime() + slotDuration);
    }

    res.json({ 
      availableSlots,
      workingHours: {
        start: workingDay.startTime,
        end: workingDay.endTime,
        breakStart: schedule.breakStartTime,
        breakEnd: breakEnd.toTimeString().slice(0, 5)
      },
      appointmentDuration: schedule.appointmentDuration,
      maxAppointmentsPerDay: schedule.maxAppointmentsPerDay,
      appointmentsBooked: existingAppointments.length
    });
  } catch (error) {
    console.error('Error checking available slots:', error);
    res.status(500).json({ error: 'Error checking available slots' });
  }
});

// Update appointment creation to validate slot availability
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, department, notes, symptoms } = req.body;

    // Validate required fields with specific error messages
    const missingFields = [];
    if (!patientId) missingFields.push('patient');
    if (!doctorId) missingFields.push('doctor');
    if (!date) missingFields.push('date');
    if (!time) missingFields.push('time');
    if (!type) missingFields.push('appointment type');
    if (!department) missingFields.push('department');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Please provide all required fields',
        missingFields: missingFields,
        message: `Missing: ${missingFields.join(', ')}`
      });
    }

    // Check if patient and doctor exist
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(doctorId)
    ]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if patient is a Charusat student
    const isCharusatStudent = patient.isCharusatStudent || false;

    // Check if doctor belongs to the specified department
    if (doctor.department !== department) {
      return res.status(400).json({ error: 'Doctor does not belong to the specified department' });
    }

    // Check if slot is available
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: appointmentDate,
      time: time,
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Check if the time slot is within doctor's working hours
    const schedule = await Schedule.findOne({ doctor: doctorId });
    if (!schedule) {
      return res.status(400).json({ error: 'Doctor schedule not found' });
    }

    const dayOfWeek = appointmentDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];

    // Create the appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      createdBy: req.user._id,
      date: appointmentDate,
      time,
      type,
      department,
      notes: notes || '',
      symptoms: symptoms || '',
      status: isCharusatStudent ? 'pending' : 'scheduled',
      counselorApproval: isCharusatStudent ? 'pending' : 'approved'
    });

    await appointment.save();

    // Populate the appointment with creator information
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone isCharusatStudent')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      error: 'Error creating appointment',
      message: error.message
    });
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

// Get appointment analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    console.log('Fetching appointment analytics...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Create an array of the last 30 days
    const allDates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      allDates.unshift(date.toISOString().split('T')[0]);
    }

    // Get daily appointment counts
    const dailyStats = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('Daily stats:', dailyStats);

    // Create a map of date to count
    const dateCountMap = new Map();
    dailyStats.forEach(item => {
      if (item && item._id) {
        dateCountMap.set(item._id, item.count);
      }
    });

    // Fill in missing dates with zero counts
    const finalData = allDates.map(date => ({
      date,
      count: dateCountMap.get(date) || 0
    }));

    console.log('Final data:', finalData);
    res.json(finalData);
  } catch (error) {
    console.error('Error in appointments analytics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error fetching appointment analytics',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get counselor's pending appointments
router.get('/counselor/pending', auth, async (req, res) => {
  try {
    console.log('Fetching pending appointments for counselor:', req.user._id);
    
    if (req.user.role !== 'counselor') {
      console.log('Access denied - Not a counselor:', req.user.role);
      return res.status(403).json({ error: 'Access denied. Counselor only.' });
    }

    const appointments = await Appointment.find({
      counselorApproval: 'pending'
    })
      .populate({
        path: 'patient',
        select: 'name email phone studentId isCharusatStudent',
        match: { isCharusatStudent: true }
      })
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role')
      .sort({ date: 1, time: 1 })
      .lean();

    // Filter out appointments where patient is null (non-Charusat students)
    const charusatAppointments = appointments.filter(apt => apt.patient !== null);

    console.log('Found pending appointments:', JSON.stringify(charusatAppointments, null, 2));
    console.log('Appointment details:', charusatAppointments.map(apt => ({
      id: apt._id,
      patient: apt.patient ? {
        name: apt.patient.name,
        isCharusatStudent: apt.patient.isCharusatStudent
      } : null,
      status: apt.status,
      counselorApproval: apt.counselorApproval
    })));

    return res.json({
      success: true,
      count: charusatAppointments.length,
      data: charusatAppointments
    });
  } catch (error) {
    console.error('Error fetching counselor pending appointments:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error fetching appointments',
      message: error.message
    });
  }
});

// Get counselor's appointment history
router.get('/counselor/history', auth, async (req, res) => {
  try {
    console.log('Fetching appointment history for counselor:', req.user._id);
    
    if (req.user.role !== 'counselor') {
      console.log('Access denied - Not a counselor:', req.user.role);
      return res.status(403).json({ error: 'Access denied. Counselor only.' });
    }

    const appointments = await Appointment.find({
      counselorApproval: { $in: ['approved', 'rejected'] }
    })
      .populate('patient', 'name email phone studentId')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role')
      .sort({ updatedAt: -1 })
      .lean();

    console.log('Found history appointments:', appointments);

    return res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching counselor appointment history:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error fetching appointments',
      message: error.message
    });
  }
});

// Get counselor's dashboard stats
router.get('/counselor/stats', auth, async (req, res) => {
  try {
    console.log('Fetching stats for counselor:', req.user._id);
    
    if (req.user.role !== 'counselor') {
      console.log('Access denied - Not a counselor:', req.user.role);
      return res.status(403).json({ error: 'Access denied. Counselor only.' });
    }

    const [totalAppointments, pendingAppointmentsRaw, approvedAppointments] = await Promise.all([
      Appointment.countDocuments({}),
      Appointment.find({ counselorApproval: 'pending' }).populate('patient', 'isCharusatStudent').lean(),
      Appointment.countDocuments({ counselorApproval: 'approved' })
    ]);

    // Filter pending appointments for Charusat students
    const pendingAppointments = pendingAppointmentsRaw.filter(apt => apt.patient?.isCharusatStudent === true).length;

    const stats = {
      totalAppointments,
      pendingAppointments,
      approvedAppointments
    };

    console.log('Dashboard stats:', stats);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching counselor stats:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error fetching stats',
      message: error.message
    });
  }
});

// Approve appointment by counselor
router.put('/counselor/:id/approve', auth, async (req, res) => {
  try {
    console.log('Approving appointment:', req.params.id);
    
    if (req.user.role !== 'counselor') {
      console.log('Access denied - Not a counselor:', req.user.role);
      return res.status(403).json({ error: 'Access denied. Counselor only.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        error: 'Appointment not found' 
      });
    }

    if (appointment.counselorApproval !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Appointment is not pending approval' 
      });
    }

    appointment.counselorApproval = 'approved';
    appointment.status = 'scheduled';
    appointment.bill = 0; // Set bill to 0 after counselor approval
    
    await appointment.save();

    return res.json({
      success: true,
      message: 'Appointment approved successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error approving appointment:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error approving appointment',
      message: error.message
    });
  }
});

// Reject appointment by counselor
router.put('/counselor/:id/reject', auth, async (req, res) => {
  try {
    console.log('Rejecting appointment:', req.params.id);
    
    if (req.user.role !== 'counselor') {
      console.log('Access denied - Not a counselor:', req.user.role);
      return res.status(403).json({ error: 'Access denied. Counselor only.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        error: 'Appointment not found' 
      });
    }

    if (appointment.counselorApproval !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Appointment is not pending approval' 
      });
    }

    appointment.counselorApproval = 'rejected';
    appointment.status = 'cancelled';
    
    await appointment.save();

    return res.json({
      success: true,
      message: 'Appointment rejected successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error rejecting appointment',
      message: error.message
    });
  }
});

// Reschedule appointment
router.patch('/:id/reschedule', auth, async (req, res) => {
  try {
    const { date, time } = req.body;
    const appointmentId = req.params.id;

    // Validate required fields
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required for rescheduling' });
    }

    // Validate appointment ID
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email department');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has permission to reschedule
    const userId = req.user._id.toString();
    const isPatient = userId === appointment.patient._id.toString();
    const isDoctor = userId === appointment.doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to reschedule this appointment' });
    }

    // Check for existing appointment at the new time
    const existingAppointment = await Appointment.findOne({
      doctor: appointment.doctor._id,
      date: date,
      time: time,
      status: 'scheduled',
      _id: { $ne: appointmentId }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'Doctor already has an appointment at this time' });
    }

    // Update appointment
    appointment.date = date;
    appointment.time = time;
    await appointment.save();

    // Return updated appointment
    res.json(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Error rescheduling appointment' });
  }
});

// Cancel appointment
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Validate appointment ID
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email department');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has permission to cancel
    const userId = req.user._id.toString();
    const isPatient = userId === appointment.patient._id.toString();
    const isDoctor = userId === appointment.doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to cancel this appointment' });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Return updated appointment
    res.json(appointment);
  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ error: 'Error canceling appointment' });
  }
});

module.exports = router; 