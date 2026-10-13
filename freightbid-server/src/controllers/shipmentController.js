const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const Review = require('../models/Review');
const { SHIPMENT_STATUS, BID_STATUS, MILESTONES } = require('../utils/constants');
const { deriveAndSyncShipmentStatus, getShipmentLeaderboard } = require('../services/shipmentService');
const { parseISTDate } = require('../utils/dateUtils');

/**
 * Create a new shipment (Supplier only)
 */
const createShipment = async (req, res, next) => {
  try {
    const {
      title,
      pickupLocation,
      dropLocation,
      cargoType,
      weight,
      volume,
      vehicleTypeRequired,
      pickupDate,
      deliveryDeadline,
      basePrice,
      specialInstructions,
      biddingStart,
      biddingEnd
    } = req.body;

    const start = parseISTDate(biddingStart);
    const end = parseISTDate(biddingEnd);
    const parsedPickup = parseISTDate(pickupDate);
    const parsedDelivery = parseISTDate(deliveryDeadline);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bidding window dates.'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Bidding end time must be after bidding start time.'
      });
    }

    const now = new Date();
    // Status is UPCOMING or OPEN depending on start time
    const initialStatus = now >= start ? SHIPMENT_STATUS.OPEN : SHIPMENT_STATUS.UPCOMING;

    const shipment = await Shipment.create({
      supplier: req.user._id,
      title,
      pickupLocation,
      dropLocation,
      cargoType,
      weight: Number(weight),
      volume: volume ? Number(volume) : null,
      vehicleTypeRequired,
      pickupDate: parsedPickup || new Date(pickupDate),
      deliveryDeadline: parsedDelivery || new Date(deliveryDeadline),
      basePrice: basePrice ? Number(basePrice) : null,
      specialInstructions,
      biddingStart: start,
      biddingEnd: end,
      status: initialStatus
    });

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully.',
      shipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments created by current supplier
 */
