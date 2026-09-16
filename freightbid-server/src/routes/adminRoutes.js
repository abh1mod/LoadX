const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const adminController = require('../controllers/adminController');

// All admin routes require ADMIN role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/verify', adminController.verifyUser);
router.patch('/users/:id/reject', adminController.rejectUser);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/unblock', adminController.unblockUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/shipments', adminController.getAllShipments);
router.get('/stats', adminController.getStats);
router.post('/reseed', adminController.reseedDatabase);

module.exports = router;
