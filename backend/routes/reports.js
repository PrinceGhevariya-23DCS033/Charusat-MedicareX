const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Inventory = require('../models/Inventory');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to generate PDF
async function generatePDF(report) {
  const doc = new PDFDocument();
  const filename = `report-${report._id}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    doc.pipe(writeStream);

    // Add hospital logo or name
    doc.fontSize(20).text('CHARUSAT', { align: 'center' });
    doc.moveDown();

    // Add report title
    doc.fontSize(16).text(report.name || `${report.type.toUpperCase()} Report`, { align: 'center' });
    doc.moveDown();

    // Add report metadata
    doc.fontSize(12);
    doc.text(`Type: ${report.type.charAt(0).toUpperCase() + report.type.slice(1)}`);
    doc.text(`Department: ${report.department || 'All Departments'}`);
    doc.text(`Period: ${moment(report.startDate).format('DD/MM/YYYY')} - ${moment(report.endDate).format('DD/MM/YYYY')}`);
    doc.moveDown();

    // Add report data based on type
    doc.fontSize(14).text('Report Data', { underline: true });
    doc.moveDown();
    
    if (report.data) {
      switch (report.type) {
        case 'revenue':
          doc.text('Revenue Summary:');
          doc.text(`Total Revenue: ₹${report.data.totalRevenue.toFixed(2)}`);
          doc.text(`Paid Amount: ₹${report.data.paidAmount.toFixed(2)}`);
          doc.text(`Pending Amount: ₹${report.data.pendingAmount.toFixed(2)}`);
          doc.moveDown();
          doc.text('Payment Methods:');
          Object.entries(report.data.byPaymentMethod || {}).forEach(([method, amount]) => {
            doc.text(`${method.toUpperCase()}: ₹${amount.toFixed(2)}`);
          });
          break;

        case 'appointments':
          doc.text('Appointment Statistics:');
          doc.text(`Total Appointments: ${report.data.total}`);
          doc.moveDown();
          doc.text('Status Breakdown:');
          report.data.byStatus.forEach(status => {
            doc.text(`${status.status}: ${status.count}`);
          });
          doc.moveDown();
          if (report.data.byDepartment) {
            doc.text('Department Breakdown:');
            report.data.byDepartment.forEach(dept => {
              doc.text(`${dept.department}: ${dept.count}`);
            });
          }
          break;

        case 'inventory':
          doc.text('Inventory Summary:');
          doc.text(`Total Items: ${report.data.totalItems}`);
          doc.text(`Total Value: ₹${report.data.totalValue.toFixed(2)}`);
          doc.text(`Low Stock Items: ${report.data.lowStockItems}`);
          doc.moveDown();
          if (report.data.categories) {
            doc.text('Category Breakdown:');
            report.data.categories.forEach(cat => {
              doc.text(`${cat.name}:`);
              doc.text(`  Items: ${cat.items}, Value: ₹${cat.value.toFixed(2)}`);
            });
          }
          break;

        case 'staff':
          doc.text('Staff Summary:');
          doc.text(`Total Staff: ${report.data.totalStaff}`);
          doc.moveDown();
          if (report.data.byDepartment) {
            doc.text('Department Breakdown:');
            report.data.byDepartment.forEach(dept => {
              doc.text(`${dept.name}: ${dept.count} staff`);
              doc.text(`  Morning: ${dept.shifts.morning || 0}`);
              doc.text(`  Afternoon: ${dept.shifts.afternoon || 0}`);
              doc.text(`  Night: ${dept.shifts.night || 0}`);
            });
          }
          break;
      }
    }

    // Add footer
    doc.moveDown(2);
    doc.fontSize(10).text(`Generated on: ${moment().format('DD/MM/YYYY, h:mm A')}`, { align: 'right' });

    // Finalize the PDF
    doc.end();

    writeStream.on('finish', () => {
      resolve({
        filename,
        filePath,
        fileSize: fs.statSync(filePath).size
      });
    });

    writeStream.on('error', reject);
  });
}

// Get all reports (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    const reports = await Report.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// Get recent reports
router.get('/recent', auth, async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    res.status(500).json({ error: 'Error fetching recent reports' });
  }
});

// Get scheduled reports
router.get('/scheduled', auth, async (req, res) => {
  try {
    const reports = await Report.find({ 
      createdBy: req.user._id,
      isScheduled: true,
      status: { $ne: 'completed' }
    }).sort({ nextRunDate: 1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({ error: 'Error fetching scheduled reports' });
  }
});

// Get report statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [totalReports, scheduledReports, totalDownloads] = await Promise.all([
      Report.countDocuments({ createdBy: req.user._id }),
      Report.countDocuments({ createdBy: req.user._id, isScheduled: true }),
      Report.aggregate([
        { $match: { createdBy: req.user._id } },
        { $group: { _id: null, total: { $sum: '$downloadCount' } } }
      ])
    ]);

    // Calculate total storage used
    const reports = await Report.find({ createdBy: req.user._id });
    const storageUsed = reports.reduce((total, report) => total + (report.fileSize || 0), 0);
    const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(2);

    res.json({
      totalReports,
      scheduledReports,
      totalDownloads: totalDownloads[0]?.total || 0,
      storageUsed: `${storageUsedMB} MB`
    });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({ error: 'Error fetching report statistics' });
  }
});

// Generate report
router.post('/', auth, async (req, res) => {
  console.log('\n=== Report Generation Request ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  try {
    const { type, department, startDate, endDate, format, isScheduled, frequency } = req.body;

    // Validate required fields
    if (!type || !startDate || !endDate) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate report type
    const validTypes = ['revenue', 'appointments', 'inventory', 'staff'];
    if (!validTypes.includes(type)) {
      console.log('Validation failed: Invalid report type');
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('Validation failed: Invalid date format');
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (start > end) {
      console.log('Validation failed: Start date after end date');
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Validate format
    const validFormats = ['pdf', 'excel', 'csv'];
    if (format && !validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid report format' });
    }

    // Validate frequency if scheduled
    if (isScheduled) {
      const validFrequencies = ['daily', 'weekly', 'monthly'];
      if (!frequency || !validFrequencies.includes(frequency.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid schedule frequency' });
    }
    }

    console.log('Generating report data...');
    // Generate report data
    let reportData;
    try {
      reportData = await generateReportData(type, department, start, end);
      console.log('Report data generated successfully');
    } catch (error) {
      console.error('Error generating report data:', error);
      return res.status(500).json({ 
        error: 'Failed to generate report data',
        details: error.message 
      });
    }
    
    console.log('Creating report record...');
    // Create report record
    const report = new Report({
      type,
      department,
      startDate: start,
      endDate: end,
      format: (format || 'pdf').toLowerCase(),
      isScheduled: isScheduled || false,
      frequency: (frequency || 'daily').toLowerCase(),
      status: 'pending',
      generatedBy: req.user._id,
      data: reportData
    });

    try {
    await report.save();
      console.log('Report record saved successfully');
    } catch (error) {
      console.error('Error saving report:', error);
      return res.status(500).json({ 
        error: 'Failed to save report',
        details: error.message 
      });
    }

    console.log('Starting report file generation...');
    // Generate report file in background
    generateReportFile(reportData, format, report._id)
      .then(async (filePath) => {
        try {
          console.log('Report file generated successfully');
    report.filePath = filePath;
    report.status = 'completed';
    await report.save();
          console.log('Report status updated to completed');
        } catch (error) {
          console.error('Error updating report status:', error);
        }
      })
      .catch(async (error) => {
        console.error('Error generating report file:', error);
        try {
          report.status = 'failed';
          report.error = error.message;
          await report.save();
          console.log('Report status updated to failed');
        } catch (saveError) {
          console.error('Error saving failed report status:', saveError);
        }
      });

    console.log('Sending response...');
    res.status(201).json({ 
      message: 'Report generation started',
      report: {
        _id: report._id,
        type: report.type,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Unexpected error in report generation:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Download report
router.get('/:id/download', auth, async (req, res) => {
  try {
    console.log('Downloading report:', req.params.id);
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    // Update download count
    report.downloads = (report.downloads || 0) + 1;
    await report.save();

    // Set appropriate headers
    const contentType = report.format === 'pdf' ? 'application/pdf' : 
                       report.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                       'text/csv';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.${report.format}`);

    // Stream the file
    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Error downloading report', details: error.message });
  }
});

