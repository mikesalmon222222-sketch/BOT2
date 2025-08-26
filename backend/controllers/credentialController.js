const Credential = require('../models/Credential');
const logger = require('../utils/logger');

// @desc    Get all credentials
// @route   GET /api/credentials
// @access  Public
exports.getAllCredentials = async (req, res, next) => {
  try {
    const credentials = await Credential.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      count: credentials.length,
      data: credentials
    });
  } catch (error) {
    logger.error('Error fetching credentials:', error.message);
    next(error);
  }
};

// @desc    Add new credential
// @route   POST /api/credentials
// @access  Public
exports.addCredential = async (req, res, next) => {
  try {
    const { portalName, url, username, password, isPublic, isActive } = req.body;
    
    const credential = await Credential.create({
      portalName,
      url,
      username,
      password,
      isPublic: isPublic || false,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Don't return password in response
    const responseCredential = await Credential.findById(credential._id).select('-password');
    
    res.status(201).json({
      success: true,
      data: responseCredential
    });
  } catch (error) {
    logger.error('Error adding credential:', error.message);
    next(error);
  }
};

// @desc    Update credential
// @route   PUT /api/credentials/:id
// @access  Public
exports.updateCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const credential = await Credential.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: credential
    });
  } catch (error) {
    logger.error('Error updating credential:', error.message);
    next(error);
  }
};

// @desc    Delete credential
// @route   DELETE /api/credentials/:id
// @access  Public
exports.deleteCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const credential = await Credential.findByIdAndDelete(id);
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting credential:', error.message);
    next(error);
  }
};