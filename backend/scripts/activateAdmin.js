const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function activateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    adminUser.isActive = true;
    await adminUser.save();

    console.log('Admin user activated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error activating admin user:', error);
    process.exit(1);
  }
}

activateAdmin(); 