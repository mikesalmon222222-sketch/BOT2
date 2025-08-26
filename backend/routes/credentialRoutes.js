const express = require('express');
const {
  getAllCredentials,
  createCredential,
  updateCredential,
  deleteCredential
} = require('../controllers/credentialController');

const router = express.Router();

router.route('/')
  .get(getAllCredentials)
  .post(createCredential);

router.route('/:id')
  .put(updateCredential)
  .delete(deleteCredential);

module.exports = router;