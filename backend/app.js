const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route files
const bidRoutes = require('./routes/bidRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const scraperRoutes = require('./routes/scraperRoutes');

const app = express();

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// API routes
app.use('/api/bids', bidRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/scraper', scraperRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bid Scraper API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;