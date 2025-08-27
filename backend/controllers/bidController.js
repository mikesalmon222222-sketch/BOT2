const Bid = require('../models/Bid');
const mongoose = require('mongoose');
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');
const mockDatabase = require('../utils/mockDatabase');

// Helper function to check MongoDB connection
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// @desc    Get all bids
// @route   GET /api/bids
// @access  Public
const getAllBids = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, portal, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let bids = [];
    let total = 0;

    if (isMongoConnected()) {
      // Use MongoDB
      const query = {};
      if (portal) {
        query.portal = portal;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      bids = await Bid.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      total = await Bid.countDocuments(query);
    } else {
      // Use mock database
      logger.info('MongoDB not connected, using mock database for bids');
      let mockBids = mockDatabase.bids.find();
      
      // Filter by portal if specified
      if (portal) {
        mockBids = mockBids.filter(bid => bid.portal === portal);
      }
      
      // Sort bids
      mockBids.sort((a, b) => {
        const aValue = a[sortBy] || a.createdAt;
        const bValue = b[sortBy] || b.createdAt;
        
        if (sortOrder === 'desc') {
          return new Date(bValue) - new Date(aValue);
        } else {
          return new Date(aValue) - new Date(bValue);
        }
      });
      
      total = mockBids.length;
      
      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      bids = mockBids.slice(startIndex, endIndex);
    }

    res.status(200).json({
      success: true,
      count: bids.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bids
    });
  } catch (error) {
    logger.error('Error getting all bids:', error);
    // If it's a database connection error, return empty data instead of error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError' || error.name === 'MongooseServerSelectionError') {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(req.query.page) || 1,
        pages: 0,
        data: []
      });
    }
    next(error);
  }
};

// @desc    Get today's bid count
// @route   GET /api/bids/today
// @access  Public
const getTodaysBidCount = async (req, res, next) => {
  try {
    let count = 0;
    
    if (isMongoConnected()) {
      count = await scraperService.getTodaysBidCount();
    } else {
      // Use mock database
      logger.info('MongoDB not connected, using mock database for today\'s bid count');
      count = await scraperService.getTodaysBidCount(); // This method already handles mock database
    }
    
    res.status(200).json({
      success: true,
      data: {
        count,
        date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    logger.error('Error getting today\'s bid count:', error);
    // If it's a database connection error, return 0 instead of error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError' || error.name === 'MongooseServerSelectionError') {
      return res.status(200).json({
        success: true,
        data: {
          count: 0,
          date: new Date().toISOString().split('T')[0]
        }
      });
    }
    next(error);
  }
};

// @desc    Manual refresh bids
// @route   POST /api/bids/refresh
// @access  Public
const refreshBids = async (req, res, next) => {
  try {
    const result = await scraperService.runScraper();
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error refreshing bids:', error);
    next(error);
  }
};

// @desc    Get bid by ID
// @route   GET /api/bids/:id
// @access  Public
const getBidById = async (req, res, next) => {
  try {
    const bid = await Bid.findOne({ id: req.params.id });
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bid
    });
  } catch (error) {
    logger.error('Error getting bid by ID:', error);
    next(error);
  }
};

// @desc    Delete bid by ID
// @route   DELETE /api/bids/:id
// @access  Public
const deleteBidById = async (req, res, next) => {
  try {
    const bid = await Bid.findOneAndDelete({ id: req.params.id });
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bid deleted successfully',
      data: bid
    });
  } catch (error) {
    logger.error('Error deleting bid by ID:', error);
    next(error);
  }
};

module.exports = {
  getAllBids,
  getTodaysBidCount,
  refreshBids,
  getBidById,
  deleteBidById
};