require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to database - don't exit if it fails
connectDB()
  .then((connection) => {
    if (connection) {
      logger.info('Database connected successfully');
      // Start the scheduler only if database is connected
      schedulerService.start();
    } else {
      logger.warn('Starting server without database connection');
    }
  })
  .catch((error) => {
    logger.error('Database connection failed, starting server anyway:', error);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', err);
  // Don't exit the process - just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Don't exit the process immediately - attempt graceful shutdown
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  schedulerService.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  schedulerService.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = server;