const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const { SHIPMENT_STATUS, BID_STATUS, MILESTONES } = require('../utils/constants');
const { deriveAndSyncShipmentStatus, getShipmentLeaderboard } = require('../services/shipmentService');
const { parseISTDate } = require('../utils/dateUtils');

/**
 * Browse shipments for transporters with filtering and search
 */
const browseShipments = async (req, res, next) => {
  try {
    const { status, city, vehicleType, search, sortBy = 'recent', page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status.toUpperCase();
    }
    if (city) {
      const cityRegex = new RegExp(city.trim(), 'i');
      query.$or = [
        { 'pickupLocation.city': cityRegex },
        { 'dropLocation.city': cityRegex }
      ];
    }
    if (vehicleType) {
      query.vehicleTypeRequired = vehicleType;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { title: regex },
            { cargoType: regex },
            { 'pickupLocation.city': regex },
            { 'dropLocation.city': regex }
          ]
        }
      ];
    }

    let sortOptions = { biddingEnd: -1, createdAt: -1 };
    if (sortBy === 'oldest') {
      sortOptions = { biddingEnd: 1, createdAt: 1 };
    } else if (sortBy === 'ending_soon') {
      sortOptions = { biddingEnd: 1, createdAt: -1 };
    } else if (sortBy === 'price_desc') {
      sortOptions = { basePrice: -1, biddingEnd: -1 };
    } else if (sortBy === 'price_asc') {
      sortOptions = { basePrice: 1, biddingEnd: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
      .populate('supplier', 'name companyName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Dynamic status derivation
    for (const s of shipments) {
      await deriveAndSyncShipmentStatus(s);
    }

    // Check which shipments current transporter has already bid on
    const shipmentIds = shipments.map(s => s._id);
    const myBids = await Bid.find({
      shipment: { $in: shipmentIds },
      transporter: req.user._id,
      status: BID_STATUS.ACTIVE
    }).select('shipment amount lastAmountChangedAt').lean();

    const myBidsMap = new Map();
    myBids.forEach(b => myBidsMap.set(b.shipment.toString(), b));

    const enrichedShipments = shipments.map(s => {
      const myBid = myBidsMap.get(s._id.toString());
      return {
        ...s.toObject(),
        myBidAmount: myBid ? myBid.amount : null,
        hasBid: Boolean(myBid)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        shipments: enrichedShipments,
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
 * Place a new bid on an OPEN shipment
 */
const placeBid = async (req, res, next) => {
  try {
    const { amount, expectedDeliveryHours } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bid amount must be a positive number.'
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const currentStatus = await deriveAndSyncShipmentStatus(shipment);

    if (currentStatus !== SHIPMENT_STATUS.OPEN) {
      return res.status(400).json({
        success: false,
        message: `Bids can only be placed while the shipment is OPEN. Current status is ${currentStatus}.`
      });
    }

    if (shipment.basePrice && numericAmount > shipment.basePrice) {
      return res.status(400).json({
        success: false,
        message: `Bid amount cannot exceed the base price of ₹${shipment.basePrice.toLocaleString('en-IN')}.`
      });
    }

    let hoursNum = expectedDeliveryHours !== undefined && expectedDeliveryHours !== null && expectedDeliveryHours !== '' ? Number(expectedDeliveryHours) : null;
    if (hoursNum !== null && (isNaN(hoursNum) || hoursNum <= 0)) {
      hoursNum = null;
    }

    // Default value of hours should be equal to the difference between pickup and delivery date hours
    if (hoursNum === null && shipment.pickupDate && shipment.deliveryDeadline) {
      const p = parseISTDate(shipment.pickupDate);
      const d = parseISTDate(shipment.deliveryDeadline);
      if (p && d && d.getTime() > p.getTime()) {
        hoursNum = Math.round((d.getTime() - p.getTime()) / (1000 * 60 * 60));
      }
    }

    // Check if bid already exists
    let existingBid = await Bid.findOne({
      shipment: shipment._id,
      transporter: req.user._id
    });

    const now = new Date();

    if (existingBid) {
      // If already exists, update it cleanly
      const isDifferentAmount = existingBid.amount !== numericAmount;
      existingBid.amount = numericAmount;
      if (hoursNum !== null) {
        existingBid.expectedDeliveryHours = hoursNum;
      }
      existingBid.updatedAt = now;
      if (isDifferentAmount) {
        existingBid.lastAmountChangedAt = now;
      }
      existingBid.history.push({
        amount: numericAmount,
        expectedDeliveryHours: existingBid.expectedDeliveryHours,
        at: now
      });
      await existingBid.save();

      return res.status(200).json({
        success: true,
        message: 'Existing bid updated successfully!',
        bid: existingBid
      });
    }

    // Create new bid
    const newBid = await Bid.create({
      shipment: shipment._id,
      transporter: req.user._id,
      amount: numericAmount,
      expectedDeliveryHours: hoursNum,
      placedAt: now,
      updatedAt: now,
      lastAmountChangedAt: now,
      history: [{ amount: numericAmount, expectedDeliveryHours: hoursNum, at: now }]
    });

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully!',
      bid: newBid
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update my existing bid on an OPEN shipment
 */
const updateMyBid = async (req, res, next) => {
  try {
    const { amount, expectedDeliveryHours } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bid amount must be a positive number.'
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const currentStatus = await deriveAndSyncShipmentStatus(shipment);

    if (currentStatus !== SHIPMENT_STATUS.OPEN) {
      return res.status(400).json({
        success: false,
        message: `Bids can only be updated while the shipment is OPEN. Current status is ${currentStatus}.`
      });
    }

    if (shipment.basePrice && numericAmount > shipment.basePrice) {
      return res.status(400).json({
        success: false,
        message: `Bid amount cannot exceed the base price of ₹${shipment.basePrice.toLocaleString('en-IN')}.`
      });
    }

    const bid = await Bid.findOne({
      shipment: shipment._id,
      transporter: req.user._id,
      status: BID_STATUS.ACTIVE
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'No active bid found for you on this shipment. Place a bid first.'
      });
    }

    let hoursNum = expectedDeliveryHours !== undefined && expectedDeliveryHours !== null && expectedDeliveryHours !== '' ? Number(expectedDeliveryHours) : undefined;
    if (hoursNum !== undefined && (isNaN(hoursNum) || hoursNum <= 0)) {
      hoursNum = undefined;
    }

    const now = new Date();
    const isDifferent = bid.amount !== numericAmount;

    bid.amount = numericAmount;
    if (hoursNum !== undefined) {
      bid.expectedDeliveryHours = hoursNum;
    }
    bid.updatedAt = now;
    if (isDifferent) {
      bid.lastAmountChangedAt = now;
    }
    bid.history.push({
      amount: numericAmount,
      expectedDeliveryHours: bid.expectedDeliveryHours,
      at: now
    });

    await bid.save();

    res.status(200).json({
      success: true,
      message: 'Bid updated successfully!',
      bid
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Live Leaderboard endpoint (polled every 1 second)
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const data = await getShipmentLeaderboard(req.params.id, req.user?._id);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments awarded to the logged-in transporter
 */
const getMyAwardedShipments = async (req, res, next) => {
  try {
    const shipments = await Shipment.find({
      awardedTo: req.user._id,
      status: { $in: [SHIPMENT_STATUS.AWARDED, SHIPMENT_STATUS.IN_PROGRESS, SHIPMENT_STATUS.DELIVERED] }
    })
      .populate('supplier', 'name companyName email phone')
      .populate('awardedBid')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      shipments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Advance milestone sequentially
 */
const updateMilestone = async (req, res, next) => {
  try {
    const { milestone, note } = req.body;

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    if (shipment.awardedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the awarded transporter can update milestones for this shipment.'
      });
    }

    const currentIndex = MILESTONES.indexOf(shipment.currentMilestone || MILESTONES[0]);
    const targetIndex = MILESTONES.indexOf(milestone);

    if (targetIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Invalid milestone: ${milestone}`
      });
    }

    // Milestones must advance strictly by 1 step
    if (targetIndex !== currentIndex + 1) {
      return res.status(400).json({
        success: false,
        message: `Milestone must advance sequentially. Next expected milestone is '${MILESTONES[currentIndex + 1]}' but received '${milestone}'.`
      });
    }

    // When marking 'Delivered', transporter must provide the matching 6-digit PIN from the shipper
    if (milestone === 'Delivered') {
      const inputPin = (req.body.deliveryPin || '').toString().trim();
      const expectedPin = (shipment.deliveryPin || '').toString().trim();

      if (!inputPin) {
        return res.status(400).json({
          success: false,
          message: '6-digit Delivery PIN is required. Please obtain the PIN from the shipper upon delivery handover.'
        });
      }

      if (!expectedPin || inputPin !== expectedPin) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect 6-digit Delivery PIN. Delivery cannot be marked without the valid PIN from the shipper.'
        });
      }
    }

    const now = new Date();
    shipment.currentMilestone = milestone;
    shipment.milestones.push({
      name: milestone,
      completedAt: now,
      note: note ? note.trim() : ''
    });

    if (milestone === 'Delivered') {
      shipment.status = SHIPMENT_STATUS.DELIVERED;
    } else {
      shipment.status = SHIPMENT_STATUS.IN_PROGRESS;
    }

    await shipment.save();

    res.status(200).json({
      success: true,
      message: `Shipment milestone updated to '${milestone}'.`,
      shipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active and past bids placed by this transporter
 */
const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ transporter: req.user._id })
      .populate({
        path: 'shipment',
        populate: { path: 'supplier', select: 'name companyName city' }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      bids
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  browseShipments,
  placeBid,
  updateMyBid,
  getLeaderboard,
  getMyAwardedShipments,
  updateMilestone,
  getMyBids
};
