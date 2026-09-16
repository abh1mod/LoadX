const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const { USER_STATUS, SHIPMENT_STATUS } = require('../utils/constants');
const { deriveAndSyncShipmentStatus } = require('../services/shipmentService');

/**
 * Get users with pagination, filtering by role, status, and text search
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    if (role) {
      query.role = role.toUpperCase();
    }
    if (status) {
      query.status = status.toUpperCase();
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex },
        { city: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a pending user
 */
const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = USER_STATUS.VERIFIED;
    user.verifiedAt = new Date();
    user.verifiedBy = req.user._id;
    user.rejectionReason = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been verified successfully.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a pending user
 */
const rejectUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = USER_STATUS.REJECTED;
    user.rejectionReason = reason || 'Documentation failed verification checks.';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been rejected.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Block an active user
 */
const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot block administrator accounts.' });
    }

    user.status = USER_STATUS.BLOCKED;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been blocked immediately.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock a blocked user
 */
const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = USER_STATUS.VERIFIED;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been unblocked.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete user
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot remove administrator accounts.' });
    }

    user.isDeleted = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been removed.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments (read-only for Admin)
 */
const getAllShipments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status.toUpperCase();
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { 'pickupLocation.city': regex },
        { 'dropLocation.city': regex },
        { cargoType: regex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
      .populate('supplier', 'name companyName email')
      .populate('awardedTo', 'name companyName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Derive latest statuses dynamically
    for (const s of shipments) {
      await deriveAndSyncShipmentStatus(s);
    }

    res.status(200).json({
      success: true,
      data: {
        shipments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system stats for dashboard
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      verifiedUsers,
      blockedUsers,
      totalShipments,
      openShipments,
      awardedShipments,
      deliveredShipments,
      totalBids
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ status: USER_STATUS.PENDING, isDeleted: false }),
      User.countDocuments({ status: USER_STATUS.VERIFIED, isDeleted: false }),
      User.countDocuments({ status: USER_STATUS.BLOCKED, isDeleted: false }),
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: SHIPMENT_STATUS.OPEN }),
      Shipment.countDocuments({ status: { $in: [SHIPMENT_STATUS.AWARDED, SHIPMENT_STATUS.IN_PROGRESS] } }),
      Shipment.countDocuments({ status: SHIPMENT_STATUS.DELIVERED }),
      Bid.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          verified: verifiedUsers,
          blocked: blockedUsers
        },
        shipments: {
          total: totalShipments,
          open: openShipments,
          awarded: awardedShipments,
          delivered: deliveredShipments
        },
        bids: {
          total: totalBids
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reseed database with fresh test data
 */
const reseedDatabase = async (req, res, next) => {
  try {
    const { seedData } = require('../seed/seed');
    await seedData(false);
    res.status(200).json({
      success: true,
      message: 'Database reseeded successfully!'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  verifyUser,
  rejectUser,
  blockUser,
  unblockUser,
  deleteUser,
  getAllShipments,
  getStats,
  reseedDatabase
};
