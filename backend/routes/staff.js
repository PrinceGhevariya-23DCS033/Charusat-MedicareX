const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Get all staff members
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }, '-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff schedule
router.get('/schedule', auth, isAdmin, async (req, res) => {
  try {
    const { department, date } = req.query;
    const query = { role: 'staff' };
    
    if (department) {
      query.department = department;
    }

    const staff = await User.find(query, '-password');
    const schedule = staff.map(member => ({
      id: member._id,
      name: member.name,
      department: member.department,
      position: member.position,
      shift: member.shift,
      date: date || new Date().toISOString().split('T')[0]
    }));

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff schedule
router.patch('/schedule/:id', auth, isAdmin, async (req, res) => {
  try {
    const { shift } = req.body;
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    staff.shift = shift;
    await staff.save();

    res.json({ message: 'Schedule updated successfully', staff });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get staff by department
router.get('/department/:department', auth, isAdmin, async (req, res) => {
  try {
    const staff = await User.find(
      { role: 'staff', department: req.params.department },
      '-password'
    );
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'staff' } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          shifts: {
            $push: '$shift'
          }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 