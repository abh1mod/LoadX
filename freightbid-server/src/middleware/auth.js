const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { USER_STATUS } = require('../utils/constants');

/**
 * Middleware to authenticate requests via Bearer JWT and re-verify user status in DB
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'freightbid_default_secret_key';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.'
      });
    }

    // Re-verify against database on EVERY request to enforce immediate block/delete/status changes
    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    if (user.status === USER_STATUS.BLOCKED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by an administrator.',
        status: USER_STATUS.BLOCKED
      });
    }

    if (user.status === USER_STATUS.REJECTED) {
      return res.status(403).json({
        success: false,
        message: `Your account registration was rejected. Reason: ${user.rejectionReason || 'No reason provided'}`,
        status: USER_STATUS.REJECTED
      });
    }

    if (user.status === USER_STATUS.PENDING) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending administrator verification. Please check back later.',
        status: USER_STATUS.PENDING
      });
    }

    if (user.status !== USER_STATUS.VERIFIED) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified.',
        status: user.status
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role ${req.user.role} is not authorized for this resource.`
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
