const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    default: function() {
      return `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Report - ${new Date().toLocaleDateString()}`;
    }
  },
  type: {
    type: String,
    enum: ['revenue', 'appointments', 'inventory', 'staff'],
    required: true
  },
  department: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv'],
    default: 'pdf'
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  nextRunDate: Date,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  error: String,
  filePath: String,
  filename: String,
  fileSize: Number,
  downloads: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Pre-save hook to set nextRunDate for scheduled reports
reportSchema.pre('save', function(next) {
  if (this.isScheduled && !this.nextRunDate) {
    const now = new Date();
    switch (this.frequency) {
      case 'daily':
        this.nextRunDate = new Date(now.setDate(now.getDate() + 1));
        break;
      case 'weekly':
        this.nextRunDate = new Date(now.setDate(now.getDate() + 7));
        break;
      case 'monthly':
        this.nextRunDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
    }
  }
  this.updatedAt = new Date();
  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 