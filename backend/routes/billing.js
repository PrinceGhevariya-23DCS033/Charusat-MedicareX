const express = require('express');
const router = express.Router();
const Billing = require('../models/Billing');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all bills (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    const bills = await Billing.find()
      .populate('patient', 'name email phone')
      .populate({
        path: 'appointment',
        select: 'date time type department doctor',
        populate: {
          path: 'doctor',
          select: 'name department specialization'
        }
      })
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bills' });
  }
});

// Get patient's bills
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    console.log('\n=== Starting Patient Bills Fetch ===');
    console.log('Requested Patient ID:', req.params.patientId);
    console.log('User ID from Token:', req.user.id);
    console.log('User Role:', req.user.role);

    // Allow access if user is admin or if user is accessing their own bills
    if (req.user.role !== 'admin' && req.user.id !== req.params.patientId) {
      console.log('Access denied: User is not admin and not accessing their own bills');
      return res.status(403).json({ error: 'Access denied. You can only view your own bills.' });
    }

    // Get patient data
    const patient = await User.findById(req.params.patientId)
      .select('_id name email phone role')
      .lean();

    console.log('Patient data:', patient);

    if (!patient) {
      console.log('Patient not found');
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get bills for the patient
    const bills = await Billing.find({ patient: req.params.patientId })
      .populate('appointment')
      .populate('appointment.doctor', 'name department specialization')
      .lean();

    console.log('Found bills:', bills.length);
    if (bills.length > 0) {
      console.log('First bill details:', {
        id: bills[0]._id,
        patient: bills[0].patient,
        appointment: bills[0].appointment,
        amount: bills[0].amount,
        status: bills[0].status
      });
    }

    // Enrich bills with patient data
    const enrichedBills = bills.map(bill => ({
      ...bill,
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    }));

    console.log('Enriched first bill:', enrichedBills[0]);
    console.log('=== Ending Patient Bills Fetch ===\n');

    res.json(enrichedBills);
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({ error: 'Error fetching patient bills' });
  }
});

// Create new bill
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { patientId, appointmentId, items, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!patientId || !appointmentId || !items || !paymentMethod) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if patient and appointment exist
    const [patient, appointment] = await Promise.all([
      User.findById(patientId),
      Appointment.findById(appointmentId)
    ]);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Calculate total amount
    const amount = items.reduce((total, item) => total + (item.quantity * item.price), 0);

    const bill = new Billing({
      patient: patientId,
      appointment: appointmentId,
      amount,
      items,
      paymentMethod,
      notes
    });

    await bill.save();
    
    // Populate patient and appointment information before sending response
    const populatedBill = await Billing.findById(bill._id)
      .populate('patient', 'name email phone')
      .populate({
        path: 'appointment',
        select: 'date time type department doctor',
        populate: {
          path: 'doctor',
          select: 'name department specialization'
        }
      });
      
    res.status(201).json(populatedBill);
  } catch (error) {
    res.status(500).json({ error: 'Error creating bill' });
  }
});

// Update bill status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the bill with populated patient field
    const bill = await Billing.findById(req.params.id)
      .populate('patient', '_id name email phone role');

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    console.log('Bill update request:', {
      billId: bill._id,
      patientId: bill.patient._id,
      userId: req.user.id,
      userRole: req.user.role,
      requestedStatus: status
    });

    // Allow access if:
    // 1. User is admin
    // 2. User is the patient and updating their own bill to 'paid'
    if (req.user.role !== 'admin' && 
        (bill.patient._id.toString() !== req.user.id || status !== 'paid')) {
      console.log('Access denied:', {
        userRole: req.user.role,
        userId: req.user.id,
        billPatientId: bill.patient._id,
        requestedStatus: status
      });
      return res.status(403).json({ 
        error: 'Access denied. You can only pay your own bills.' 
      });
    }

    // Update bill status and payment details
    bill.status = status;
    if (status === 'paid') {
      bill.paymentDate = new Date();
      if (paymentMethod) {
        bill.paymentMethod = paymentMethod;
      }
    }

    await bill.save();

    // Populate all necessary fields before sending response
    const updatedBill = await Billing.findById(bill._id)
      .populate('patient', 'name email phone')
      .populate({
        path: 'appointment',
        select: 'date time type department doctor',
        populate: {
          path: 'doctor',
          select: 'name department specialization'
        }
      });

    console.log('Bill updated successfully:', {
      billId: updatedBill._id,
      status: updatedBill.status,
      paymentMethod: updatedBill.paymentMethod,
      paymentDate: updatedBill.paymentDate
    });

    res.json(updatedBill);
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ error: 'Error updating bill status' });
  }
});

// Update bill details
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'status') { // Status updates should use the status endpoint
        bill[key] = updates[key];
      }
    });

    // Recalculate amount if items are updated
    if (updates.items) {
      bill.amount = updates.items.reduce((total, item) => total + (item.quantity * item.price), 0);
    }

    await bill.save();

    // Populate patient and appointment information before sending response
    const populatedBill = await Billing.findById(bill._id)
      .populate('patient', 'name email phone')
      .populate({
        path: 'appointment',
        select: 'date time type department doctor',
        populate: {
          path: 'doctor',
          select: 'name department specialization'
        }
      });
      
    res.json(populatedBill);
  } catch (error) {
    res.status(500).json({ error: 'Error updating bill' });
  }
});

// Delete bill (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const bill = await Billing.findByIdAndDelete(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting bill' });
  }
});

// Get billing statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const stats = await Billing.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalBills = await Billing.countDocuments();
    const totalRevenue = await Billing.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      byStatus: stats,
      totalBills,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching billing statistics' });
  }
});

// Get billing analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    // Get the last 30 days of billing data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const billingData = await Billing.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format data for frontend
    const formattedData = billingData.map(item => ({
      date: item._id,
      amount: item.amount
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching billing analytics:', error);
    res.status(500).json({ error: 'Error fetching billing analytics' });
  }
});

module.exports = router; 