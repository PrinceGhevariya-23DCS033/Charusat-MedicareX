const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

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

// Get all users (admin only) or patients (for doctors)
router.get('/', auth, async (req, res) => {
  try {
    console.log('User requesting data:', {
      id: req.user._id,
      role: req.user.role
    });

    // If user is admin, return all users
    if (req.user.role === 'admin') {
      const users = await User.find().select('-password');
      res.json(users);
      return;
    }

    // If user is doctor, return only patients
    if (req.user.role === 'doctor') {
      const patients = await User.find({ 
        role: 'patient',
        isActive: true 
      }).select('-password');
      res.json(patients);
      return;
    }

    // For other roles, return only their own data
    const user = await User.findById(req.user._id).select('-password');
    res.json([user]);
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
      'age', 'address', 'bloodGroup', 'medicalHistory',
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

// Make sure this is the last route before module.exports
module.exports = router; 