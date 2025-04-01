const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { auth } = require('../middleware/auth');

// Create new prescription
router.post('/', auth, async (req, res) => {
  try {
    const { patient, patientName, diagnosis, medications, notes, appointmentId } = req.body;
    
    // Validate required fields
    if (!patient || !patientName || !diagnosis || !medications || !medications.length) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          patient: !patient ? 'Patient ID is required' : null,
          patientName: !patientName ? 'Patient name is required' : null,
          diagnosis: !diagnosis ? 'Diagnosis is required' : null,
          medications: !medications || !medications.length ? 'At least one medication is required' : null
        }
      });
    }

    // Validate medications
    const invalidMedications = medications.filter(med => 
      !med.name || !med.dosage || !med.frequency || !med.duration
    );

    if (invalidMedications.length > 0) {
      return res.status(400).json({
        error: 'Invalid medication data',
        details: 'All medications must have name, dosage, frequency, and duration'
      });
    }

    console.log('Creating prescription:', {
      doctor: req.user._id,
      patient,
      patientName,
      diagnosis,
      medicationsCount: medications.length,
      appointmentId
    });

    // Create prescription
    const prescription = new Prescription({
      doctor: req.user._id,
      patient,
      patientName,
      diagnosis,
      medications,
      notes,
      appointment: appointmentId,
      status: 'active'
    });

    await prescription.save();
    
    // Populate the prescription with patient and doctor details
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department');

    res.status(201).json(populatedPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(400).json({ 
      error: 'Failed to create prescription',
      details: error.message 
    });
  }
});

// Get prescriptions for a doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get prescriptions for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    console.log('Fetching prescriptions for patient:', {
      requestedPatientId: req.params.patientId,
      currentUserId: req.user._id,
      userRole: req.user.role
    });

    // Check permissions first
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== req.params.patientId) {
      console.log('Access denied:', {
        userRole: req.user.role,
        userId: req.user._id,
        requestedPatientId: req.params.patientId
      });
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'You do not have permission to view these prescriptions'
      });
    }

    // If we have permission, fetch the prescriptions
    const prescriptions = await Prescription.find({ patient: req.params.patientId })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department')
      .sort({ createdAt: -1 });

    console.log(`Found ${prescriptions.length} prescriptions for patient ${req.params.patientId}`);
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prescriptions',
      details: error.message 
    });
  }
});

// Get single prescription
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check if user has permission to view this prescription
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== prescription.doctor._id.toString() && 
        req.user._id.toString() !== prescription.patient._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update prescription status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Only doctor or admin can update status
    if (req.user.role !== 'admin' && req.user._id.toString() !== prescription.doctor.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    prescription.status = status;
    await prescription.save();

    res.json(prescription);
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 