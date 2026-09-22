const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const shipmentController = require('../controllers/shipmentController');
const transporterController = require('../controllers/transporterController');

// All shipment endpoints require authentication
router.use(authenticate);

// 1. Specific non-parameterized routes first
router.get('/mine', authorize(ROLES.SUPPLIER), shipmentController.getMyShipments);
router.get('/awarded/mine', authorize(ROLES.TRANSPORTER), transporterController.getMyAwardedShipments);
router.get('/my-bids', authorize(ROLES.TRANSPORTER), transporterController.getMyBids);

// Browse all shipments (Transporter & Supplier & Admin)
router.get('/', transporterController.browseShipments);

// Create shipment (Supplier only)
router.post('/', authorize(ROLES.SUPPLIER), shipmentController.createShipment);

// 2. Parameterized routes by :id
router.get('/:id', shipmentController.getShipmentById);
router.put('/:id', authorize(ROLES.SUPPLIER), shipmentController.updateShipment);
router.post('/:id/repost', authorize(ROLES.SUPPLIER), shipmentController.repostShipment);

// Bidding & Live Leaderboard (Polled every 1s)
router.get('/:id/bids', shipmentController.getShipmentBids);
router.get('/:id/leaderboard', transporterController.getLeaderboard);
router.post('/:id/bids', authorize(ROLES.TRANSPORTER), transporterController.placeBid);
router.put('/:id/bids/me', authorize(ROLES.TRANSPORTER), transporterController.updateMyBid);

// Award shipment (Supplier only)
router.post('/:id/award', authorize(ROLES.SUPPLIER), shipmentController.awardShipment);

// Milestone progression (Transporter only)
router.patch('/:id/milestone', authorize(ROLES.TRANSPORTER), transporterController.updateMilestone);

// Review submission (Supplier only)
router.post('/:id/review', authorize(ROLES.SUPPLIER), shipmentController.submitReview);

module.exports = router;
