const scraperService = require('../services/scraperService');
const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');

// @desc    Run scraper manually
// @route   POST /api/scraper/run
// @access  Public
const runScraper = async (req, res, next) => {
  try {
    const result = await scraperService.runScraper();
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error running scraper:', error);
    next(error);
  }
};

// @desc    Get scraper status
// @route   GET /api/scraper/status
// @access  Public
const getScraperStatus = async (req, res, next) => {
  try {
    const schedulerStatus = schedulerService.getStatus();
    const todayCount = await scraperService.getTodaysBidCount();
    
    res.status(200).json({
      success: true,
      data: {
        scheduler: schedulerStatus,
        todaysBidCount: todayCount,
        isRunning: scraperService.isRunning
      }
    });
  } catch (error) {
    logger.error('Error getting scraper status:', error);
    next(error);
  }
};

// @desc    Start scheduler
// @route   POST /api/scraper/scheduler/start
// @access  Public
const startScheduler = async (req, res, next) => {
  try {
    schedulerService.start();
    
    res.status(200).json({
      success: true,
      message: 'Scheduler started'
    });
  } catch (error) {
    logger.error('Error starting scheduler:', error);
    next(error);
  }
};

// @desc    Stop scheduler
// @route   POST /api/scraper/scheduler/stop
// @access  Public
const stopScheduler = async (req, res, next) => {
  try {
    schedulerService.stop();
    
    res.status(200).json({
      success: true,
      message: 'Scheduler stopped'
    });
  } catch (error) {
    logger.error('Error stopping scheduler:', error);
    next(error);
  }
};

module.exports = {
  runScraper,
  getScraperStatus,
  startScheduler,
  stopScheduler
};