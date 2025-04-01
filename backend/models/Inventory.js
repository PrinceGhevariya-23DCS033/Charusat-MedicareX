const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Medical Supplies', 'Medications', 'Equipment', 'Consumables', 'Other'],
      message: '{VALUE} is not a valid category'
    },
    default: 'Medical Supplies'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['pieces', 'boxes', 'bottles', 'vials', 'packs', 'units'],
      message: '{VALUE} is not a valid unit'
    },
    default: 'pieces'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 0
  },
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['In Stock', 'Low Stock', 'Out of Stock'],
      message: '{VALUE} is not a valid status'
    },
    default: 'In Stock'
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
inventorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update status based on quantity and reorder level
inventorySchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

// Update lastRestocked when quantity is increased
inventorySchema.pre('save', function(next) {
  if (this.isModified('quantity') && this.quantity > this._doc.quantity) {
    this.lastRestocked = new Date();
  }
  next();
});

// Add indexes for better query performance
inventorySchema.index({ name: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ location: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory; 