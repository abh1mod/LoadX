const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const { ROLES, USER_STATUS, SHIPMENT_STATUS, BID_STATUS } = require('../utils/constants');
const { deriveAndSyncShipmentStatus } = require('./shipmentService');

const DUMMY_TRANSPORTERS = [
  {
    name: 'Harpreet Singh',
    email: 'transporter1@delhifleet.com',
    phone: '+91 98111 55005',
    companyName: 'Delhi Fleet Logistics',
    city: 'Delhi',
    state: 'Delhi',
    fleetSize: 35,
    vehicleTypes: ['Truck (Open)', 'Container (Closed)', 'Trailer']
  },
  {
    name: 'Ganesh Patil',
    email: 'transporter2@maharashtraexpress.com',
    phone: '+91 98222 66006',
    companyName: 'Maharashtra Cargo Express',
    city: 'Mumbai',
    state: 'Maharashtra',
    fleetSize: 22,
    vehicleTypes: ['Container (Closed)', 'Trailer']
  },
  {
    name: 'K. R. Murthy',
    email: 'transporter3@southcorridor.com',
    phone: '+91 98444 77007',
    companyName: 'South Corridor Roadlines',
    city: 'Bengaluru',
    state: 'Karnataka',
    fleetSize: 40,
    vehicleTypes: ['Refrigerated Truck', 'Container (Closed)']
  },
  {
    name: 'Jayesh Patel',
    email: 'transporter4@gujaratfreight.com',
    phone: '+91 98980 88008',
    companyName: 'Gujarat Multi-Axle Freight',
    city: 'Ahmedabad',
    state: 'Gujarat',
    fleetSize: 18,
    vehicleTypes: ['Trailer', 'Flatbed']
  },
  {
    name: 'Balwinder Gill',
    email: 'transporter5@speedways.com',
    phone: '+91 98140 99009',
    companyName: 'Speedways Pan-India Fleet',
    city: 'Ludhiana',
    state: 'Punjab',
    fleetSize: 50,
    vehicleTypes: ['Truck (Open)', 'Container (Closed)']
  },
  {
    name: 'Vikram Rathore',
    email: 'transporter6@rajputanahaulers.com',
    phone: '+91 94140 33112',
    companyName: 'Rajputana Heavy Haulers',
    city: 'Jaipur',
    state: 'Rajasthan',
    fleetSize: 28,
    vehicleTypes: ['Truck (Open)', 'Trailer']
  },
  {
    name: 'Subhash Bose',
    email: 'transporter7@bengalexpress.com',
    phone: '+91 98300 44221',
    companyName: 'Bengal Express Transport',
    city: 'Kolkata',
    state: 'West Bengal',
    fleetSize: 30,
    vehicleTypes: ['Container (Closed)', 'Truck (Open)']
  },
  {
    name: 'Naveen Reddy',
    email: 'transporter8@deccanprime.com',
    phone: '+91 98490 55334',
    companyName: 'Deccan Prime Logistics',
    city: 'Hyderabad',
    state: 'Telangana',
    fleetSize: 45,
    vehicleTypes: ['Refrigerated Truck', 'Container (Closed)']
  },
  {
    name: 'Suresh Nair',
    email: 'transporter9@malabarcoast.com',
    phone: '+91 94470 66445',
    companyName: 'Malabar Coast Cargo',
    city: 'Kochi',
    state: 'Kerala',
    fleetSize: 20,
    vehicleTypes: ['Container (Closed)', 'Flatbed']
  },
  {
    name: 'Rameshwar Tiwari',
    email: 'transporter10@awadhfreight.com',
    phone: '+91 94150 77556',
    companyName: 'Awadh Freight Carriers',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    fleetSize: 24,
    vehicleTypes: ['Truck (Open)', 'Trailer']
  }
];

// Active simulation tracker: shipmentId -> { timers: Timeout[], startedAt, totalBids, placedBids }
const activeSimulations = new Map();

/**
 * Ensure all 10 dummy transporters exist in DB and are VERIFIED
 */
const getOrCreateDummyTransporters = async () => {
  const users = [];
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Transporter@123', salt);

  for (const item of DUMMY_TRANSPORTERS) {
    let user = await User.findOne({ email: item.email });
    if (!user) {
      user = await User.create({
        name: item.name,
        email: item.email,
        passwordHash: defaultPasswordHash,
        phone: item.phone,
        role: ROLES.TRANSPORTER,
        status: USER_STATUS.VERIFIED,
        companyName: item.companyName,
        city: item.city,
        state: item.state,
        transporterFields: {
          licenseNumber: `IN-TR-${Math.floor(1000 + Math.random() * 9000)}`,
          fleetSize: item.fleetSize,
          vehicleTypes: item.vehicleTypes
        },
        verifiedAt: new Date()
      });
    } else {
      // Ensure phone and companyName are present
      if (!user.phone || !user.companyName) {
        user.phone = user.phone || item.phone;
        user.companyName = user.companyName || item.companyName;
        await user.save();
      }
    }
    users.push(user);
  }

  return users;
};

/**
 * Check if simulation is running for a shipment
 */
const isSimulationRunning = (shipmentId) => {
  return activeSimulations.has(shipmentId.toString());
};

/**
 * Cancel any ongoing simulation for a shipment
 */
const cancelSimulation = (shipmentId) => {
  const sim = activeSimulations.get(shipmentId.toString());
  if (sim) {
    sim.timers.forEach((t) => clearTimeout(t));
    activeSimulations.delete(shipmentId.toString());
    return true;
  }
  return false;
};

