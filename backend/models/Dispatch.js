const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: [true, 'Item is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: {
      values: ['Emergency', 'OPD', 'Ward', 'Operation Theater', 'Laboratory', 'Pharmacy', 'Other'],
      message: '{VALUE} is not a valid department'
    }
  },
  issuedTo: {
    type: String,
    required: [true, 'Issued to is required'],
    trim: true
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issuer is required']
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Approved', 'Rejected', 'Completed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
dispatchSchema.index({ item: 1 });
dispatchSchema.index({ department: 1 });
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ issuedBy: 1 });

const Dispatch = mongoose.model('Dispatch', dispatchSchema);

module.exports = Dispatch; 