const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin user if exists
    await User.deleteOne({ username: 'admin' });
    console.log('Deleted existing admin user if any');

    // Create new admin user
    const admin = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@example.com',
      phone: '1234567890',
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin user:', error);
    process.exit(1);
  }
}

resetAdmin(); 