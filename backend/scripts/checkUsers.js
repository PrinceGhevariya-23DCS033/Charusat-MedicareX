const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, '-password');
    console.log('Users in database:', users);

    // Check admin user specifically
    const adminUser = await User.findOne({ username: 'admin' });
    console.log('Admin user:', adminUser ? {
      username: adminUser.username,
      role: adminUser.role,
      isActive: adminUser.isActive
    } : 'Not found');

    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers(); 