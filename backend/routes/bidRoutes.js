const express = require('express');
const router = express.Router();
const {
  getAllBids,
  getTodaysBidCount,
  refreshBids
} = require('../controllers/bidController');

router.route('/').get(getAllBids);
router.route('/today').get(getTodaysBidCount);
router.route('/refresh').post(refreshBids);

module.exports = router;