const Credential = require('../models/Credential');
const mongoose = require('mongoose');
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');
const mockDatabase = require('../utils/mockDatabase');

// Helper function to check MongoDB connection
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// @desc    Get all credentials
// @route   GET /api/credentials
// @access  Public
const getAllCredentials = async (req, res, next) => {
  try {
    let credentials;
    
    if (isMongoConnected()) {
      credentials = await Credential.find().select('-password');
    } else {
      // Use mock database when MongoDB is not available
      logger.warn('MongoDB not connected, using mock database for credentials');
      const mockCredentials = mockDatabase.credentials.find();
      credentials = mockCredentials.map(c => {
        const { password, ...credentialWithoutPassword } = c;
        return credentialWithoutPassword;
      });
    }
    
    res.status(200).json({
      success: true,
      count: credentials.length,
      data: credentials
    });
  } catch (error) {
    logger.error('Error getting all credentials:', error);
    // If it's a database connection error, return empty data instead of error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError' || error.name === 'MongooseServerSelectionError') {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    next(error);
  }
};

// @desc    Add new credential
// @route   POST /api/credentials
// @access  Public
const createCredential = async (req, res, next) => {
  try {
    const { portalName, url, username, password, isActive } = req.body;

    // Validation
    if (!portalName) {
      return res.status(400).json({
        success: false,
        error: 'Portal name is required'
      });
    }

    // Validate portal type
    if (!['Metro', 'SEPTA'].includes(portalName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid portal type. Supported portals: Metro, SEPTA'
      });
    }

    // Portal-specific validation
    if (portalName === 'SEPTA') {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required for SEPTA portal'
        });
      }
    }

    let credential, responseCredential;

    if (isMongoConnected()) {
      // Check if portal already exists
      const existingCredential = await Credential.findOne({ portalName });
      if (existingCredential) {
        return res.status(400).json({
          success: false,
          error: `Portal ${portalName} is already configured. Please update the existing credential instead.`
        });
      }

      credential = await Credential.create({
        portalName,
        url: url || '', // Will be set by pre-save middleware if empty
        username,
        password,
        isActive: isActive !== false
      });

      // Don't return password in response
      responseCredential = await Credential.findById(credential._id).select('-password');
    } else {
      // Use mock database
      logger.warn('MongoDB not connected, using mock database for credential creation');
      
      // Check if portal already exists in mock
      const existingCredential = mockDatabase.credentials.findOne({ portalName });
      if (existingCredential) {
        return res.status(400).json({
          success: false,
          error: `Portal ${portalName} is already configured. Please update the existing credential instead.`
        });
      }

      // Set default URLs based on portal type
      let finalUrl = url;
      if (!url || url.trim() === '') {
        if (portalName === 'Metro') {
          finalUrl = 'https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations';
        } else if (portalName === 'SEPTA') {
          finalUrl = 'https://epsadmin.septa.org/vendor/requisitions/list/';
        }
      }

      credential = mockDatabase.credentials.create({
        portalName,
        url: finalUrl,
        username: portalName === 'Metro' ? undefined : username,
        password: portalName === 'Metro' ? undefined : password,
        isPublic: portalName === 'Metro',
        isActive: isActive !== false
      });

      // Don't return password in response
      const { password: _, ...credentialWithoutPassword } = credential;
      responseCredential = credentialWithoutPassword;
    }

    // Trigger immediate scraping for the new portal (async, don't wait)
    setImmediate(async () => {
      try {
        logger.info(`Triggering immediate scrape for new ${portalName} portal...`);
        await scraperService.runScraper();
      } catch (error) {
        logger.error('Error during immediate scrape after credential creation:', error);
      }
    });

    res.status(201).json({
      success: true,
      data: responseCredential,
      message: `${portalName} portal configured successfully. Scraping initiated.`
    });
  } catch (error) {
    logger.error('Error creating credential:', error);
    next(error);
  }
};

// @desc    Update credential
// @route   PUT /api/credentials/:id
// @access  Public
const updateCredential = async (req, res, next) => {
  try {
    const { portalName, url, username, password, isPublic, isActive } = req.body;

    let credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }

    // Update fields
    if (portalName !== undefined) credential.portalName = portalName;
    if (url !== undefined) credential.url = url;
    if (username !== undefined) credential.username = username;
    if (password !== undefined) credential.password = password;
    if (isPublic !== undefined) credential.isPublic = isPublic;
    if (isActive !== undefined) credential.isActive = isActive;

    await credential.save();

    // Don't return password in response
    const responseCredential = await Credential.findById(credential._id).select('-password');

    res.status(200).json({
      success: true,
      data: responseCredential
    });
  } catch (error) {
    logger.error('Error updating credential:', error);
    next(error);
  }
};

// @desc    Delete credential
// @route   DELETE /api/credentials/:id
// @access  Public
const deleteCredential = async (req, res, next) => {
  try {
    const credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }

    await Credential.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting credential:', error);
    next(error);
  }
};

module.exports = {
  getAllCredentials,
  createCredential,
  updateCredential,
  deleteCredential
};