const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { auth, isAdmin } = require('../middleware/auth');

// Get all inventory items (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching all inventory items...');
    const inventory = await Inventory.find().sort({ updatedAt: -1 });
    console.log(`Found ${inventory.length} items`);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get inventory statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching inventory statistics...');
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Inventory.countDocuments({ status: 'Out of Stock' });

    console.log('Statistics fetched successfully');
    res.json({
      totalItems,
      lowStockItems,
      outOfStockItems,
      byStatus: stats
    });
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new inventory item (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('Adding new inventory item:', req.body);
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'quantity', 'unit', 'price', 'reorderLevel', 'location'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        fields: missingFields 
      });
    }

    const inventory = new Inventory(req.body);
    const newItem = await inventory.save();
    console.log('New inventory item added successfully:', newItem._id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

// Update inventory item (admin only)
router.patch('/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('Updating inventory item:', req.params.id);
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      console.error('Item not found:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

    Object.assign(inventory, req.body);
    const updatedItem = await inventory.save();
    console.log('Inventory item updated successfully:', updatedItem._id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

// Delete inventory item (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('Deleting inventory item:', req.params.id);
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      console.error('Item not found:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

    await inventory.deleteOne();
    console.log('Inventory item deleted successfully:', req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update stock quantity (admin only)
router.patch('/:id/stock', auth, isAdmin, async (req, res) => {
  try {
    console.log('Updating stock for item:', req.params.id);
    const { quantity, type } = req.body;
    
    if (!quantity || !type || !['add', 'remove'].includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid request. Quantity and type (add/remove) are required.' 
      });
    }

    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      console.error('Item not found:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

    if (type === 'remove' && inventory.quantity < quantity) {
      console.error('Insufficient stock:', inventory.quantity, quantity);
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    inventory.quantity = type === 'add' 
      ? inventory.quantity + quantity 
      : inventory.quantity - quantity;

    const updatedItem = await inventory.save();
    console.log('Stock updated successfully:', updatedItem._id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

// Get low stock items (admin only)
router.get('/low-stock', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching low stock items...');
    const lowStockItems = await Inventory.find({
      $or: [
        { status: 'Low Stock' },
        { status: 'Out of Stock' }
      ]
    }).sort({ updatedAt: -1 });
    
    console.log(`Found ${lowStockItems.length} low stock items`);
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 