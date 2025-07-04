const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
require('dotenv').config();

async function createTestAppointment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find patient
    let patient = await User.findOne({ role: 'patient' });
    if (!patient) {
      patient = new User({
        username: 'testpatient',
        password: 'password123',
        role: 'patient',
        name: 'Test Patient',
        email: 'patient@test.com',
        phone: '1234567890',
        age: 20,
        address: 'Test Address',
        bloodGroup: 'O+',
        isActive: true
      });
      await patient.save();
      console.log('Created test patient');
    }

    // Find doctor
    let doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      doctor = new User({
        username: 'testdoctor',
        password: 'password123',
        role: 'doctor',
        name: 'Test Doctor',
        email: 'doctor@test.com',
        phone: '1234567890',
        department: 'cardiology',
        degree: 'MD',
        specialization: 'Cardiology',
        experience: 5,
        isActive: true
      });
      await doctor.save();
      console.log('Created test doctor');
    }

    // Create test appointment
    const appointment = new Appointment({
      patient: patient._id,
      doctor: doctor._id,
      createdBy: patient._id,
      date: new Date(),
      time: '10:00 AM',
      type: 'consultation',
      department: 'cardiology',
      notes: 'Test appointment',
      symptoms: 'Test symptoms',
      status: 'pending',
      counselorApproval: 'pending'
    });

    await appointment.save();
    console.log('Created test appointment:', appointment);

    // Fetch and display the appointment with populated fields
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone studentId')
      .populate('doctor', 'name email department')
      .populate('createdBy', 'name role');

    console.log('Populated appointment:', JSON.stringify(populatedAppointment, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAppointment(); 