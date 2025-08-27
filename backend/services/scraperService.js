const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Credential = require('../models/Credential');
const logger = require('../utils/logger');

class ScraperService {
  constructor() {
    this.browser = null;
    this.isRunning = false;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeMetroPortal(credential) {
    const url = credential?.url || 'https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations';
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      logger.info('Navigating to Metro portal...');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for the table to load
      await page.waitForSelector('table', { timeout: 30000 });

      logger.info('Extracting bid data...');
      const bids = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        const extractedBids = [];
        
        rows.forEach((row, index) => {
          try {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
              // Extract bid link (original portal URL)
              let bidLink = window.location.href; // Default to current page
              const linkElement = row.querySelector('a[href]');
              if (linkElement) {
                const href = linkElement.getAttribute('href');
                bidLink = href.startsWith('http') ? href : `https://business.metro.net${href}`;
              }
              
              // Normalize date fields to standardized format
              const postedDate = new Date().toISOString(); // Use current time as posted date
              let dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 30); // Default 30 days from now
              
              // Try to extract actual due date from table
              const firstCellText = cells[0]?.textContent?.trim();
              if (firstCellText && firstCellText.includes('/')) {
                const dateMatch = firstCellText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                if (dateMatch) {
                  dueDate = new Date(dateMatch[1]);
                }
              }
              
              // Extract title (usually in second or third column)
              const title = cells[1]?.textContent?.trim() || cells[2]?.textContent?.trim() || `Metro Solicitation ${index + 1}`;
              
              // Extract quantity (look for patterns)
              let quantity = '1 unit';
              for (let cell of cells) {
                const cellText = cell.textContent?.trim();
                if (cellText && (cellText.includes('qty') || cellText.includes('quantity') || cellText.match(/\d+\s*(units?|pcs?|items?)/i))) {
                  quantity = cellText;
                  break;
                }
              }
              
              // Extract description (combine relevant cells)
              const description = Array.from(cells).map(cell => cell.textContent?.trim()).filter(text => text && text.length > 10).join(' - ').substring(0, 500);
              
              // Extract documents (look for links)
              const documents = [];
              row.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.includes('.pdf') || href.includes('document') || href.includes('doc'))) {
                  documents.push(href.startsWith('http') ? href : `https://business.metro.net${href}`);
                }
              });
              
