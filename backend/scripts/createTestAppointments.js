const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
require('dotenv').config();

async function createTestAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create a test patient
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
      console.log('Created test patient:', patient);
    }

    // Find or create a test doctor
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
      console.log('Created test doctor:', doctor);
    }

    // Create test appointments
    const appointments = [
      {
        patient: patient._id,
        doctor: doctor._id,
        createdBy: patient._id,
        date: new Date(),
        time: '10:00 AM',
        type: 'consultation',
        department: 'cardiology',
        notes: 'Test appointment 1',
        symptoms: 'Test symptoms',
        status: 'pending',
        counselorApproval: 'pending'
      },
      {
        patient: patient._id,
        doctor: doctor._id,
        createdBy: patient._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '11:00 AM',
        type: 'consultation',
        department: 'cardiology',
        notes: 'Test appointment 2',
        symptoms: 'Test symptoms',
        status: 'pending',
        counselorApproval: 'pending'
      },
      {
        patient: patient._id,
        doctor: doctor._id,
        createdBy: patient._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        time: '02:00 PM',
        type: 'consultation',
        department: 'cardiology',
        notes: 'Test appointment 3',
        symptoms: 'Test symptoms',
        status: 'completed',
        counselorApproval: 'approved'
      }
    ];

    // Clear existing appointments
    await Appointment.deleteMany({});
    console.log('Cleared existing appointments');

    // Insert new appointments
    const createdAppointments = await Appointment.insertMany(appointments);
    console.log('Created test appointments:', createdAppointments);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAppointments(); 