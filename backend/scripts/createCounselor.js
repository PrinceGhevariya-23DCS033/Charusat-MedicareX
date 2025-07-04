const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createCounselor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if counselor exists
    const existingCounselor = await User.findOne({ role: 'counselor' });
    if (existingCounselor) {
      console.log('Counselor already exists:', existingCounselor);
      return;
    }

    // Create new counselor
    const counselor = new User({
      username: 'counselor1',
      password: 'password123',
      role: 'counselor',
      name: 'Test Counselor',
      email: 'counselor1@test.com',
      phone: '1234567890',
      designation: 'Senior Counselor',
      expertise: 'Student Counseling',
      education: 'Masters in Counseling',
      yearsOfExperience: 5,
      isActive: true
    });

    await counselor.save();
    console.log('Counselor created successfully:', counselor);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createCounselor(); 