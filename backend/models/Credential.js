const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  portalName: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  password: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
credentialSchema.index({ portalName: 1 });
credentialSchema.index({ isActive: 1 });

module.exports = mongoose.model('Credential', credentialSchema);