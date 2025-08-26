const cron = require('node-cron');
const scraperService = require('./scraperService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.isRunning = false;
  }

  start() {
    // Schedule scraper to run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      if (this.isRunning) {
        logger.info('Scraper is already running, skipping this cycle');
        return;
      }

      try {
        this.isRunning = true;
        logger.info('Scheduled scraper execution started');
        await scraperService.scrapeBids();
        logger.info('Scheduled scraper execution completed');
      } catch (error) {
        logger.error('Scheduled scraper execution failed:', error.message);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info('Scheduler started - scraper will run every 15 minutes');
  }

  async runManual() {
    if (this.isRunning) {
      throw new Error('Scraper is already running');
    }

    try {
      this.isRunning = true;
      logger.info('Manual scraper execution started');
      const result = await scraperService.scrapeBids();
      logger.info('Manual scraper execution completed');
      return result;
    } catch (error) {
      logger.error('Manual scraper execution failed:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: 'Every 15 minutes'
    };
  }
}

module.exports = new SchedulerService();