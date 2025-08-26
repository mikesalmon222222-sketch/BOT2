const Credential = require('../models/Credential');
const logger = require('../utils/logger');

// @desc    Get all credentials
// @route   GET /api/credentials
// @access  Public
const getAllCredentials = async (req, res, next) => {
  try {
    const credentials = await Credential.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: credentials.length,
      data: credentials
    });
  } catch (error) {
    logger.error('Error getting all credentials:', error);
    next(error);
  }
};

// @desc    Add new credential
// @route   POST /api/credentials
// @access  Public
const createCredential = async (req, res, next) => {
  try {
    const { portalName, url, username, password, isPublic, isActive } = req.body;

    // Validation
    if (!portalName || !url) {
      return res.status(400).json({
        success: false,
        error: 'Portal name and URL are required'
      });
    }

    if (!isPublic && (!username || !password)) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required for non-public portals'
      });
    }

    const credential = await Credential.create({
      portalName,
      url,
      username,
      password,
      isPublic: isPublic || false,
      isActive: isActive !== false
    });

    // Don't return password in response
    const responseCredential = await Credential.findById(credential._id).select('-password');

    res.status(201).json({
      success: true,
      data: responseCredential
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