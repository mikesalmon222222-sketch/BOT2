const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
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
  portal: {
    type: String,
    required: true,
    default: 'metro'
  }
}, {
  timestamps: true
});

// Index for efficient queries
bidSchema.index({ timestamp: -1 });
bidSchema.index({ portal: 1 });
bidSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);