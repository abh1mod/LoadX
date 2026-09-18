const mongoose = require('mongoose');
const { SHIPMENT_STATUS, MILESTONES } = require('../utils/constants');

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const milestoneRecordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: MILESTONES
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: true }
);

const shipmentSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Shipment title is required'],
      trim: true
    },
    pickupLocation: {
      type: locationSchema,
      required: true
    },
    dropLocation: {
      type: locationSchema,
      required: true
    },
    cargoType: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      required: true,
      min: [1, 'Weight must be at least 1 kg']
    },
    volume: {
      type: Number,
      default: null
    },
    vehicleTypeRequired: {
      type: String,
      required: true,
      trim: true
    },
    pickupDate: {
      type: Date,
      required: true
    },
    deliveryDeadline: {
      type: Date,
      required: true
    },
    basePrice: {
      type: Number,
      default: null,
      min: [0, 'Base price must be a non-negative number']
    },
    specialInstructions: {
      type: String,
      default: '',
      trim: true
    },
    biddingStart: {
      type: Date,
      required: true,
      index: true
    },
    biddingEnd: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(SHIPMENT_STATUS),
      default: SHIPMENT_STATUS.UPCOMING,
      index: true
    },
    awardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    awardedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
      default: null
    },
    awardedAmount: {
      type: Number,
      default: null
    },
    awardedAt: {
      type: Date,
      default: null
    },
    currentMilestone: {
      type: String,
      default: null
    },
    milestones: [milestoneRecordSchema],
    repostedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes to speed up queries
shipmentSchema.index({ status: 1, biddingEnd: 1 });
shipmentSchema.index({ 'pickupLocation.city': 1, 'dropLocation.city': 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);
module.exports = Shipment;
