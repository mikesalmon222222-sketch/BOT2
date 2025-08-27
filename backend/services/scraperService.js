const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Credential = require('../models/Credential');
const logger = require('../utils/logger');
const mockDatabase = require('../utils/mockDatabase');

class ScraperService {
  constructor() {
    this.browser = null;
    this.isRunning = false;
  }

  // Helper function to check if MongoDB is connected
  isMongoConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Helper function to filter bids for today and onward only
  filterBidsFromToday(bids) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    return bids.filter(bid => {
      try {
        const bidDate = new Date(bid.postedDate);
        return bidDate >= today;
      } catch (error) {
        logger.warn(`Invalid date format for bid ${bid.id}: ${bid.postedDate}`);
        return false; // Exclude bids with invalid dates
      }
    });
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
      
      // Set user agent and viewport for better compatibility
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Enable request interception to handle network issues gracefully
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'image') {
          req.abort();
        } else {
          req.continue();
        }
      });

      logger.info(`Navigating to SEPTA portal: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Take screenshot for debugging (if needed)
      // await page.screenshot({ path: '/tmp/septa-login.png' });

      // Enhanced login process with multiple selector strategies
      logger.info('Attempting to login to SEPTA portal...');
      
      try {
        // Wait for login form with multiple possible selectors
        await page.waitForSelector('input[name="username"], input[name="user"], input[type="text"], #username, #user', { timeout: 15000 });
        
        // Find and fill username field
        const usernameField = await page.$('input[name="username"]') || 
                             await page.$('input[name="user"]') || 
                             await page.$('#username') || 
                             await page.$('#user') ||
                             await page.$('input[type="text"]');
                             
        if (!usernameField) {
          throw new Error('Could not find username field on SEPTA login page');
        }
        
        await usernameField.click();
        await usernameField.type(credential.username, { delay: 100 });
        logger.info(`Filled username: ${credential.username}`);
        
        // Find and fill password field
        const passwordField = await page.$('input[name="password"]') || 
                             await page.$('input[type="password"]') ||
                             await page.$('#password');
                             
        if (!passwordField) {
          throw new Error('Could not find password field on SEPTA login page');
        }
        
        await passwordField.click();
        await passwordField.type(credential.password, { delay: 100 });
        logger.info('Filled password');
        
        // Find and click submit button
        const submitButton = await page.$('input[type="submit"]') || 
                            await page.$('button[type="submit"]') ||
                            await page.$('#login') ||
                            await page.$('.login-button') ||
                            await page.$('input[value*="Login"]') ||
                            await page.$('button[value*="Login"]');
                            
        if (!submitButton) {
          throw new Error('Could not find login submit button on SEPTA page');
        }
        
        // Click submit and wait for navigation
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
          submitButton.click()
        ]);
        
        logger.info('Login form submitted, checking for successful authentication...');
        
        // Check if login was successful by looking for common post-login elements
        const loginSuccess = await page.evaluate(() => {
          // Look for indicators that we're logged in
          const indicators = [
            () => document.querySelector('a[href*="logout"]'),
            () => document.querySelector('.logout'),
            () => document.querySelector('[href*="logout"]'),
            () => document.title.toLowerCase().includes('dashboard'),
            () => document.title.toLowerCase().includes('requisition'),
            () => document.body.innerText.toLowerCase().includes('welcome'),
            () => !document.body.innerText.toLowerCase().includes('invalid username'),
            () => !document.body.innerText.toLowerCase().includes('invalid password'),
            () => !document.body.innerText.toLowerCase().includes('login failed')
          ];
          
          return indicators.some(check => check());
        });
        
        if (!loginSuccess) {
          throw new Error('SEPTA login failed. Please check username and password.');
        }
        
        logger.info('SEPTA login successful, extracting bid data...');
        
      } catch (loginError) {
        logger.error('SEPTA login error:', loginError.message);
        throw new Error(`SEPTA login failed: ${loginError.message}`);
      }
      
      // Enhanced bid extraction with multiple strategies
      const bids = await page.evaluate(() => {
        const extractedBids = [];
        
        // Strategy 1: Look for table rows
        const tableRows = document.querySelectorAll('table tbody tr, table tr');
        
        // Strategy 2: Look for div-based listings  
        const divRows = document.querySelectorAll('.requisition-row, .bid-row, .solicitation-row, .rfp-row');
        
        // Strategy 3: Look for list items
        const listItems = document.querySelectorAll('ul li, ol li');
        
        // Combine all potential bid containers
        const allRows = [...tableRows, ...divRows, ...listItems];
        
        allRows.forEach((row, index) => {
          try {
            // Multiple strategies to extract title
            const titleElement = row.querySelector('td:nth-child(1), td:nth-child(2), .title, .name, .description, .requisition-title, a[href*="requisition"], a[href*="bid"]') ||
                                row.querySelector('td:first-child, .first-col') ||
                                row.querySelector('h3, h4, h5, strong, b');
            
            if (!titleElement || !titleElement.textContent.trim()) {
              return; // Skip if no title found
            }
            
            const title = titleElement.textContent.trim();
            
            // Skip header rows and non-bid content
            if (title.toLowerCase().includes('requisition') && title.toLowerCase().includes('number') ||
                title.toLowerCase().includes('title') ||
                title.toLowerCase().includes('description') ||
                title.length < 5) {
              return;
            }
            
            // Extract dates with multiple strategies
            const dateElements = row.querySelectorAll('td');
            let postedDate = new Date().toISOString();
            let dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString(); // Default 30 days from now
            
            dateElements.forEach(cell => {
              const cellText = cell.textContent.trim();
              // Look for date patterns (MM/DD/YYYY, MM-DD-YYYY, etc.)
              const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g;
              const dateMatch = cellText.match(datePattern);
              
              if (dateMatch) {
                const parsedDate = new Date(dateMatch[0]);
                if (!isNaN(parsedDate.getTime())) {
                  // Assume first date is posted date, second is due date
                  if (postedDate === new Date().toISOString()) {
                    postedDate = parsedDate.toISOString();
                  } else if (dueDate === new Date(Date.now() + 30*24*60*60*1000).toISOString()) {
                    dueDate = parsedDate.toISOString();
                  }
                }
              }
            });
            
            // Extract link
            const linkElement = row.querySelector('a[href]');
            let bidLink = '';
            if (linkElement) {
              const href = linkElement.getAttribute('href');
              if (href) {
                bidLink = href.startsWith('http') ? href : 
                         href.startsWith('/') ? `https://epsadmin.septa.org${href}` : 
                         `https://epsadmin.septa.org/vendor/requisitions/${href}`;
              }
            }
            
            // Extract additional details
            const allCells = row.querySelectorAll('td');
            let description = title;
            let quantity = 'N/A';
            
            // Look for quantity patterns
            allCells.forEach(cell => {
              const cellText = cell.textContent.trim();
              if (cellText.match(/\d+\s*(unit|each|lot|service|contract|year)/i)) {
                quantity = cellText;
              }
              if (cellText.length > title.length && cellText.includes(title)) {
                description = cellText;
              }
            });
            
            const bid = {
              id: `septa_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              description: description,
              postedDate: postedDate,
              dueDate: dueDate,
              quantity: quantity,
              documents: [], // Could be enhanced to extract document links
              bidLink: bidLink,
              portal: 'SEPTA'
            };
            
            extractedBids.push(bid);
            
          } catch (error) {
            console.error('Error extracting bid data from row:', error);
          }
        });
        
        return extractedBids;
      });

      await page.close();
      
      // Filter for today and onward only
      const todayOnwardBids = this.filterBidsFromToday(bids);
      
      logger.info(`Extracted ${bids.length} total bids from SEPTA portal, ${todayOnwardBids.length} from today onward`);
      return todayOnwardBids;
      
    } catch (error) {
      logger.error('Error scraping SEPTA portal:', error);
      throw new Error(`SEPTA scraping failed: ${error.message}`);
    }
  }

  async saveBids(bids) {
    const savedBids = [];
    
    for (const bidData of bids) {
      try {
        let existingBid;
        
        if (this.isMongoConnected()) {
          // Check if bid already exists in MongoDB
          existingBid = await Bid.findOne({ id: bidData.id });
          
          if (!existingBid) {
            const bid = new Bid(bidData);
            await bid.save();
            savedBids.push(bid);
            logger.info(`Saved new bid: ${bidData.title}`);
          } else {
            logger.debug(`Bid already exists: ${bidData.title}`);
          }
        } else {
          // Use mock database
          existingBid = mockDatabase.bids.findOne({ id: bidData.id });
          
          if (!existingBid) {
            const savedBid = mockDatabase.bids.create(bidData);
            savedBids.push(savedBid);
            logger.info(`Saved new bid to mock DB: ${bidData.title}`);
          } else {
            logger.debug(`Bid already exists in mock DB: ${bidData.title}`);
          }
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

    this.isRunning = true;
    
    try {
      logger.info('Starting scraper...');
      
      // Get active credentials from MongoDB or mock database
      let credentials = [];
      
      if (this.isMongoConnected()) {
        credentials = await Credential.find({ isActive: true });
      } else {
        logger.info('MongoDB not connected, using mock database');
        credentials = mockDatabase.credentials.find().filter(c => c.isActive);
      }
      
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
      let errors = [];
      
      for (const credential of credentials) {
        try {
          let portalBids = [];
          
          if (credential.portalName === 'Metro') {
            logger.info('Scraping Metro portal...');
            portalBids = await this.scrapeMetroPortal(credential);
          } else if (credential.portalName === 'SEPTA') {
            logger.info(`Scraping SEPTA portal with credentials for user: ${credential.username}`);
            portalBids = await this.scrapeSEPTAPortal(credential);
          } else {
            logger.warn(`Unknown portal type: ${credential.portalName}`);
            continue;
          }
          
          // Filter bids for today and onward only
          const todayOnwardBids = this.filterBidsFromToday(portalBids);
          
          allBids = allBids.concat(todayOnwardBids);
          logger.info(`Scraped ${portalBids.length} total bids from ${credential.portalName} portal, ${todayOnwardBids.length} from today onward`);
          
        } catch (error) {
          logger.error(`Error scraping ${credential.portalName} portal:`, error);
          errors.push(`${credential.portalName}: ${error.message}`);
          // Continue with other portals even if one fails
        }
      }

      const savedBids = await this.saveBids(allBids);
      
      const message = errors.length > 0 
        ? `Scraper completed with some errors: ${errors.join(', ')}. Saved ${savedBids.length} new bids`
        : `Scraper completed successfully. Saved ${savedBids.length} new bids`;
      
      logger.info(message);
      
      return {
        success: true,
        message: message,
        newBids: savedBids.length,
        totalBids: allBids.length,
        errors: errors
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let count = 0;

      if (this.isMongoConnected()) {
        count = await Bid.countDocuments({
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        });
      } else {
        // Use mock database
        count = mockDatabase.bids.countDocuments({
          postedDate: { $gte: today.toISOString() }
        });
      }

      return count;
    } catch (error) {
      logger.error('Error getting today\'s bid count:', error);
      return 0;
    }
  }
}

module.exports = new ScraperService();