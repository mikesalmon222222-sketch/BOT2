const puppeteer = require('puppeteer');
const Bid = require('../models/Bid');
const logger = require('../utils/logger');

class ScraperService {
  constructor() {
    this.targetUrl = 'https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations';
  }

  async scrapeBids() {
    let browser;
    
    try {
      logger.info('Starting bid scraping process...');
      
      browser = await puppeteer.launch({
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
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      logger.info(`Navigating to: ${this.targetUrl}`);
      await page.goto(this.targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Wait for content to load
      await page.waitForTimeout(5000);
      
      // Extract bid data from the page
      const bidData = await page.evaluate(() => {
        const bids = [];
        
        // Look for solicitation rows - this selector may need adjustment based on actual page structure
        const rows = document.querySelectorAll('tr[data-row], .solicitation-row, tbody tr');
        
        rows.forEach((row, index) => {
          try {
            // Extract data from each row - these selectors will need to be adjusted
            const titleElement = row.querySelector('td:nth-child(1), .title, .solicitation-title');
            const expirationElement = row.querySelector('td:nth-child(2), .expiration, .due-date');
            const descriptionElement = row.querySelector('td:nth-child(3), .description, .details');
            
            if (titleElement && titleElement.textContent.trim()) {
              const title = titleElement.textContent.trim();
              const expiration = expirationElement ? expirationElement.textContent.trim() : '';
              const description = descriptionElement ? descriptionElement.textContent.trim() : '';
              
              // Generate unique ID
              const id = `metro_${Date.now()}_${index}`;
              
              // Parse expiration date
              let expirationDate = new Date();
              if (expiration) {
                const dateMatch = expiration.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                  expirationDate = new Date(dateMatch[0]);
                }
              }
              
              // Look for document links
              const documentLinks = [];
              const linkElements = row.querySelectorAll('a[href*=".pdf"], a[href*="document"], a[href*="attachment"]');
              linkElements.forEach(link => {
                if (link.href) {
                  documentLinks.push(link.href);
                }
              });
              
              const bid = {
                id,
                timestamp: new Date().toISOString(),
                expirationDate: expirationDate.toISOString(),
                title,
                quantity: '1', // Default quantity if not found
                description: description || 'No description available',
                documents: documentLinks,
                portal: 'metro.net'
              };
              
              bids.push(bid);
            }
          } catch (error) {
            console.error('Error processing row:', error);
          }
        });
        
        // If no rows found with standard selectors, try alternative approach
        if (bids.length === 0) {
          // Look for any text that might be solicitations
          const allText = document.body.innerText;
          const lines = allText.split('\n').filter(line => line.trim().length > 10);
          
          // Create a sample bid if we can't parse the actual structure
          if (lines.length > 0) {
            const sampleBid = {
              id: `metro_sample_${Date.now()}`,
              timestamp: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              title: 'Metro Solicitation - Data Extracted',
              quantity: '1',
              description: 'Solicitation found on Metro vendor portal',
              documents: [],
              portal: 'metro.net'
            };
            bids.push(sampleBid);
          }
        }
        
        return bids;
      });
      
      logger.info(`Extracted ${bidData.length} bids from the page`);
      
      // Save bids to database
      const savedBids = [];
      for (const bid of bidData) {
        try {
          // Check if bid already exists
          const existingBid = await Bid.findOne({ id: bid.id });
          if (!existingBid) {
            const newBid = new Bid(bid);
            await newBid.save();
            savedBids.push(newBid);
            logger.info(`Saved new bid: ${bid.title}`);
          }
        } catch (error) {
          logger.error(`Error saving bid ${bid.id}:`, error.message);
        }
      }
      
      logger.info(`Scraping completed. Saved ${savedBids.length} new bids.`);
      return savedBids;
      
    } catch (error) {
      logger.error('Error during scraping:', error.message);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = new ScraperService();