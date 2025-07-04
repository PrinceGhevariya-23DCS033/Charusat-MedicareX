const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LabTest = require('../models/LabTest');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/lab-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF and image files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all lab tests for a doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const labTests = await LabTest.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email')
      .sort({ requestedDate: -1 });
    res.json(labTests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all lab tests for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const labTests = await LabTest.find({ patient: req.params.patientId })
      .populate('doctor', 'name email')
      .sort({ requestedDate: -1 });
    res.json(labTests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new lab test request
router.post('/', auth, async (req, res) => {
  try {
    const labTest = new LabTest({
      ...req.body,
      doctor: req.user.id
    });
    const newLabTest = await labTest.save();
    res.status(201).json(newLabTest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update lab test status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const labTest = await LabTest.findById(req.params.id);
    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }
    labTest.status = req.body.status;
    const updatedLabTest = await labTest.save();
    res.json(updatedLabTest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update lab test results
router.patch('/:id/results', auth, upload.single('reportFile'), async (req, res) => {
  try {
    console.log('Updating lab test results:', {
      testId: req.params.id,
      hasFile: !!req.file,
      hasResults: !!req.body.results
    });

    const labTest = await LabTest.findById(req.params.id);
    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }

    // If there's a new file, update the reportFile path
    if (req.file) {
      // Delete old file if it exists
      if (labTest.reportFile) {
        const oldFilePath = path.join(__dirname, '../', labTest.reportFile);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      // Update with new file path
      labTest.reportFile = `/uploads/lab-reports/${req.file.filename}`;
    }

    // Update results and status
    if (req.body.results) {
      labTest.results = req.body.results;
    }
    labTest.status = 'completed';
    
    const updatedLabTest = await labTest.save();
    console.log('Lab test updated successfully:', {
      testId: updatedLabTest._id,
      status: updatedLabTest.status,
      hasReportFile: !!updatedLabTest.reportFile
    });
    
    res.json(updatedLabTest);
  } catch (error) {
    console.error('Error updating lab test results:', error);
    res.status(400).json({ 
      message: error.message || 'Error updating lab test results',
      error: error.message 
    });
  }
});

// Get a single lab test
router.get('/:id', auth, async (req, res) => {
  try {
    const labTest = await LabTest.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');
    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }
    res.json(labTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 