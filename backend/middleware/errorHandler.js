const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error:', err.message, err.stack);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError' || err.name === 'MongooseServerSelectionError') {
    const message = 'Database connection unavailable';
    error = { message, status: 503 };
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, status: 400 };
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;