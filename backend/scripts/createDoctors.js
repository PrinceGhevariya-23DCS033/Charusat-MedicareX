const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Sample doctors
    const doctors = [
      {
        username: 'doctor1',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. John Smith',
        email: 'john.smith.cardiologist@hospital.com',
        phone: '1234567891',
        department: 'cardiology',
        degree: 'MD',
        specialization: 'Cardiologist',
        availability: 'full-time',
        experience: 10,
        isActive: true
      },
      {
        username: 'doctor2',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson.neurologist@hospital.com',
        phone: '1234567892',
        department: 'neurology',
        degree: 'MD',
        specialization: 'Neurologist',
        availability: 'full-time',
        experience: 8,
        isActive: true
      },
      {
        username: 'doctor3',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. Michael Brown',
        email: 'michael.brown.pediatrician@hospital.com',
        phone: '1234567893',
        department: 'pediatrics',
        degree: 'MD',
        specialization: 'Pediatrician',
        availability: 'full-time',
        experience: 12,
        isActive: true
      },
      {
        username: 'doctor4',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. Emily Davis',
        email: 'emily.davis.orthopedic@hospital.com',
        phone: '1234567894',
        department: 'orthopedics',
        degree: 'MD',
        specialization: 'Orthopedic Surgeon',
        availability: 'full-time',
        experience: 15,
        isActive: true
      },
      {
        username: 'doctor5',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. Robert Wilson',
        email: 'robert.wilson.dentist@hospital.com',
        phone: '1234567895',
        department: 'dental',
        degree: 'DDS',
        specialization: 'Dentist',
        availability: 'full-time',
        experience: 7,
        isActive: true
      }
    ];

    // Delete existing doctors
    await User.deleteMany({ role: 'doctor' });
    console.log('Deleted existing doctors');

    // Create new doctors
    for (const doctor of doctors) {
      const newDoctor = new User(doctor);
      await newDoctor.save();
      console.log(`Created doctor: ${doctor.name}`);
    }

    console.log('\nDoctors created successfully');
    console.log('You can now log in with any of these accounts:');
    doctors.forEach(doctor => {
      console.log(`Username: ${doctor.username}, Password: doctor123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating doctors:', error);
    process.exit(1);
  }
}

createDoctors(); 