// Helper function to generate report data
async function generateReportData(type, department, startDate, endDate) {
  try {
    let data = {};
    const matchCondition = department ? { department } : {};

    switch (type) {
      case 'revenue':
        const billsMatch = {
          createdAt: { $gte: startDate, $lte: endDate },
          ...matchCondition
        };

        const billsData = await Bill.aggregate([
          { $match: billsMatch },
          { $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
              }
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            }
          }},
          { $project: {
            _id: 0,
            totalRevenue: 1,
            paidAmount: 1,
            pendingAmount: 1
          }}
        ]);

        data = billsData[0] || { totalRevenue: 0, paidAmount: 0, pendingAmount: 0 };

        // Add payment method breakdown
        const paymentMethodData = await Bill.aggregate([
          { $match: billsMatch },
          { $group: {
            _id: '$paymentMethod',
            amount: { $sum: '$amount' }
          }}
        ]);

        data.byPaymentMethod = paymentMethodData.reduce((acc, { _id, amount }) => {
          acc[_id] = amount;
          return acc;
        }, {});
        break;

      case 'appointments':
        const appointmentsMatch = {
          date: { $gte: startDate, $lte: endDate },
          ...matchCondition
        };

        const appointmentsData = await Appointment.aggregate([
          { $match: appointmentsMatch },
          { $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            }
          }},
          { $project: {
            _id: 0,
            total: 1,
            byStatus: 1
          }}
        ]);

        data = appointmentsData[0] || { total: 0, byStatus: [] };

        // Add department breakdown if no specific department
        if (!department) {
          const deptData = await Appointment.aggregate([
            { $match: appointmentsMatch },
            { $group: {
              _id: '$department',
              count: { $sum: 1 }
            }},
            { $project: {
              department: '$_id',
              count: 1,
              _id: 0
            }}
          ]);
          data.byDepartment = deptData;
        }
        break;

      case 'inventory':
        try {
          // Get basic inventory stats
        const inventoryData = await Inventory.aggregate([
          { $match: matchCondition },
          { $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
            lowStockItems: {
              $sum: {
                $cond: [{ $lt: ['$quantity', '$reorderLevel'] }, 1, 0]
              }
              },
              outOfStockItems: {
                $sum: {
                  $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
                }
            }
          }},
          { $project: {
            _id: 0,
            totalItems: 1,
            totalValue: 1,
              lowStockItems: 1,
              outOfStockItems: 1
          }}
        ]);

          data = inventoryData[0] || { 
            totalItems: 0, 
            totalValue: 0, 
            lowStockItems: 0,
            outOfStockItems: 0
          };

          // Get category breakdown
        const categoryData = await Inventory.aggregate([
          { $match: matchCondition },
          { $group: {
            _id: '$category',
            items: { $sum: 1 },
              value: { $sum: { $multiply: ['$price', '$quantity'] } },
              lowStock: {
                $sum: {
                  $cond: [{ $lt: ['$quantity', '$reorderLevel'] }, 1, 0]
                }
              },
              outOfStock: {
                $sum: {
                  $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
                }
              }
          }},
          { $project: {
            name: '$_id',
            items: 1,
            value: 1,
              lowStock: 1,
              outOfStock: 1,
            _id: 0
          }}
        ]);

        data.categories = categoryData;

          // Get low stock items list
          const lowStockItems = await Inventory.find({
            ...matchCondition,
            quantity: { $lt: '$reorderLevel' }
          }).select('name category quantity reorderLevel price');

          data.lowStockItemsList = lowStockItems;

          // Get out of stock items list
          const outOfStockItems = await Inventory.find({
            ...matchCondition,
            quantity: 0
          }).select('name category price');

          data.outOfStockItemsList = outOfStockItems;

          // Get recent inventory changes
          const recentChanges = await Inventory.find({
            ...matchCondition,
            updatedAt: { $gte: startDate, $lte: endDate }
          })
          .sort({ updatedAt: -1 })
          .limit(10)
          .select('name category quantity price updatedAt');

          data.recentChanges = recentChanges;

        } catch (error) {
          console.error('Error generating inventory report:', error);
          throw new Error('Failed to generate inventory report data');
        }
        break;

      case 'staff':
        const staffData = await User.aggregate([
          { $match: { role: 'staff', ...matchCondition } },
          { $group: {
            _id: '$department',
            count: { $sum: 1 },
            shifts: {
              $push: '$shift'
            }
          }},
          { $project: {
            name: '$_id',
            count: 1,
            shifts: {
              morning: {
                $size: {
                  $filter: {
                    input: '$shifts',
                    as: 'shift',
                    cond: { $eq: ['$$shift', 'morning'] }
                  }
                }
              },
              afternoon: {
                $size: {
                  $filter: {
                    input: '$shifts',
                    as: 'shift',
                    cond: { $eq: ['$$shift', 'afternoon'] }
                  }
                }
              },
              night: {
                $size: {
                  $filter: {
                    input: '$shifts',
                    as: 'shift',
                    cond: { $eq: ['$$shift', 'night'] }
                  }
                }
              }
            },
            _id: 0
          }}
        ]);

        data = {
          totalStaff: staffData.reduce((sum, dept) => sum + dept.count, 0),
          byDepartment: staffData
        };
        break;
    }

    return data;
  } catch (error) {
    console.error('Error generating report data:', error);
    throw error;
  }
}

// Helper function to generate report file
async function generateReportFile(data, format, reportId) {
  try {
    const report = {
      _id: reportId,
      name: `Report ${reportId}`,
      type: 'revenue',
      data: data
    };

    const { filePath } = await generatePDF(report);
    return filePath;
  } catch (error) {
    console.error('Error generating report file:', error);
    throw error;
  }
}

// Delete report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Error deleting report' });
  }
});

// Cancel scheduled report
router.delete('/scheduled/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!report.isScheduled) {
      return res.status(400).json({ error: 'This is not a scheduled report' });
    }

    report.isScheduled = false;
    report.status = 'cancelled';
    await report.save();

    res.json({ message: 'Scheduled report cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling scheduled report:', error);
    res.status(500).json({ error: 'Error cancelling scheduled report' });
  }
});

module.exports = router; 