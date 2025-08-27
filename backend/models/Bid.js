const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  // Standardized date fields
  postedDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  // Legacy fields for backward compatibility (will be mapped to standardized fields)
  timestamp: {
    type: Date
  },
  expirationDate: {
    type: Date
  },
  title: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  documents: [{
    type: String
  }],
  bidLink: {
    type: String,
    required: false
  },
  portal: {
    type: String,
    required: true,
    default: 'metro'
  }
}, {
  timestamps: true
});

// Index for efficient queries
bidSchema.index({ postedDate: -1 });
bidSchema.index({ dueDate: -1 });
bidSchema.index({ timestamp: -1 }); // Keep for backward compatibility
bidSchema.index({ portal: 1 });
bidSchema.index({ createdAt: -1 });

// Virtual field to ensure backward compatibility
bidSchema.virtual('displayPostedDate').get(function() {
  return this.postedDate || this.timestamp;
});

bidSchema.virtual('displayDueDate').get(function() {
  return this.dueDate || this.expirationDate;
});

// Pre-save middleware to normalize fields
bidSchema.pre('save', function(next) {
  // Map legacy fields to standardized fields if they exist
  if (this.timestamp && !this.postedDate) {
    this.postedDate = this.timestamp;
  }
  if (this.expirationDate && !this.dueDate) {
    this.dueDate = this.expirationDate;
  }
  next();
});

module.exports = mongoose.model('Bid', bidSchema);