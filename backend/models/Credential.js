const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  portalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: function() {
      return !this.isPublic;
    }
  },
  password: {
    type: String,
    required: function() {
      return !this.isPublic;
    }
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

module.exports = mongoose.model('Credential', credentialSchema);