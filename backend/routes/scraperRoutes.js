const express = require('express');
const router = express.Router();
const {
  runScraper,
  getScraperStatus
} = require('../controllers/scraperController');

router.route('/run').post(runScraper);
router.route('/status').get(getScraperStatus);

module.exports = router;