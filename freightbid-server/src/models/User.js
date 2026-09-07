const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, USER_STATUS } = require('../utils/constants');

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., 'GST_CERTIFICATE', 'PAN_CARD', 'TRANSPORT_LICENSE'
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    originalName: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
      index: true
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    gstNumber: {
      type: String,
      trim: true,
      default: ''
    },
    panNumber: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    transporterFields: {
      licenseNumber: { type: String, default: '' },
      fleetSize: { type: Number, default: 0 },
      vehicleTypes: [{ type: String }]
    },
    documents: [documentSchema],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform output to never expose passwordHash
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
