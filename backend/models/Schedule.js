const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  workingDays: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    isWorking: {
      type: Boolean,
      default: true
    },
    startTime: {
      type: String,
      required: function() {
        return this.isWorking;
      }
    },
    endTime: {
      type: String,
      required: function() {
        return this.isWorking;
      }
    },
    breakStart: {
      type: String
    },
    breakEnd: {
      type: String
    }
  }],
  appointmentDuration: {
    type: Number,
    default: 15, // Duration in minutes
    required: true
  },
  maxAppointmentsPerDay: {
    type: Number,
    default: 20,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
scheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema); 