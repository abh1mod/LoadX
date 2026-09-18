const mongoose = require('mongoose');
const { BID_STATUS } = require('../utils/constants');

const bidHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const bidSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true
    },
    transporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid amount must be a positive number']
    },
    status: {
      type: String,
      enum: Object.values(BID_STATUS),
      default: BID_STATUS.ACTIVE,
      index: true
    },
    placedAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastAmountChangedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    history: [bidHistorySchema]
  },
  {
    timestamps: true
  }
);

// Guarantee one bid document per transporter per shipment
bidSchema.index({ shipment: 1, transporter: 1 }, { unique: true });

// Index for high-performance ranking queries
bidSchema.index({ shipment: 1, status: 1, amount: 1, lastAmountChangedAt: 1 });

const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
