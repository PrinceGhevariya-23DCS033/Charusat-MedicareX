const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function verifyCounselor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find counselor user
    let counselor = await User.findOne({ username: 'counselor' });
    
    if (!counselor) {
      console.log('Counselor not found, creating new counselor user...');
      counselor = new User({
        username: 'counselor',
        password: 'password123', // You should change this in production
        role: 'counselor',
        name: 'Test Counselor',
        email: 'counselor@test.com',
        phone: '1234567890',
        isActive: true
      });
      await counselor.save();
      console.log('Created new counselor user:', counselor);
    } else {
      console.log('Found existing counselor:', counselor);
      
      // Ensure role is set to counselor
      if (counselor.role !== 'counselor') {
        counselor.role = 'counselor';
        await counselor.save();
        console.log('Updated counselor role');
      }
      
      // Ensure account is active
      if (!counselor.isActive) {
        counselor.isActive = true;
        await counselor.save();
        console.log('Activated counselor account');
      }
    }

    console.log('\nCounselor account details:');
    console.log('ID:', counselor._id);
    console.log('Username:', counselor.username);
    console.log('Role:', counselor.role);
    console.log('Active:', counselor.isActive);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verifyCounselor(); 