              extractedBids.push({
                id: `metro_${Date.now()}_${index}`,
                // Standardized fields
                postedDate,
                dueDate: dueDate.toISOString(),
                // Legacy fields for backward compatibility
                timestamp: postedDate,
                expirationDate: dueDate.toISOString(),
                title,
                quantity,
                description: description || `Metro solicitation for ${title}`,
                documents,
                bidLink,
                portal: 'metro'
              });
            }
          } catch (error) {
            console.error('Error processing row:', error);
          }
        });
        
        return extractedBids;
      });

      await page.close();
      
      logger.info(`Extracted ${bids.length} bids from Metro portal`);
      return bids;
      
    } catch (error) {
      logger.error('Error scraping Metro portal:', error);
      throw error;
    }
  }

  async scrapeSEPTAPortal(credential) {
    if (!credential.username || !credential.password) {
      throw new Error('SEPTA portal requires valid credentials');
    }

    const url = credential.url || 'https://epsadmin.septa.org/vendor/requisitions/list/';
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      logger.info('Navigating to SEPTA portal...');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Login process
      logger.info('Attempting to login to SEPTA portal...');
      
      // Wait for login form
      await page.waitForSelector('input[name="username"], input[type="text"]', { timeout: 10000 });
      
      // Fill in credentials
      await page.type('input[name="username"], input[type="text"]', credential.username);
      await page.type('input[name="password"], input[type="password"]', credential.password);
      
      // Submit login form
      await page.click('input[type="submit"], button[type="submit"]');
      
      // Wait for login to complete (adjust selector based on actual SEPTA portal)
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      logger.info('Login successful, extracting bid data...');
      
      // Extract bids (this would need to be customized based on SEPTA's actual structure)
      const bids = await page.evaluate(() => {
        // This is a placeholder - would need to be customized for SEPTA's actual HTML structure
        const rows = document.querySelectorAll('table tbody tr, .bid-row, .requisition-row');
        const extractedBids = [];
        
        rows.forEach((row, index) => {
          try {
            // Extract bid information - customize based on SEPTA's structure
            const titleElement = row.querySelector('td:nth-child(1), .title, .name');
            const dateElement = row.querySelector('td:nth-child(2), .date, .posted-date');
            const dueDateElement = row.querySelector('td:nth-child(3), .due-date, .closing-date');
            const linkElement = row.querySelector('a');
            
            if (titleElement) {
              const bid = {
                id: `septa_${Date.now()}_${index}`,
                title: titleElement.textContent.trim(),
                postedDate: dateElement ? dateElement.textContent.trim() : new Date().toISOString(),
                dueDate: dueDateElement ? dueDateElement.textContent.trim() : new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                quantity: 'N/A',
                description: titleElement.textContent.trim(),
                documents: [],
                bidLink: linkElement ? linkElement.href : '',
                portal: 'septa'
              };
              
              extractedBids.push(bid);
            }
          } catch (error) {
            console.error('Error extracting bid data from row:', error);
          }
        });
        
        return extractedBids;
      });

      await page.close();
      
      logger.info(`Extracted ${bids.length} bids from SEPTA portal`);
      return bids;
      
    } catch (error) {
      logger.error('Error scraping SEPTA portal:', error);
      throw error;
    }
  }

  async saveBids(bids) {
    const savedBids = [];
    
    for (const bidData of bids) {
      try {
        // Check if bid already exists
        const existingBid = await Bid.findOne({ id: bidData.id });
        
        if (!existingBid) {
          const bid = new Bid(bidData);
          await bid.save();
          savedBids.push(bid);
          logger.info(`Saved new bid: ${bidData.title}`);
        } else {
          logger.debug(`Bid already exists: ${bidData.title}`);
        }
      } catch (error) {
        logger.error('Error saving bid:', error);
      }
    }
    
    return savedBids;
  }

  async runScraper() {
    if (this.isRunning) {
      logger.warn('Scraper is already running');
      return { success: false, message: 'Scraper is already running' };
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Cannot run scraper: MongoDB not connected');
      return {
        success: false,
        message: 'Database connection unavailable. Cannot run scraper.',
        newBids: 0,
        totalBids: 0
      };
    }

    this.isRunning = true;
    
    try {
      logger.info('Starting scraper...');
      
      // Get active credentials
      const credentials = await Credential.find({ isActive: true });
      logger.info(`Found ${credentials.length} active credentials`);

      // Only scrape if there are active credentials
      if (credentials.length === 0) {
        logger.warn('No active credentials found. Scraping skipped.');
        return {
          success: false,
          message: 'No active credentials found. Please add and activate portal credentials to enable scraping.',
          newBids: 0,
          totalBids: 0
        };
      }

      // Scrape from all configured portals
      let allBids = [];
      
      for (const credential of credentials) {
        try {
          let portalBids = [];
          
          if (credential.portalName === 'Metro') {
            logger.info('Scraping Metro portal...');
            portalBids = await this.scrapeMetroPortal(credential);
          } else if (credential.portalName === 'SEPTA') {
            logger.info('Scraping SEPTA portal...');
            portalBids = await this.scrapeSEPTAPortal(credential);
          } else {
            logger.warn(`Unknown portal type: ${credential.portalName}`);
            continue;
          }
          
          allBids = allBids.concat(portalBids);
          logger.info(`Scraped ${portalBids.length} bids from ${credential.portalName} portal`);
          
        } catch (error) {
          logger.error(`Error scraping ${credential.portalName} portal:`, error);
          // Continue with other portals even if one fails
        }
      }

      const savedBids = await this.saveBids(allBids);
      
      logger.info(`Scraper completed. Saved ${savedBids.length} new bids`);
      
      return {
        success: true,
        message: `Scraper completed successfully`,
        newBids: savedBids.length,
        totalBids: allBids.length
      };
      
    } catch (error) {
      logger.error('Scraper failed:', error);
      return {
        success: false,
        message: 'Scraper failed: ' + error.message,
        newBids: 0,
        totalBids: 0
      };
    } finally {
      this.isRunning = false;
      await this.closeBrowser();
    }
  }

  async getTodaysBidCount() {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        logger.warn('Cannot get today\'s bid count: MongoDB not connected');
        return 0;
      }

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

      return count;
    } catch (error) {
      logger.error('Error getting today\'s bid count:', error);
      return 0;
    }
  }
}

module.exports = new ScraperService();