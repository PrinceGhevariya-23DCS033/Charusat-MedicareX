const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// Add caching
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const clearUserCache = () => {
  cache.delete('all_users');
  cache.delete('staff_users');
  cache.delete('staff_stats');
};

// Register new user (admin only)
router.post('/register', async (req, res) => {
  try {
    // Check if this is the first user (admin)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // First user will be admin
      const user = new User({
        ...req.body,
        role: 'admin'
      });
      await user.save();
      return res.status(201).json(user);
    }

    // For subsequent users, require admin authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findOne({ _id: decoded.id, role: 'admin' });

    if (!admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set authorization header
    res.setHeader('Authorization', `Bearer ${token}`);

    // Send response
    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        isActive: user.isActive
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const cachedUsers = getCachedData('all_users');
    if (cachedUsers) {
      return res.json(cachedUsers);
    }

    const users = await User.find().select('-password');
    setCachedData('all_users', users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Update user (admin only)
router.patch('/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('Update request received for user:', req.params.id);
    console.log('Update data:', req.body);

    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'username', 'role', 'name', 'email', 'phone',
      'department', 'degree', 'specialization', 'availability', 'experience',
      'age', 'address', 'bloodGroup', 'medicalHistory', 'isCharusatStudent',
      'designation', 'expertise', 'education', 'yearsOfExperience',
      'position', 'shift', 'joiningDate', 'salary'
    ];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      console.log('Invalid updates attempted:', updates);
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    updates.forEach(update => {
      user[update] = req.body[update];
    });

    await user.save();
    console.log('User updated successfully:', user._id);

    // Return updated user without password
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot deactivate admin user' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Activate user (admin only)
router.patch('/:id/activate', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Temporary route to check users (remove in production)
router.get('/check', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('Delete request received for user:', req.params.id);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);
    console.log('User deleted successfully:', req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    console.log('Fetching doctors...');
    const doctors = await User.find(
      { 
        role: 'doctor',
        isActive: true
      },
      '-password'
    ).lean();

    console.log(`Found ${doctors.length} doctors`);
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Error fetching doctors' });
  }
});

// Get single user profile
router.get('/:id', auth, async (req, res) => {
  try {
    // Verify the requester is authorized
    if (!['doctor', 'admin', 'counselor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only authorized personnel can view patient details.' });
    }

    const user = await User.findById(req.params.id)
      .select('name email phone age bloodGroup allergies medicalHistory studentId role')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the found user data
    console.log('Found user data:', {
      id: user._id,
      name: user.name,
      role: user.role
    });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Error fetching user details' });
  }
});

// Get user analytics for the last 30 days
router.get('/analytics', auth, async (req, res) => {
  try {
    console.log('\n=== Analytics Request ===');
    console.log('User:', { id: req.user._id, role: req.user.role });

    // Check permissions - only admin and doctor can access analytics
    if (!['admin', 'doctor'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Only administrators and doctors can access analytics'
      });
    }

    // Get and validate role filter
    const { role } = req.query;
    const validRoles = ['admin', 'doctor', 'patient', 'staff', 'counselor'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role parameter',
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log('Date range:', { 
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // Build match condition
    const matchCondition = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add role filter if provided
    if (role) {
      matchCondition.role = role;
    }

    console.log('Match condition:', matchCondition);

    try {
      // First check if we have any users matching the criteria
      const userCount = await User.countDocuments(matchCondition);
      console.log('Matching users count:', userCount);

      // Initialize the response array for the last 30 days
      const filledAnalytics = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        filledAnalytics.push({
          date: currentDate.toISOString().split('T')[0],
          count: 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // If no users found, return the array of zeros
      if (userCount === 0) {
        console.log('No matching users found, returning zero counts');
        return res.json(filledAnalytics);
      }

      // Aggregate users with proper date handling
      const analytics = await User.aggregate([
        {
          $match: matchCondition
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            date: '$_id.date',
            count: 1
          }
        },
        {
          $sort: { date: 1 }
        }
      ]).exec();

      console.log('Raw analytics:', analytics);

      // Merge aggregated data with the filled array
      analytics.forEach(item => {
        const index = filledAnalytics.findIndex(day => day.date === item.date);
        if (index !== -1) {
          filledAnalytics[index].count = item.count;
        }
      });

      console.log('Response data:', filledAnalytics);
      res.json(filledAnalytics);

    } catch (aggregateError) {
      console.error('Aggregation error:', aggregateError);
      throw new Error(`Aggregation failed: ${aggregateError.message}`);
    }

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get patients for doctors
router.get('/doctor/patients', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctor only.' });
    }

    // Get appointments for this doctor to find associated patients
    const doctorAppointments = await Appointment.find({ doctor: doctor._id })
      .distinct('patient');

    // Get all patients who have had appointments with this doctor
    const patients = await User.find({ 
      _id: { $in: doctorAppointments },
      role: 'patient',
      isActive: true 
    })
    .select('name email phone studentId department bloodGroup age')
    .sort({ name: 1 });

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Error fetching patients' });
  }
});

// Get patients for counselors
router.get('/counselor/patients', auth, async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ error: 'Access denied. Only counselors can access this route.' });
    }

    const patients = await User.find({ 
      role: 'patient',
      isActive: true,
      needsCounseling: true // Add this field to filter patients who need counseling
    }).select('name email phone age studentId counselingHistory counselingStatus');
    
    console.log(`Found ${patients.length} patients for counselor`);
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients for counselor:', error);
    res.status(500).json({ error: 'Error fetching patients' });
  }
});

// Get patient details for doctor
router.get('/doctor/patient/:patientId', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctor only.' });
    }

    const patient = await User.findById(req.params.patientId)
      .select('name email phone studentId department bloodGroup age allergies medicalHistory')
      .lean();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get patient's appointments with this doctor
    const appointments = await Appointment.find({
      patient: patient._id,
      doctor: doctor._id
    })
      .sort({ date: -1, time: -1 })
      .limit(5);

    // Get patient's prescriptions from this doctor
    const prescriptions = await Prescription.find({
      patient: patient._id,
      doctor: doctor._id
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department')
      .sort({ date: -1 })
      .limit(5);

    res.json({
      ...patient,
      recentAppointments: appointments,
      recentPrescriptions: prescriptions
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Error fetching patient details' });
  }
});

// Get single patient details for counselors
router.get('/counselor/patient/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ error: 'Access denied. Only counselors can access patient details.' });
    }

    const patient = await User.findOne({
      _id: req.params.id,
      role: 'patient',
      isActive: true
    }).select('name email phone age studentId counselingHistory counselingStatus');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log('Found patient data for counselor:', {
      id: patient._id,
      name: patient.name
    });

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient details for counselor:', error);
    res.status(500).json({ error: 'Error fetching patient details' });
  }
});

// Make sure this is the last route before module.exports
module.exports = router; 