const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Middleware to check MongoDB connection before processing requests
const mongoCheck = (req, res, next) => {
  // Check if mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    logger.warn(`Database not connected for ${req.method} ${req.originalUrl}. ReadyState: ${mongoose.connection.readyState}`);
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable',
      message: 'Please check MongoDB connection'
    });
  }
  next();
};

module.exports = mongoCheck;