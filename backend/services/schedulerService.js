const cron = require('node-cron');
const scraperService = require('./scraperService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.task = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    // Schedule to run every 15 minutes
    this.task = cron.schedule('*/15 * * * *', async () => {
      logger.info('Scheduled scraper task starting...');
      try {
        await scraperService.runScraper();
      } catch (error) {
        logger.error('Scheduled scraper task failed:', error);
      }
    }, {
      scheduled: false
    });

    this.task.start();
    this.isRunning = true;
    
    logger.info('Scheduler started - will run every 15 minutes');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: 'Every 15 minutes'
    };
  }

  // Run scraper immediately (for manual triggers)
  async runNow() {
    logger.info('Manual scraper trigger initiated');
    return await scraperService.runScraper();
  }
}

module.exports = new SchedulerService();