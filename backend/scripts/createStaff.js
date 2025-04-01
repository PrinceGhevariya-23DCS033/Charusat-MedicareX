const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createStaff() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Sample staff members
    const staffMembers = [
      {
        username: 'nurse1',
        password: 'staff123',
        role: 'staff',
        name: 'Sarah Johnson',
        email: 'sarah.j@hospital.com',
        phone: '1234567891',
        department: 'nursing',
        position: 'Senior Nurse',
        shift: 'morning',
        isActive: true
      },
      {
        username: 'nurse2',
        password: 'staff123',
        role: 'staff',
        name: 'Mike Wilson',
        email: 'mike.w@hospital.com',
        phone: '1234567892',
        department: 'nursing',
        position: 'Nurse',
        shift: 'afternoon',
        isActive: true
      },
      {
        username: 'lab1',
        password: 'staff123',
        role: 'staff',
        name: 'Emily Brown',
        email: 'emily.b@hospital.com',
        phone: '1234567893',
        department: 'laboratory',
        position: 'Lab Technician',
        shift: 'morning',
        isActive: true
      },
      {
        username: 'pharmacy1',
        password: 'staff123',
        role: 'staff',
        name: 'David Lee',
        email: 'david.l@hospital.com',
        phone: '1234567894',
        department: 'pharmacy',
        position: 'Pharmacist',
        shift: 'afternoon',
        isActive: true
      },
      {
        username: 'housekeeping1',
        password: 'staff123',
        role: 'staff',
        name: 'Lisa Chen',
        email: 'lisa.c@hospital.com',
        phone: '1234567895',
        department: 'housekeeping',
        position: 'Housekeeping Staff',
        shift: 'morning',
        isActive: true
      }
    ];

    // Delete existing staff members
    await User.deleteMany({ role: 'staff' });
    console.log('Deleted existing staff members');

    // Create new staff members
    for (const staff of staffMembers) {
      const newStaff = new User(staff);
      await newStaff.save();
      console.log(`Created staff member: ${staff.name}`);
    }

    console.log('\nStaff members created successfully');
    console.log('You can now log in with any of these accounts:');
    staffMembers.forEach(staff => {
      console.log(`Username: ${staff.username}, Password: staff123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating staff members:', error);
    process.exit(1);
  }
}

createStaff(); 