const ROLES = {
  ADMIN: 'ADMIN',
  SUPPLIER: 'SUPPLIER',
  TRANSPORTER: 'TRANSPORTER'
};

const USER_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED'
};

const SHIPMENT_STATUS = {
  UPCOMING: 'UPCOMING',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  AWARDED: 'AWARDED',
  IN_PROGRESS: 'IN_PROGRESS',
  DELIVERED: 'DELIVERED',
  EXPIRED: 'EXPIRED'
};

const BID_STATUS = {
  ACTIVE: 'ACTIVE',
  WON: 'WON',
  LOST: 'LOST'
};

const MILESTONES = [
  'Awarded',
  'Pickup Scheduled',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered'
];

module.exports = {
  ROLES,
  USER_STATUS,
  SHIPMENT_STATUS,
  BID_STATUS,
  MILESTONES
};
