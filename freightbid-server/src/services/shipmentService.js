const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const { SHIPMENT_STATUS, BID_STATUS } = require('../utils/constants');
const { parseISTDate } = require('../utils/dateUtils');

/**
 * Computes the time-based derived status of a shipment and updates it in DB if changed.
 * @param {Object} shipment - Mongoose document or plain object
 * @returns {Promise<string>} current effective status
 */
const deriveAndSyncShipmentStatus = async (shipment) => {
  if (!shipment) return null;

  // Once awarded, in progress, or delivered, status is governed by milestone flow, not time
  if ([SHIPMENT_STATUS.AWARDED, SHIPMENT_STATUS.IN_PROGRESS, SHIPMENT_STATUS.DELIVERED].includes(shipment.status)) {
    return shipment.status;
  }

  const now = new Date();
  const startTime = parseISTDate(shipment.biddingStart);
  const endTime = parseISTDate(shipment.biddingEnd);

  let newStatus = shipment.status;

  if (now < startTime) {
    newStatus = SHIPMENT_STATUS.UPCOMING;
  } else if (now >= startTime && now <= endTime) {
    newStatus = SHIPMENT_STATUS.OPEN;
  } else {
    // Window has passed. Check if there were any bids.
    const bidCount = await Bid.countDocuments({
      shipment: shipment._id,
      status: BID_STATUS.ACTIVE
    });

    if (bidCount === 0) {
      newStatus = SHIPMENT_STATUS.EXPIRED;
    } else {
      newStatus = SHIPMENT_STATUS.CLOSED;
    }
  }

  // If status changed in DB, persist it
  if (newStatus !== shipment.status) {
    await Shipment.updateOne({ _id: shipment._id }, { $set: { status: newStatus } });
    shipment.status = newStatus;
  }

  return newStatus;
};

/**
 * Calculates leaderboard rankings for a shipment.
 * Sorting: amount ascending (lowest = Rank 1), ties broken by lastAmountChangedAt ascending.
 * @param {string} shipmentId
 * @param {string|null} currentUserId
 */
const getShipmentLeaderboard = async (shipmentId, currentUserId = null) => {
  const shipment = await Shipment.findById(shipmentId).lean();
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Synchronize time-based status
  const currentStatus = await deriveAndSyncShipmentStatus(shipment);

  const now = new Date();
  const endTime = parseISTDate(shipment.biddingEnd);
  const secondsRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

  // Fetch all active bids populated with transporter info
  const bids = await Bid.find({
    shipment: shipmentId,
    status: BID_STATUS.ACTIVE
  })
    .sort({ amount: 1, lastAmountChangedAt: 1 })
    .populate('transporter', 'name companyName city')
    .lean();

  let myRank = null;
  let myBid = null;

  const leaderboard = bids.map((b, index) => {
    const rank = index + 1;
    const isMe = currentUserId && b.transporter?._id?.toString() === currentUserId.toString();

    if (isMe) {
      myRank = rank;
      myBid = {
        _id: b._id,
        amount: b.amount,
        lastAmountChangedAt: b.lastAmountChangedAt,
        placedAt: b.placedAt,
        history: b.history
      };
    }

    return {
      rank,
      bidId: b._id,
      transporterId: b.transporter?._id,
      transporterName: b.transporter?.name || 'Transporter',
      companyName: b.transporter?.companyName || 'Logistics Co',
      city: b.transporter?.city || '',
      amount: b.amount,
      isMe: Boolean(isMe),
      lastAmountChangedAt: b.lastAmountChangedAt,
      placedAt: b.placedAt
    };
  });

  const lowestBid = leaderboard.length > 0 ? leaderboard[0].amount : null;

  return {
    shipmentId: shipment._id,
    serverTime: new Date().toISOString(),
    serverComputedStatus: currentStatus,
    secondsRemaining,
    totalBidders: leaderboard.length,
    lowestBid,
    myRank,
    myBid,
    leaderboard
  };
};

module.exports = {
  deriveAndSyncShipmentStatus,
  getShipmentLeaderboard
};
