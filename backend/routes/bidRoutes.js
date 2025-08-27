const express = require('express');
const {
  getAllBids,
  getTodaysBidCount,
  refreshBids,
  getBidById,
  deleteBidById
} = require('../controllers/bidController');

const router = express.Router();

router.route('/')
  .get(getAllBids);

router.route('/today')
  .get(getTodaysBidCount);

router.route('/refresh')
  .post(refreshBids);

router.route('/:id')
  .get(getBidById)
  .delete(deleteBidById);

module.exports = router;