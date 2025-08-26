const express = require('express');
const router = express.Router();
const {
  getAllCredentials,
  addCredential,
  updateCredential,
  deleteCredential
} = require('../controllers/credentialController');

router.route('/')
  .get(getAllCredentials)
  .post(addCredential);

router.route('/:id')
  .put(updateCredential)
  .delete(deleteCredential);

module.exports = router;