const getMyShipments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { supplier: req.user._id };

    if (status) {
      query.status = status.toUpperCase();
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { 'pickupLocation.city': regex },
        { 'dropLocation.city': regex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
      .populate('awardedTo', 'name companyName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Update statuses dynamically
    for (const s of shipments) {
      await deriveAndSyncShipmentStatus(s);
    }

    // Attach bid counts and lowest bids
    const shipmentIds = shipments.map(s => s._id);
    const bidsSummary = await Bid.aggregate([
      { $match: { shipment: { $in: shipmentIds }, status: BID_STATUS.ACTIVE } },
      {
        $group: {
          _id: '$shipment',
          bidsCount: { $sum: 1 },
          lowestBid: { $min: '$amount' }
        }
      }
    ]);

    const summaryMap = new Map();
    bidsSummary.forEach(b => summaryMap.set(b._id.toString(), b));

    const enrichedShipments = shipments.map(s => {
      const summary = summaryMap.get(s._id.toString()) || { bidsCount: 0, lowestBid: null };
      return {
        ...s.toObject(),
        bidsCount: summary.bidsCount,
        lowestBid: summary.lowestBid
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
 * Get single shipment details
 */
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('supplier', 'name companyName email phone city')
      .populate('awardedTo', 'name companyName email phone transporterFields')
      .populate('awardedBid');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Derive latest status
    await deriveAndSyncShipmentStatus(shipment);

    // Fetch review if delivered
    let review = null;
    if (shipment.status === SHIPMENT_STATUS.DELIVERED) {
      review = await Review.findOne({ shipment: shipment._id });
    }

    res.status(200).json({
      success: true,
      shipment,
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment (allowed only before biddingStart)
 */
const updateShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    if (shipment.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this shipment.' });
    }

    await deriveAndSyncShipmentStatus(shipment);

    const now = new Date();
    if (now >= parseISTDate(shipment.biddingStart) || shipment.status !== SHIPMENT_STATUS.UPCOMING) {
      return res.status(400).json({
        success: false,
        message: 'Shipment cannot be edited once bidding has started or when not in UPCOMING status.'
      });
    }

    const updatableFields = [
      'title',
      'pickupLocation',
      'dropLocation',
      'cargoType',
      'weight',
      'volume',
      'vehicleTypeRequired',
      'basePrice',
      'specialInstructions'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shipment[field] = req.body[field];
      }
    });

    if (req.body.pickupDate !== undefined) {
      shipment.pickupDate = parseISTDate(req.body.pickupDate) || shipment.pickupDate;
    }
    if (req.body.deliveryDeadline !== undefined) {
      shipment.deliveryDeadline = parseISTDate(req.body.deliveryDeadline) || shipment.deliveryDeadline;
    }
    if (req.body.biddingStart !== undefined) {
      shipment.biddingStart = parseISTDate(req.body.biddingStart) || shipment.biddingStart;
    }
    if (req.body.biddingEnd !== undefined) {
      shipment.biddingEnd = parseISTDate(req.body.biddingEnd) || shipment.biddingEnd;
    }

    if (parseISTDate(shipment.biddingEnd) <= parseISTDate(shipment.biddingStart)) {
      return res.status(400).json({
        success: false,
        message: 'Bidding end time must be after bidding start time.'
      });
    }

    await shipment.save();

    res.status(200).json({
      success: true,
      message: 'Shipment updated successfully.',
      shipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Repost an EXPIRED shipment with a new bidding window
 */
const repostShipment = async (req, res, next) => {
  try {
    const oldShipment = await Shipment.findById(req.params.id);
    if (!oldShipment) {
      return res.status(404).json({ success: false, message: 'Original shipment not found' });
    }

    if (oldShipment.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to repost this shipment.' });
    }

    await deriveAndSyncShipmentStatus(oldShipment);

    if (oldShipment.status !== SHIPMENT_STATUS.EXPIRED) {
      return res.status(400).json({
        success: false,
        message: `Only EXPIRED shipments can be reposted. Current status is ${oldShipment.status}.`
      });
    }

    const { biddingStart, biddingEnd, basePrice, pickupDate, deliveryDeadline } = req.body;
    const start = parseISTDate(biddingStart);
    const end = parseISTDate(biddingEnd);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bidding window for reposted shipment.'
      });
    }

    const now = new Date();
    const newStatus = now >= start ? SHIPMENT_STATUS.OPEN : SHIPMENT_STATUS.UPCOMING;

    const newShipment = await Shipment.create({
      supplier: req.user._id,
      title: req.body.title || oldShipment.title,
      pickupLocation: req.body.pickupLocation || oldShipment.pickupLocation,
      dropLocation: req.body.dropLocation || oldShipment.dropLocation,
      cargoType: req.body.cargoType || oldShipment.cargoType,
      weight: req.body.weight || oldShipment.weight,
      volume: req.body.volume !== undefined ? req.body.volume : oldShipment.volume,
      vehicleTypeRequired: req.body.vehicleTypeRequired || oldShipment.vehicleTypeRequired,
      pickupDate: pickupDate ? parseISTDate(pickupDate) : oldShipment.pickupDate,
      deliveryDeadline: deliveryDeadline ? parseISTDate(deliveryDeadline) : oldShipment.deliveryDeadline,
      basePrice: basePrice !== undefined ? Number(basePrice) : oldShipment.basePrice,
      specialInstructions: req.body.specialInstructions || oldShipment.specialInstructions,
      biddingStart: start,
      biddingEnd: end,
      status: newStatus,
      repostedFrom: oldShipment._id
    });

    res.status(201).json({
      success: true,
      message: 'Shipment reposted successfully.',
      shipment: newShipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get live bids for a shipment (polled by supplier)
 */
const getShipmentBids = async (req, res, next) => {
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
 * Award shipment to any bidder after bidding window closes
 */
const awardShipment = async (req, res, next) => {
  try {
    const { bidId } = req.body;
    if (!bidId) {
      return res.status(400).json({ success: false, message: 'Please specify the bid to award.' });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    if (shipment.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the shipment owner can award it.' });
    }

    await deriveAndSyncShipmentStatus(shipment);

    if (shipment.status !== SHIPMENT_STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: `Shipment can only be awarded when CLOSED. Current status is ${shipment.status}.`
      });
    }

    // Verify bid exists and belongs to this shipment
    const winningBid = await Bid.findOne({ _id: bidId, shipment: shipment._id, status: BID_STATUS.ACTIVE });
    if (!winningBid) {
      return res.status(404).json({
        success: false,
        message: 'Active bid not found for this shipment.'
      });
    }

    // Atomic update to prevent double-awarding
    const updatedShipment = await Shipment.findOneAndUpdate(
      { _id: shipment._id, status: SHIPMENT_STATUS.CLOSED },
      {
        $set: {
          status: SHIPMENT_STATUS.AWARDED,
          awardedTo: winningBid.transporter,
          awardedBid: winningBid._id,
          awardedAmount: winningBid.amount,
          awardedAt: new Date(),
          currentMilestone: 'Awarded',
          milestones: [
            {
              name: 'Awarded',
              completedAt: new Date(),
              note: 'Carrier selected and shipment awarded.'
            }
          ]
        }
      },
      { new: true }
    );

    if (!updatedShipment) {
      return res.status(409).json({
        success: false,
        message: 'Shipment has already been awarded or status has changed.'
      });
    }

    // Mark winning bid WON and others LOST
    await Bid.updateOne({ _id: winningBid._id }, { $set: { status: BID_STATUS.WON } });
    await Bid.updateMany(
      { shipment: shipment._id, _id: { $ne: winningBid._id } },
      { $set: { status: BID_STATUS.LOST } }
    );

    res.status(200).json({
      success: true,
      message: 'Shipment awarded successfully!',
      shipment: updatedShipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit review for awarded transporter after shipment is DELIVERED
 */
const submitReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    if (shipment.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the shipment owner can review this shipment.' });
    }

    if (shipment.status !== SHIPMENT_STATUS.DELIVERED) {
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted after the shipment is DELIVERED. Current status: ${shipment.status}`
      });
    }

    const existingReview = await Review.findOne({ shipment: shipment._id });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'A review has already been submitted for this shipment.'
      });
    }

    const review = await Review.create({
      shipment: shipment._id,
      supplier: req.user._id,
      transporter: shipment.awardedTo,
      rating: Number(rating),
      comment: comment.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShipment,
  getMyShipments,
  getShipmentById,
  updateShipment,
  repostShipment,
  getShipmentBids,
  awardShipment,
  submitReview
};
