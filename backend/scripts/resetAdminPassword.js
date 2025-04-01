const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Reset password
    adminUser.password = 'admin123';
    await adminUser.save();

    console.log('Admin password reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 