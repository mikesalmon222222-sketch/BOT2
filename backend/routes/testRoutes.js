const express = require('express');
const router = express.Router();
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

// @desc    Test SEPTA scraper with hardcoded credentials
// @route   GET /api/test-septa-scraper
// @access  Public
const testSeptaScraper = async (req, res, next) => {
  try {
    logger.info('Testing SEPTA scraper with hardcoded test credentials...');
    
    // Hardcoded test credentials as specified in requirements
    const testCredentials = {
      portalName: 'SEPTA',
      url: 'https://epsadmin.septa.org/vendor/requisitions/list/',
      username: 'JoeRoot',
      password: 'Quan999999',
      isActive: true
    };

    // Test the SEPTA scraper directly
    const results = await scraperService.scrapeSEPTAPortal(testCredentials);
    
    res.status(200).json({
      success: true,
      message: 'SEPTA scraper test completed',
      testCredentials: {
        username: testCredentials.username,
        portal: testCredentials.portalName,
        url: testCredentials.url
      },
      results: {
        bidsFound: results.length,
        bids: results,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error testing SEPTA scraper:', error);
    
    res.status(500).json({
      success: false,
      message: 'SEPTA scraper test failed',
      error: error.message,
      testCredentials: {
        username: 'JoeRoot',
        portal: 'SEPTA',
        url: 'https://epsadmin.septa.org/vendor/requisitions/list/'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Mount the test route
router.get('/test-septa-scraper', testSeptaScraper);

module.exports = router;