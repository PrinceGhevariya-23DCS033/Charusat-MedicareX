const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('\n=== Auth Middleware ===');
    
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header found' });
    }

    // Check Bearer scheme
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization scheme. Use Bearer token' });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token found in authorization header' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified:', { id: decoded.id, role: decoded.role });
    } catch (error) {
      console.error('Token verification failed:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      throw error;
    }

    // Find user
    const user = await User.findById(decoded.id);
    console.log('User lookup result:', user ? { id: user._id, role: user.role } : 'No user found');

    if (!user) {
      return res.status(401).json({ error: 'User not found or deleted' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    // Add user and token info to request
    req.user = user;
    req.token = token;
    console.log('Auth successful for user:', { id: user._id, role: user.role });
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      console.error('No user found in request');
      return res.status(401).json({ error: 'Please authenticate first' });
    }

    if (req.user.role !== 'admin') {
      console.log('Access denied - Not admin:', { id: req.user._id, role: req.user.role });
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    console.log('Admin access granted:', { id: req.user._id });
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      error: 'Admin check failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { auth, isAdmin }; 
