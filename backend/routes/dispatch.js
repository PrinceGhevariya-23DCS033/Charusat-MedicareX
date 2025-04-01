const express = require('express');
const router = express.Router();
const Dispatch = require('../models/Dispatch');
const Inventory = require('../models/Inventory');
const { auth, isAdmin } = require('../middleware/auth');

// Get all dispatches (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching all dispatches...');
    const dispatches = await Dispatch.find()
      .populate('item', 'name category quantity unit')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 });
    console.log(`Found ${dispatches.length} dispatches`);
    res.json(dispatches);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get dispatches by department
router.get('/department/:department', auth, isAdmin, async (req, res) => {
  try {
    console.log(`Fetching dispatches for department: ${req.params.department}`);
    const dispatches = await Dispatch.find({ department: req.params.department })
      .populate('item', 'name category quantity unit')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(dispatches);
  } catch (error) {
    console.error('Error fetching department dispatches:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new dispatch request
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new dispatch request:', req.body);
    
    // Check if item exists and has sufficient stock
    const item = await Inventory.findById(req.body.item);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    if (item.quantity < req.body.quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const dispatch = new Dispatch({
      ...req.body,
      issuedBy: req.user._id
    });
    
    const newDispatch = await dispatch.save();
    console.log('Dispatch request created successfully:', newDispatch._id);
    res.status(201).json(newDispatch);
  } catch (error) {
    console.error('Error creating dispatch request:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

// Update dispatch status (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    console.log('Updating dispatch status:', req.params.id);
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('item');
    
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }

    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If approving, update inventory
    if (status === 'Approved' && dispatch.status === 'Pending') {
      const item = dispatch.item;
      if (item.quantity < dispatch.quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      item.quantity -= dispatch.quantity;
      await item.save();
    }

    // If rejecting, revert inventory if it was previously approved
    if (status === 'Rejected' && dispatch.status === 'Approved') {
      const item = dispatch.item;
      item.quantity += dispatch.quantity;
      await item.save();
    }

    dispatch.status = status;
    const updatedDispatch = await dispatch.save();
    console.log('Dispatch status updated successfully:', updatedDispatch._id);
    res.json(updatedDispatch);
  } catch (error) {
    console.error('Error updating dispatch status:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

// Get dispatch statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching dispatch statistics...');
    const stats = await Dispatch.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalDispatches = await Dispatch.countDocuments();
    const pendingDispatches = await Dispatch.countDocuments({ status: 'Pending' });
    const approvedDispatches = await Dispatch.countDocuments({ status: 'Approved' });
    const completedDispatches = await Dispatch.countDocuments({ status: 'Completed' });

    res.json({
      totalDispatches,
      pendingDispatches,
      approvedDispatches,
      completedDispatches,
      byStatus: stats
    });
  } catch (error) {
    console.error('Error fetching dispatch statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 