const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');

// @desc    Run scraper manually
// @route   POST /api/scraper/run
// @access  Public
exports.runScraper = async (req, res, next) => {
  try {
    const result = await schedulerService.runManual();
    
    res.status(200).json({
      success: true,
      message: 'Scraper executed successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    logger.error('Error running scraper:', error.message);
    
    if (error.message === 'Scraper is already running') {
      return res.status(409).json({
        success: false,
        error: 'Scraper is already running, please wait'
      });
    }
    
    next(error);
  }
};

// @desc    Get scraper status
// @route   GET /api/scraper/status
// @access  Public
exports.getScraperStatus = async (req, res, next) => {
  try {
    const status = schedulerService.getStatus();
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting scraper status:', error.message);
    next(error);
  }
};