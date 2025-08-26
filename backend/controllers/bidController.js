const Bid = require('../models/Bid');
const logger = require('../utils/logger');

// @desc    Get all bids
// @route   GET /api/bids
// @access  Public
exports.getAllBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({}).sort({ timestamp: -1 });
    
    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    logger.error('Error fetching bids:', error.message);
    next(error);
  }
};

// @desc    Get today's bid count
// @route   GET /api/bids/today
// @access  Public
exports.getTodaysBidCount = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const count = await Bid.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    res.status(200).json({
      success: true,
      count: count,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    logger.error('Error fetching today\'s bid count:', error.message);
    next(error);
  }
};

// @desc    Manual refresh bids
// @route   POST /api/bids/refresh
// @access  Public
exports.refreshBids = async (req, res, next) => {
  try {
    const schedulerService = require('../services/schedulerService');
    const newBids = await schedulerService.runManual();
    
    res.status(200).json({
      success: true,
      message: 'Bids refreshed successfully',
      count: newBids.length,
      data: newBids
    });
  } catch (error) {
    logger.error('Error refreshing bids:', error.message);
    
    if (error.message === 'Scraper is already running') {
      return res.status(409).json({
        success: false,
        error: 'Scraper is already running, please wait'
      });
    }
    
    next(error);
  }
};