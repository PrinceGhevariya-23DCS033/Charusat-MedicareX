const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'counselor', 'patient', 'staff'],
    required: true
  },
  // Common fields
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  // Doctor specific fields
  department: {
    type: String,
    enum: ['cardiology', 'neurology', 'pediatrics', 'orthopedics', 'dental', 'administration', 'nursing', 'laboratory', 'pharmacy', 'housekeeping', 'security', ''],
    default: ''
  },
  degree: String,
  specialization: String,
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'visiting'],
    default: 'full-time'
  },
  experience: Number,
  // Patient specific fields
  age: Number,
  address: String,
  bloodGroup: String,
  medicalHistory: String,
  // Counselor specific fields
  designation: String,
  expertise: String,
  education: String,
  yearsOfExperience: Number,
  // Staff specific fields
  position: String,
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'flexible', ''],
    default: ''
  },
  joiningDate: Date,
  salary: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;