/**
 * Place a single dummy bid
 */
const placeSingleDummyBid = async (shipmentId, transporter, amount, expectedHours) => {
  try {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return false;

    // Verify shipment is still OPEN
    await deriveAndSyncShipmentStatus(shipment);
    if (shipment.status !== SHIPMENT_STATUS.OPEN) {
      cancelSimulation(shipmentId);
      return false;
    }

    const now = new Date();

    let existingBid = await Bid.findOne({
      shipment: shipment._id,
      transporter: transporter._id
    });

    if (existingBid) {
      existingBid.amount = amount;
      existingBid.expectedDeliveryHours = expectedHours;
      existingBid.status = BID_STATUS.ACTIVE;
      existingBid.updatedAt = now;
      existingBid.lastAmountChangedAt = now;
      existingBid.history.push({
        amount,
        expectedDeliveryHours: expectedHours,
        at: now
      });
      await existingBid.save();
    } else {
      await Bid.create({
        shipment: shipment._id,
        transporter: transporter._id,
        amount,
        expectedDeliveryHours: expectedHours,
        status: BID_STATUS.ACTIVE,
        placedAt: now,
        updatedAt: now,
        lastAmountChangedAt: now,
        history: [{
          amount,
          expectedDeliveryHours: expectedHours,
          at: now
        }]
      });
    }

    return true;
  } catch (err) {
    console.error(`[Simulation] Error placing bid for ${transporter.name}:`, err);
    return false;
  }
};

/**
 * Run a 1-minute bidding simulation for an ongoing OPEN shipment
 * Inserts 10 dummy bids staggered across 60 seconds
 */
const startBiddingSimulation = async (shipmentId) => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error('Shipment not found');
  }

  await deriveAndSyncShipmentStatus(shipment);
  if (shipment.status !== SHIPMENT_STATUS.OPEN) {
    throw new Error(`Simulation can only run on OPEN ongoing shipments. Current status: ${shipment.status}`);
  }

  if (isSimulationRunning(shipmentId)) {
    throw new Error('A bidding simulation is already active for this shipment.');
  }

  // 1. Ensure 10 dummy transporter profiles exist
  const dummyTransporters = await getOrCreateDummyTransporters();

  // 2. Determine base conditions entered by shipper
  const basePrice = shipment.basePrice && shipment.basePrice > 0 ? shipment.basePrice : 60000;

  let baseHours = 48;
  if (shipment.pickupDate && shipment.deliveryDeadline) {
    const p = new Date(shipment.pickupDate);
    const d = new Date(shipment.deliveryDeadline);
    const diffHours = Math.round((d.getTime() - p.getTime()) / (1000 * 60 * 60));
    if (diffHours > 0) {
      baseHours = diffHours;
    }
  }

  // 3. Pre-calculate 10 competitive bids (progressively undercutting to demonstrate reverse auction re-ranking)
  // Percentages of basePrice (descending ladder so rank #1 continuously shifts!)
  const priceFactors = [0.96, 0.93, 0.90, 0.88, 0.85, 0.83, 0.80, 0.77, 0.75, 0.72];
  const hourOffsets = [2, -1, 0, 3, -2, 1, -3, 0, -1, -4];

  const simulationBids = dummyTransporters.map((transporter, idx) => {
    // Add small variation (± ₹200) to keep realistic variety
    const rawAmount = Math.round((basePrice * priceFactors[idx]) / 100) * 100;
    const amount = Math.min(basePrice, Math.max(1000, rawAmount));
    const expectedHours = Math.max(4, baseHours + hourOffsets[idx]);

    return {
      transporter,
      amount,
      expectedHours
    };
  });

  const timers = [];
  const simState = {
    shipmentId: shipmentId.toString(),
    startedAt: new Date(),
    totalBids: 10,
    bidsPlaced: 0,
    timers
  };

  activeSimulations.set(shipmentId.toString(), simState);

  // 4. Stagger across 1 minute (60,000 ms)
  // Step 0: immediate (0s)
  // Step 1: 6s, Step 2: 12s, Step 3: 18s, Step 4: 24s, Step 5: 30s,
  // Step 6: 36s, Step 7: 42s, Step 8: 48s, Step 9: 54s
  const intervalMs = 6000; // 6 seconds

  simulationBids.forEach((bidItem, index) => {
    const delay = index * intervalMs;

    if (delay === 0) {
      // Execute 1st bid immediately for instant shipper feedback
      placeSingleDummyBid(shipmentId, bidItem.transporter, bidItem.amount, bidItem.expectedHours).then((ok) => {
        if (ok) simState.bidsPlaced += 1;
      });
    } else {
      const timer = setTimeout(async () => {
        const ok = await placeSingleDummyBid(shipmentId, bidItem.transporter, bidItem.amount, bidItem.expectedHours);
        if (ok) simState.bidsPlaced += 1;

        // If this is the last bid, clean up simulation tracker
        if (index === simulationBids.length - 1) {
          activeSimulations.delete(shipmentId.toString());
        }
      }, delay);

      timers.push(timer);
    }
  });

  return {
    success: true,
    message: 'Bidding simulation initiated! 10 dummy transporter bids will be placed over the next 60 seconds.',
    totalBids: 10,
    durationSeconds: 60,
    intervalSeconds: 6
  };
};

module.exports = {
  DUMMY_TRANSPORTERS,
  getOrCreateDummyTransporters,
  startBiddingSimulation,
  isSimulationRunning,
  cancelSimulation
};
