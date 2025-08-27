const Bid = require('../models/Bid');
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

// @desc    Get all bids
// @route   GET /api/bids
// @access  Public
const getAllBids = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, portal, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (portal) {
      query.portal = portal;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bids = await Bid.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bid.countDocuments(query);

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
    next(error);
  }
};

// @desc    Get today's bid count
// @route   GET /api/bids/today
// @access  Public
const getTodaysBidCount = async (req, res, next) => {
  try {
    const count = await scraperService.getTodaysBidCount();
    
    res.status(200).json({
      success: true,
      data: {
        count,
        date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    logger.error('Error getting today\'s bid count:', error);
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