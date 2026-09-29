require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Bid = require('../models/Bid');
const Review = require('../models/Review');
const { ROLES, USER_STATUS, SHIPMENT_STATUS, BID_STATUS, MILESTONES } = require('../utils/constants');

const mongoose = require('mongoose');

const seedData = async (shouldCloseDb = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Shipment.deleteMany({}),
      Bid.deleteMany({}),
      Review.deleteMany({})
    ]);

    const salt = await bcrypt.genSalt(10);
    const hash = async (pwd) => bcrypt.hash(pwd, salt);

    // ==========================================
    // 1. Create Users
    // ==========================================
    console.log('[Seed] Seeding Users...');

    // Admin
    const adminUser = await User.create({
      name: 'Platform Administrator',
      email: 'admin@freightbid.com',
      passwordHash: await hash('Admin@123'),
      phone: '+91 98200 11001',
      role: ROLES.ADMIN,
      status: USER_STATUS.VERIFIED,
      companyName: 'LoadX Operations',
      city: 'Mumbai',
      state: 'Maharashtra',
      verifiedAt: new Date()
    });

    // 3 Verified Suppliers
    const supplier1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'supplier1@apexlogistics.com',
      passwordHash: await hash('Supplier@123'),
      phone: '+91 98201 22002',
      role: ROLES.SUPPLIER,
      status: USER_STATUS.VERIFIED,
      companyName: 'Apex Supply Chain Ltd',
      gstNumber: '27AABCA1234F1Z8',
      panNumber: 'AABCA1234F',
      address: 'Plot 42, MIDC Industrial Area, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const supplier2 = await User.create({
      name: 'Vikram Singhania',
      email: 'supplier2@bharatfab.com',
      passwordHash: await hash('Supplier@123'),
      phone: '+91 98202 33003',
      role: ROLES.SUPPLIER,
      status: USER_STATUS.VERIFIED,
      companyName: 'Bharat Fabricators Pvt Ltd',
      gstNumber: '27BBDCB5678G2Z1',
      panNumber: 'BBDCB5678G',
      address: '77 Industrial Estate, Chakan',
      city: 'Pune',
      state: 'Maharashtra',
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const supplier3 = await User.create({
      name: 'Ananya Deshmukh',
      email: 'supplier3@omniagri.com',
      passwordHash: await hash('Supplier@123'),
      phone: '+91 98203 44004',
      role: ROLES.SUPPLIER,
      status: USER_STATUS.VERIFIED,
      companyName: 'Omni Agri Commodities',
      gstNumber: '27CCDCE9012H3Z4',
      panNumber: 'CCDCE9012H',
      address: 'Market Yard Complex, Dindori Road',
      city: 'Nashik',
      state: 'Maharashtra',
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    // 5 Verified Transporters
    const transporter1 = await User.create({
      name: 'Harpreet Singh',
      email: 'transporter1@delhifleet.com',
      passwordHash: await hash('Transporter@123'),
      phone: '+91 98111 55005',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.VERIFIED,
      companyName: 'Delhi Fleet Logistics',
      gstNumber: '07AAACD1111J1Z0',
      panNumber: 'AAACD1111J',
      address: 'Sanjay Gandhi Transport Nagar, GT Karnal Road',
      city: 'Delhi',
      state: 'Delhi',
      transporterFields: {
        licenseNumber: 'DL-TR-2020-00918',
        fleetSize: 35,
        vehicleTypes: ['Truck (Open)', 'Container (Closed)', 'Trailer']
      },
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const transporter2 = await User.create({
      name: 'Ganesh Patil',
      email: 'transporter2@maharashtraexpress.com',
      passwordHash: await hash('Transporter@123'),
      phone: '+91 98222 66006',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.VERIFIED,
      companyName: 'Maharashtra Cargo Express',
      gstNumber: '27BBBCD2222K2Z2',
      panNumber: 'BBBCD2222K',
      address: 'Transport Nagar, Kalamboli, Navi Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      transporterFields: {
        licenseNumber: 'MH-TR-2019-04812',
        fleetSize: 22,
        vehicleTypes: ['Container (Closed)', 'Mini Truck / LCV']
      },
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const transporter3 = await User.create({
      name: 'K. Murugan',
      email: 'transporter3@southcorridor.com',
      passwordHash: await hash('Transporter@123'),
      phone: '+91 98333 77007',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.VERIFIED,
      companyName: 'South Corridor Carriers',
      gstNumber: '29CCCDD3333L3Z3',
      panNumber: 'CCCDD3333L',
      address: 'Electronics City Logistics Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      transporterFields: {
        licenseNumber: 'KA-TR-2021-00234',
        fleetSize: 45,
        vehicleTypes: ['Trailer (40ft)', 'Refrigerated Truck']
      },
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const transporter4 = await User.create({
      name: 'Jignesh Patel',
      email: 'transporter4@gujaratfreight.com',
      passwordHash: await hash('Transporter@123'),
      phone: '+91 98444 88008',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.VERIFIED,
      companyName: 'Gujarat Fast Freightways',
      gstNumber: '24DDDEE4444M4Z4',
      panNumber: 'DDDEE4444M',
      address: 'Aslali Bypass Ring Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      transporterFields: {
        licenseNumber: 'GJ-TR-2018-09121',
        fleetSize: 18,
        vehicleTypes: ['Truck (Open)', 'Container (Closed)']
      },
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const transporter5 = await User.create({
      name: 'Arun Nair',
      email: 'transporter5@speedways.com',
      passwordHash: await hash('Transporter@123'),
      phone: '+91 98555 99009',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.VERIFIED,
      companyName: 'National Speedways Logistics',
      gstNumber: '36EEEFF5555N5Z5',
      panNumber: 'EEEFF5555N',
      address: 'Autonagar Heavy Vehicle Park',
      city: 'Hyderabad',
      state: 'Telangana',
      transporterFields: {
        licenseNumber: 'TS-TR-2022-01290',
        fleetSize: 50,
        vehicleTypes: ['Trailer (40ft)', 'Tanker', 'Container (Closed)']
      },
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    // 2 Pending Users
    await User.create({
      name: 'Basavaraj Hiremath',
      email: 'pending1@karnatakacargo.com',
      passwordHash: await hash('Pending@123'),
      phone: '+91 98666 11223',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.PENDING,
      companyName: 'Hubballi Express Roadlines',
      gstNumber: '29FFFGG6666P6Z6',
      panNumber: 'FFFGG6666P',
      city: 'Hubballi',
      state: 'Karnataka',
      transporterFields: {
        licenseNumber: 'KA-TR-2024-00109',
        fleetSize: 12,
        vehicleTypes: ['Truck (Open)']
      }
    });

    await User.create({
      name: 'Rohan Mehra',
      email: 'pending2@steelcraft.com',
      passwordHash: await hash('Pending@123'),
      phone: '+91 98777 44556',
      role: ROLES.SUPPLIER,
      status: USER_STATUS.PENDING,
      companyName: 'Mehra Steel Craft Corp',
      gstNumber: '03GGGHH7777Q7Z7',
      panNumber: 'GGGHH7777Q',
      city: 'Ludhiana',
      state: 'Punjab'
    });

    // 1 Blocked User
    await User.create({
      name: 'Ramesh Verma',
      email: 'blocked@roguehaulage.com',
      passwordHash: await hash('Blocked@123'),
      phone: '+91 98888 77889',
      role: ROLES.TRANSPORTER,
      status: USER_STATUS.BLOCKED,
      companyName: 'Rogue Haulage Services',
      city: 'Kanpur',
      state: 'Uttar Pradesh'
    });

    console.log('[Seed] Seeded 1 Admin, 3 Suppliers, 5 Transporters, 2 Pending, 1 Blocked.');

    // ==========================================
    // 2. Create Shipments and Bids
    // ==========================================
    console.log('[Seed] Seeding Shipments in multiple states...');

    const now = new Date();

    // 1. OPEN SHIPMENT with multiple bids and tie-break simulation
    const openShipment = await Shipment.create({
      supplier: supplier1._id,
      title: 'Precision Machined Assemblies - Mumbai to Bengaluru',
      pickupLocation: {
        address: 'Gate 3, Apex Manufacturing Hub, Turbhe MIDC',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400705'
      },
      dropLocation: {
        address: 'Plot 18, Peenya 2nd Phase Industrial Area',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560058'
      },
      cargoType: 'Industrial Equipment',
      weight: 8500,
      volume: 32,
      vehicleTypeRequired: 'Trailer',
      pickupDate: new Date(now.getTime() + 48 * 3600 * 1000),
      deliveryDeadline: new Date(now.getTime() + 96 * 3600 * 1000),
      basePrice: 85000,
      specialInstructions: 'Secure waterproof tarp required. Cargo must not be double stacked.',
      biddingStart: new Date(now.getTime() - 2 * 3600 * 1000), // Started 2 hours ago
      biddingEnd: new Date(now.getTime() + 18 * 3600 * 1000), // Ends in 18 hours
      status: SHIPMENT_STATUS.OPEN
    });

    // Create bids on OPEN shipment
    const timeT1 = new Date(now.getTime() - 90 * 60 * 1000);
    const timeT2 = new Date(now.getTime() - 60 * 60 * 1000);
    const timeT3 = new Date(now.getTime() - 30 * 60 * 1000);
    const timeT4 = new Date(now.getTime() - 10 * 60 * 1000);

    await Bid.create({
      shipment: openShipment._id,
      transporter: transporter1._id,
      amount: 78000,
      status: BID_STATUS.ACTIVE,
      placedAt: timeT1,
      updatedAt: timeT1,
      lastAmountChangedAt: timeT1,
      history: [{ amount: 78000, at: timeT1 }]
    });

    await Bid.create({
      shipment: openShipment._id,
      transporter: transporter2._id,
      amount: 75000,
      status: BID_STATUS.ACTIVE,
      placedAt: timeT2,
      updatedAt: timeT2,
      lastAmountChangedAt: timeT2,
      history: [{ amount: 75000, at: timeT2 }]
    });

    await Bid.create({
      shipment: openShipment._id,
      transporter: transporter3._id,
      amount: 80000,
      status: BID_STATUS.ACTIVE,
      placedAt: timeT3,
      updatedAt: timeT3,
      lastAmountChangedAt: timeT3,
      history: [{ amount: 80000, at: timeT3 }]
    });

    await Bid.create({
      shipment: openShipment._id,
      transporter: transporter4._id,
      amount: 72000, // Lowest rank 1
      status: BID_STATUS.ACTIVE,
      placedAt: timeT4,
      updatedAt: timeT4,
      lastAmountChangedAt: timeT4,
      history: [{ amount: 74000, at: timeT4 }, { amount: 72000, at: timeT4 }]
    });

    // 2. UPCOMING SHIPMENT (starts in 12 hours)
    await Shipment.create({
      supplier: supplier2._id,
      title: 'Automotive Stamping Sheet Coils - Pune to Chennai',
      pickupLocation: {
        address: 'B-12 Automotive Cluster, Chakan Phase 2',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '410501'
      },
      dropLocation: {
        address: 'Auto Component Special Economic Zone, Oragadam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '602105'
      },
      cargoType: 'Automotive Parts',
      weight: 14000,
      vehicleTypeRequired: 'Trailer (40ft)',
      pickupDate: new Date(now.getTime() + 72 * 3600 * 1000),
      deliveryDeadline: new Date(now.getTime() + 144 * 3600 * 1000),
      basePrice: 110000,
      specialInstructions: 'Coil cradles mandatory. Air suspension preferred.',
      biddingStart: new Date(now.getTime() + 12 * 3600 * 1000),
      biddingEnd: new Date(now.getTime() + 36 * 3600 * 1000),
      status: SHIPMENT_STATUS.UPCOMING
    });

    // 3. CLOSED SHIPMENT (awaiting award by supplier)
    const closedShipment = await Shipment.create({
      supplier: supplier1._id,
      title: 'Refined Chemical Intermediates - Mumbai to Hyderabad',
      pickupLocation: {
        address: 'Plot 88, Mahape Petrochem Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400710'
      },
      dropLocation: {
        address: 'Pharma City Industrial Corridor, Mucherla',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '501509'
      },
      cargoType: 'Chemicals',
      weight: 9500,
      vehicleTypeRequired: 'Container (Closed)',
      pickupDate: new Date(now.getTime() + 24 * 3600 * 1000),
      deliveryDeadline: new Date(now.getTime() + 72 * 3600 * 1000),
      basePrice: 92000,
      specialInstructions: 'Hazchem certified vehicle and driver PPE mandatory.',
      biddingStart: new Date(now.getTime() - 48 * 3600 * 1000),
      biddingEnd: new Date(now.getTime() - 2 * 3600 * 1000), // Ended 2h ago
      status: SHIPMENT_STATUS.CLOSED
    });

    const closedBid1 = await Bid.create({
      shipment: closedShipment._id,
      transporter: transporter1._id,
      amount: 88000,
      status: BID_STATUS.ACTIVE,
      placedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      lastAmountChangedAt: new Date(now.getTime() - 24 * 3600 * 1000)
    });

    const closedBid2 = await Bid.create({
      shipment: closedShipment._id,
      transporter: transporter5._id,
      amount: 84000,
      status: BID_STATUS.ACTIVE,
      placedAt: new Date(now.getTime() - 12 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 3600 * 1000),
      lastAmountChangedAt: new Date(now.getTime() - 12 * 3600 * 1000)
    });

    // 4. AWARDED SHIPMENT
    const awardedShipment = await Shipment.create({
      supplier: supplier2._id,
      title: 'Textile Fabric Bales - Surat to Delhi NCR',
      pickupLocation: {
        address: 'Mill Gate 4, Ring Road Textile Market',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395002'
      },
      dropLocation: {
        address: 'Logistics Park, Okhla Phase 3',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110020'
      },
      cargoType: 'Textiles',
      weight: 6200,
      vehicleTypeRequired: 'Container (Closed)',
      pickupDate: new Date(now.getTime() + 24 * 3600 * 1000),
      deliveryDeadline: new Date(now.getTime() + 72 * 3600 * 1000),
      basePrice: 58000,
      biddingStart: new Date(now.getTime() - 72 * 3600 * 1000),
      biddingEnd: new Date(now.getTime() - 24 * 3600 * 1000),
      status: SHIPMENT_STATUS.AWARDED,
      awardedTo: transporter1._id,
      awardedAmount: 52000,
      awardedAt: new Date(now.getTime() - 20 * 3600 * 1000),
      currentMilestone: 'Pickup Scheduled',
      milestones: [
        { name: 'Awarded', completedAt: new Date(now.getTime() - 20 * 3600 * 1000), note: 'Shipment awarded' },
        { name: 'Pickup Scheduled', completedAt: new Date(now.getTime() - 10 * 3600 * 1000), note: 'Vehicle assigned: DL01AA4412' }
      ]
    });

    await Bid.create({
      shipment: awardedShipment._id,
      transporter: transporter1._id,
      amount: 52000,
      status: BID_STATUS.WON,
      placedAt: new Date(now.getTime() - 40 * 3600 * 1000),
      updatedAt: new Date(now.getTime() - 40 * 3600 * 1000),
      lastAmountChangedAt: new Date(now.getTime() - 40 * 3600 * 1000)
    });

    // 5. IN_PROGRESS SHIPMENT
    const inProgressShipment = await Shipment.create({
      supplier: supplier3._id,
      title: 'Agricultural Commodities Consignment - Nashik to Mumbai',
      pickupLocation: {
        address: 'APMC Market Warehouse 6',
        city: 'Nashik',
        state: 'Maharashtra',
        pincode: '422003'
      },
      dropLocation: {
        address: 'JNPT Port Container Terminal 2, Nhava Sheva',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pincode: '400707'
      },
      cargoType: 'General Merchandise',
      weight: 11000,
      vehicleTypeRequired: 'Truck (Open)',
      pickupDate: new Date(now.getTime() - 12 * 3600 * 1000),
      deliveryDeadline: new Date(now.getTime() + 12 * 3600 * 1000),
      basePrice: 42000,
      biddingStart: new Date(now.getTime() - 96 * 3600 * 1000),
      biddingEnd: new Date(now.getTime() - 48 * 3600 * 1000),
      status: SHIPMENT_STATUS.IN_PROGRESS,
      awardedTo: transporter2._id,
      awardedAmount: 37500,
      awardedAt: new Date(now.getTime() - 36 * 3600 * 1000),
      currentMilestone: 'In Transit',
      milestones: [
        { name: 'Awarded', completedAt: new Date(now.getTime() - 36 * 3600 * 1000), note: 'Carrier awarded contract' },
        { name: 'Pickup Scheduled', completedAt: new Date(now.getTime() - 24 * 3600 * 1000), note: 'Driver assigned' },
        { name: 'Picked Up', completedAt: new Date(now.getTime() - 12 * 3600 * 1000), note: 'Loaded and verified at Nashik APMC' },
        { name: 'In Transit', completedAt: new Date(now.getTime() - 4 * 3600 * 1000), note: 'Crossing Kasara Ghat toll plaza' }
      ]
    });

    // 6. DELIVERED SHIPMENT 1 (with 5-star review for Transporter 3)
    const delivered1 = await Shipment.create({
      supplier: supplier3._id,
      title: 'Perishable Table Grapes & Pomegranates - Nashik to Bengaluru Cold Chain',
      pickupLocation: {
        address: 'Grape Processing Center, Dindori Road',
        city: 'Nashik',
        state: 'Maharashtra',
        pincode: '422004'
      },
      dropLocation: {
        address: 'Yeshwanthpur Agro Terminal Cold Storage',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560022'
      },
      cargoType: 'Perishable Goods',
      weight: 7500,
      vehicleTypeRequired: 'Refrigerated Truck',
      pickupDate: new Date(now.getTime() - 7 * 86400 * 1000),
      deliveryDeadline: new Date(now.getTime() - 5 * 86400 * 1000),
      basePrice: 95000,
      biddingStart: new Date(now.getTime() - 12 * 86400 * 1000),
      biddingEnd: new Date(now.getTime() - 9 * 86400 * 1000),
      status: SHIPMENT_STATUS.DELIVERED,
      awardedTo: transporter3._id,
      awardedAmount: 89000,
      awardedAt: new Date(now.getTime() - 8 * 86400 * 1000),
      currentMilestone: 'Delivered',
      milestones: [
        { name: 'Awarded', completedAt: new Date(now.getTime() - 8 * 86400 * 1000), note: 'Awarded to South Corridor' },
        { name: 'Pickup Scheduled', completedAt: new Date(now.getTime() - 7.5 * 86400 * 1000), note: 'Reefer pre-cooled to 4°C' },
        { name: 'Picked Up', completedAt: new Date(now.getTime() - 7 * 86400 * 1000), note: 'Pallets loaded securely' },
        { name: 'In Transit', completedAt: new Date(now.getTime() - 6 * 86400 * 1000), note: 'En route via NH48' },
        { name: 'Out for Delivery', completedAt: new Date(now.getTime() - 5.2 * 86400 * 1000), note: 'Arrival at Yeshwanthpur gate' },
        { name: 'Delivered', completedAt: new Date(now.getTime() - 5 * 86400 * 1000), note: 'Consignment signed off with zero spoilage' }
      ]
    });

    await Review.create({
      shipment: delivered1._id,
      supplier: supplier3._id,
      transporter: transporter3._id,
      rating: 5,
      comment: 'Superb cold chain management. Continuous temperature logs were shared and goods arrived in pristine condition!'
    });

    // 7. DELIVERED SHIPMENT 2 (with 5-star review for Transporter 4)
    const delivered2 = await Shipment.create({
      supplier: supplier2._id,
      title: 'Structural Steel Angles and Beams - Pune to Ahmedabad',
      pickupLocation: {
        address: 'Fabrication Yard 5, Chakan',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '410501'
      },
      dropLocation: {
        address: 'Sanand Industrial GIDC Phase 2',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '382170'
      },
      cargoType: 'Construction Materials',
      weight: 16000,
      vehicleTypeRequired: 'Truck (Open)',
      pickupDate: new Date(now.getTime() - 10 * 86400 * 1000),
      deliveryDeadline: new Date(now.getTime() - 7 * 86400 * 1000),
      basePrice: 65000,
      biddingStart: new Date(now.getTime() - 15 * 86400 * 1000),
      biddingEnd: new Date(now.getTime() - 12 * 86400 * 1000),
      status: SHIPMENT_STATUS.DELIVERED,
      awardedTo: transporter4._id,
      awardedAmount: 58000,
      awardedAt: new Date(now.getTime() - 11 * 86400 * 1000),
      currentMilestone: 'Delivered',
      milestones: [
        { name: 'Awarded', completedAt: new Date(now.getTime() - 11 * 86400 * 1000) },
        { name: 'Pickup Scheduled', completedAt: new Date(now.getTime() - 10.5 * 86400 * 1000) },
        { name: 'Picked Up', completedAt: new Date(now.getTime() - 10 * 86400 * 1000) },
        { name: 'In Transit', completedAt: new Date(now.getTime() - 8 * 86400 * 1000) },
        { name: 'Out for Delivery', completedAt: new Date(now.getTime() - 7.2 * 86400 * 1000) },
        { name: 'Delivered', completedAt: new Date(now.getTime() - 7 * 86400 * 1000), note: 'Unloaded and receipt acknowledged' }
      ]
    });

    await Review.create({
      shipment: delivered2._id,
      supplier: supplier2._id,
      transporter: transporter4._id,
      rating: 5,
      comment: 'Timely transit, experienced driver, and immaculate lashing on heavy steel beams.'
    });

    // 8. DELIVERED SHIPMENT 3 (with 4-star review for Transporter 1)
    const delivered3 = await Shipment.create({
      supplier: supplier1._id,
      title: 'Consumer Electronics & Display Units - Mumbai to Delhi',
      pickupLocation: {
        address: 'Bhiwandi Warehousing Hub, Building E',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '421302'
      },
      dropLocation: {
        address: 'Okhla Logistics Center',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110020'
      },
      cargoType: 'Electronics',
      weight: 4800,
      vehicleTypeRequired: 'Container (Closed)',
      pickupDate: new Date(now.getTime() - 14 * 86400 * 1000),
      deliveryDeadline: new Date(now.getTime() - 11 * 86400 * 1000),
      basePrice: 72000,
      biddingStart: new Date(now.getTime() - 20 * 86400 * 1000),
      biddingEnd: new Date(now.getTime() - 16 * 86400 * 1000),
      status: SHIPMENT_STATUS.DELIVERED,
      awardedTo: transporter1._id,
      awardedAmount: 66000,
      awardedAt: new Date(now.getTime() - 15 * 86400 * 1000),
      currentMilestone: 'Delivered',
      milestones: [
        { name: 'Awarded', completedAt: new Date(now.getTime() - 15 * 86400 * 1000) },
        { name: 'Pickup Scheduled', completedAt: new Date(now.getTime() - 14.5 * 86400 * 1000) },
        { name: 'Picked Up', completedAt: new Date(now.getTime() - 14 * 86400 * 1000) },
        { name: 'In Transit', completedAt: new Date(now.getTime() - 12 * 86400 * 1000) },
        { name: 'Out for Delivery', completedAt: new Date(now.getTime() - 11.2 * 86400 * 1000) },
        { name: 'Delivered', completedAt: new Date(now.getTime() - 11 * 86400 * 1000) }
      ]
    });

    await Review.create({
      shipment: delivered3._id,
      supplier: supplier1._id,
      transporter: transporter1._id,
      rating: 4,
      comment: 'Safe handling of fragile electronic cargo. Slight toll plaza delay but notified us promptly.'
    });

    // 9. EXPIRED SHIPMENT (Closed with zero bids - ready for Repost!)
    await Shipment.create({
      supplier: supplier1._id,
      title: 'Specialized Cryogenic Tanks - Mumbai to Kolkata',
      pickupLocation: {
        address: 'Heavy Industrial Zone, Belapur',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400614'
      },
      dropLocation: {
        address: 'Haldia Petrochemical Complex',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '721602'
      },
      cargoType: 'Chemicals',
      weight: 18000,
      vehicleTypeRequired: 'Trailer (40ft)',
      pickupDate: new Date(now.getTime() + 48 * 3600 * 1000),
      deliveryDeadline: new Date(now.getTime() + 120 * 3600 * 1000),
      basePrice: 140000,
      biddingStart: new Date(now.getTime() - 72 * 3600 * 1000),
      biddingEnd: new Date(now.getTime() - 24 * 3600 * 1000), // Ended with 0 bids
      status: SHIPMENT_STATUS.EXPIRED
    });

    console.log('[Seed] Database seeded successfully with realistic test records!');
    console.log('================================================================');
    console.log('Admin:       admin@freightbid.com / Admin@123');
    console.log('Suppliers:   supplier1@apexlogistics.com / Supplier@123');
    console.log('             supplier2@bharatfab.com / Supplier@123');
    console.log('             supplier3@omniagri.com / Supplier@123');
    console.log('Carriers:    transporter1@delhifleet.com / Transporter@123');
    console.log('             transporter2@maharashtraexpress.com / Transporter@123');
    console.log('             transporter3@southcorridor.com / Transporter@123');
    console.log('             transporter4@gujaratfreight.com / Transporter@123');
    console.log('             transporter5@speedways.com / Transporter@123');
    console.log('Pending:     pending1@karnatakacargo.com / Pending@123');
    console.log('Blocked:     blocked@roguehaulage.com / Blocked@123');
    console.log('================================================================');

    if (shouldCloseDb) {
      await closeDB();
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
    if (shouldCloseDb) {
      await closeDB();
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = { seedData };
