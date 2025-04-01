const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('\n=== Auth Middleware ===');
    console.log('Headers:', {
      authorization: req.header('Authorization') ? 'Present' : 'Missing',
      contentType: req.header('Content-Type')
    });

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token found');
      return res.status(401).json({ error: 'No authentication token, access denied' });
    }

    console.log('Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { id: decoded.id, role: decoded.role });

    const user = await User.findById(decoded.id);
    console.log('User found:', user ? { id: user._id, role: user.role } : 'No user found');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    console.log('Auth successful, proceeding to next middleware');
    console.log('=====================\n');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Token is invalid' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    if (req.user.role !== 'admin') {
      console.log('Access denied - User is not admin:', { id: req.user._id, role: req.user.role });
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    console.log('Admin access granted:', { id: req.user._id });
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

module.exports = { auth, isAdmin }; 