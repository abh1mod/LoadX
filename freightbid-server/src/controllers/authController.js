const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES, USER_STATUS } = require('../utils/constants');
const { uploadBuffer } = require('../config/cloudinary');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'freightbid_default_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new Supplier or Transporter
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      companyName,
      gstNumber,
      panNumber,
      address,
      city,
      state
    } = req.body;

    // Validate allowed registration roles
    if (![ROLES.SUPPLIER, ROLES.TRANSPORTER].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only SUPPLIER and TRANSPORTER can register.'
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Process documents uploaded via multer
    const documents = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const docType = file.fieldname === 'gstDoc' ? 'GST_CERTIFICATE' :
            file.fieldname === 'panDoc' ? 'PAN_CARD' :
            file.fieldname === 'licenseDoc' ? 'TRANSPORT_LICENSE' : 'SUPPORTING_DOCUMENT';

          const uploadResult = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
          documents.push({
            type: docType,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            originalName: file.originalname
          });
        } catch (uploadErr) {
          console.warn('[Upload] Failed to upload document:', uploadErr.message);
        }
      }
    }

    // Parse transporter fields if applicable
    let transporterFields = { licenseNumber: '', fleetSize: 0, vehicleTypes: [] };
    if (role === ROLES.TRANSPORTER) {
      if (req.body.transporterFields) {
        try {
          transporterFields = typeof req.body.transporterFields === 'string'
            ? JSON.parse(req.body.transporterFields)
            : req.body.transporterFields;
        } catch (e) {
          transporterFields = {
            licenseNumber: req.body.licenseNumber || '',
            fleetSize: Number(req.body.fleetSize) || 0,
            vehicleTypes: req.body.vehicleTypes ? [].concat(req.body.vehicleTypes) : []
          };
        }
      } else {
        transporterFields = {
          licenseNumber: req.body.licenseNumber || '',
          fleetSize: Number(req.body.fleetSize) || 0,
          vehicleTypes: req.body.vehicleTypes ? [].concat(req.body.vehicleTypes) : []
        };
      }
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role,
      status: USER_STATUS.PENDING,
      companyName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      transporterFields,
      documents
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending administrator verification.',
      data: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Role and status verification checks
    if (user.status === USER_STATUS.PENDING) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending administrator verification. Please check back later.',
        status: USER_STATUS.PENDING
      });
    }

    if (user.status === USER_STATUS.REJECTED) {
      return res.status(403).json({
        success: false,
        message: `Your account registration was rejected. Reason: ${user.rejectionReason || 'No reason specified'}`,
        status: USER_STATUS.REJECTED
      });
    }

    if (user.status === USER_STATUS.BLOCKED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by an administrator.',
        status: USER_STATUS.BLOCKED
      });
    }

    if (user.status !== USER_STATUS.VERIFIED) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified.',
        status: user.status
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
