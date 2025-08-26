const express = require('express');
const {
  runScraper,
  getScraperStatus,
  startScheduler,
  stopScheduler
} = require('../controllers/scraperController');

const router = express.Router();

router.route('/run')
  .post(runScraper);

router.route('/status')
  .get(getScraperStatus);

router.route('/scheduler/start')
  .post(startScheduler);

router.route('/scheduler/stop')
  .post(stopScheduler);

module.exports = router;