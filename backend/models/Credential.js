const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  portalName: {
    type: String,
    required: true,
    trim: true,
    enum: ['Metro', 'SEPTA'], // Only allow specific portal types
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    required: function() {
      // Username required for SEPTA but not for Metro
      return this.portalName === 'SEPTA';
    }
  },
  password: {
    type: String,
    required: function() {
      // Password required for SEPTA but not for Metro
      return this.portalName === 'SEPTA';
    }
  },
  isPublic: {
    type: Boolean,
    default: function() {
      // Metro is public by default, SEPTA is not
      return this.portalName === 'Metro';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to set default values based on portal type
credentialSchema.pre('save', function(next) {
  if (this.portalName === 'Metro') {
    this.isPublic = true;
    // Clear username/password for Metro since it's public
    this.username = undefined;
    this.password = undefined;
    // Set default Metro URL if not provided
    if (!this.url || this.url.trim() === '') {
      this.url = 'https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations';
    }
  } else if (this.portalName === 'SEPTA') {
    this.isPublic = false;
    // Set default SEPTA URL if not provided
    if (!this.url || this.url.trim() === '') {
      this.url = 'https://epsadmin.septa.org/vendor/requisitions/list/';
    }
  }
  next();
});

// Index for efficient queries
credentialSchema.index({ portalName: 1 });
credentialSchema.index({ isActive: 1 });

module.exports = mongoose.model('Credential', credentialSchema);