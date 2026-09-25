const Review = require('../models/Review');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const { ROLES, USER_STATUS, SHIPMENT_STATUS } = require('../utils/constants');

/**
 * Public home page data: Top rated transporters, recent reviews, platform stats
 */
const getHomeData = async (req, res, next) => {
  try {
    // 1. Calculate top-rated transporters via aggregation
    const topTransporterAgg = await Review.aggregate([
      {
        $group: {
          _id: '$transporter',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 6 }
    ]);

    const transporterIds = topTransporterAgg.map((t) => t._id);
    const transporters = await User.find({
      _id: { $in: transporterIds },
      isDeleted: false,
      status: USER_STATUS.VERIFIED
    }).select('name companyName city state transporterFields').lean();

    const transporterMap = new Map();
    transporters.forEach((t) => transporterMap.set(t._id.toString(), t));

    const topRatedTransporters = topTransporterAgg
      .map((item) => {
        const u = transporterMap.get(item._id.toString());
        if (!u) return null;
        return {
          _id: u._id,
          name: u.name,
          companyName: u.companyName,
          city: u.city,
          state: u.state,
          fleetSize: u.transporterFields?.fleetSize || 0,
          vehicleTypes: u.transporterFields?.vehicleTypes || [],
          avgRating: Number(item.avgRating.toFixed(1)),
          reviewCount: item.reviewCount
        };
      })
      .filter(Boolean);

    // 2. Fetch recent reviews
    const recentReviews = await Review.find()
      .populate('supplier', 'name companyName')
      .populate('transporter', 'name companyName')
      .populate('shipment', 'title cargoType')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // 3. Platform stats
    const [
      totalSuppliers,
      totalTransporters,
      totalShipments,
      deliveredShipments
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.SUPPLIER, status: USER_STATUS.VERIFIED, isDeleted: false }),
      User.countDocuments({ role: ROLES.TRANSPORTER, status: USER_STATUS.VERIFIED, isDeleted: false }),
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: SHIPMENT_STATUS.DELIVERED })
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          suppliersCount: totalSuppliers,
          transportersCount: totalTransporters,
          totalShipments,
          deliveredShipments
        },
        topRatedTransporters,
        recentReviews: recentReviews.map((r) => ({
          _id: r._id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          supplierName: r.supplier?.companyName || r.supplier?.name || 'Verified Shipper',
          transporterName: r.transporter?.companyName || r.transporter?.name || 'Carrier Partner',
          shipmentTitle: r.shipment?.title || 'Logistics Route'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHomeData
};
