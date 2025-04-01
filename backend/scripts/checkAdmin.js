const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check for admin user
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('Admin user not found. Creating one...');
      
      // Create admin user
      const admin = new User({
        username: 'admin',
        password: 'admin123', // This will be hashed by the pre-save middleware
        role: 'admin',
        name: 'System Administrator',
        email: 'admin@example.com',
        phone: '1234567890',
        isActive: true
      });

      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user exists:', {
        username: adminUser.username,
        role: adminUser.role,
        isActive: adminUser.isActive
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
}

checkAdmin(); 