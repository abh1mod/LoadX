const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const { ROLES, USER_STATUS, SHIPMENT_STATUS, BID_STATUS } = require('../utils/constants');
const { deriveAndSyncShipmentStatus } = require('./shipmentService');

// Pool of 15 dedicated dummy transporters (Harpreet Singh / transporter1@delhifleet.com is explicitly excluded)
const DUMMY_TRANSPORTERS = [
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
  },
  {
    name: 'Gurpreet Sandhu',
    email: 'transporter11@punjabstar.com',
    phone: '+91 98720 11998',
    companyName: 'Punjab Star Roadways',
    city: 'Amritsar',
    state: 'Punjab',
    fleetSize: 32,
    vehicleTypes: ['Truck (Open)', 'Container (Closed)']
  },
  {
    name: 'Dharmendra Shah',
    email: 'transporter12@girnarfreight.com',
    phone: '+91 98250 88776',
    companyName: 'Girnar Freight Lines',
    city: 'Surat',
    state: 'Gujarat',
    fleetSize: 26,
    vehicleTypes: ['Trailer', 'Container (Closed)']
  },
  {
    name: 'Anand Deshmukh',
    email: 'transporter13@sahyadrilogistics.com',
    phone: '+91 98230 66554',
    companyName: 'Sahyadri Express Logistics',
    city: 'Nagpur',
    state: 'Maharashtra',
    fleetSize: 29,
    vehicleTypes: ['Container (Closed)', 'Truck (Open)']
  },
  {
    name: 'Pradeep Swain',
    email: 'transporter14@kalingafleet.com',
    phone: '+91 94370 22331',
    companyName: 'Kalinga Fleet Operators',
    city: 'Bhubaneswar',
    state: 'Odisha',
    fleetSize: 21,
    vehicleTypes: ['Truck (Open)', 'Trailer']
  },
  {
    name: 'Muthu Raman',
    email: 'transporter15@coromandelfreight.com',
    phone: '+91 98400 33442',
    companyName: 'Coromandel Heavy Movers',
    city: 'Chennai',
    state: 'Tamil Nadu',
    fleetSize: 36,
    vehicleTypes: ['Container (Closed)', 'Trailer']
  },
  {
    name: 'Ajay Verma',
    email: 'transporter16@indorecentral.com',
    phone: '+91 98260 55112',
    companyName: 'Indore Central Logistics',
    city: 'Indore',
    state: 'Madhya Pradesh',
    fleetSize: 25,
    vehicleTypes: ['Truck (Open)', 'Flatbed']
  }
];

// Active simulation tracker: shipmentId -> { timers: Timeout[], startedAt, totalBids, placedBids }
const activeSimulations = new Map();

/**
 * Ensure all dummy transporters exist in DB and are VERIFIED
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
 * Place a single dummy bid (always creates a new active bid for the simulated transporter)
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
 * Guarantees that any real user who already placed a bid is NEVER overwritten!
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

  // 1. Find all transporters who have ALREADY placed active bids on this shipment
  const existingActiveBids = await Bid.find({
    shipment: shipmentId,
    status: BID_STATUS.ACTIVE
  }).select('transporter amount').lean();

  const existingTransporterIds = new Set(
    existingActiveBids
      .map((b) => (b.transporter ? b.transporter.toString() : null))
      .filter(Boolean)
  );

  // 2. Ensure dummy transporter profiles exist
  const allDummyTransporters = await getOrCreateDummyTransporters();

  // 3. Filter out:
  //    - Harpreet Singh ('transporter1@delhifleet.com') explicitly excluded
  //    - Any transporter that has ALREADY placed a bid on this consignment
  const availableTransporters = allDummyTransporters.filter((t) => {
    if (t.email === 'transporter1@delhifleet.com') return false;
    if (existingTransporterIds.has(t._id.toString())) return false;
    return true;
  });

  if (availableTransporters.length < 10) {
    throw new Error('Insufficient unique dummy transporters available to run simulation.');
  }

  // Select 10 distinct transporters that have NO prior bid on this shipment
  const selectedTransporters = availableTransporters.slice(0, 10);

  // 4. Determine base conditions entered by shipper
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

  // 5. Pre-calculate 10 competitive bids (progressively undercutting to demonstrate reverse auction re-ranking)
  const priceFactors = [0.89, 0.96, 0.82, 0.94, 0.78, 0.87, 0.92, 0.76, 0.85, 0.74];
  const hourOffsets = [2, -1, 0, 3, -2, 1, -3, 0, -1, -4];

  const simulationBids = selectedTransporters.map((transporter, idx) => {
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

  // 6. Stagger across 1 minute (60,000 ms)
  // Step 0: immediate (0s)
  // Steps 1 to 9: every 6 seconds
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
