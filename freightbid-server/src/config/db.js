const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongodInstance = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freightbid';

  try {
    // Attempt standard connection with 2.5s timeout
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[DB] Connected to MongoDB at ${primaryUri}`);
    return;
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB (${primaryUri}): ${err.message}`);
    console.log('[DB] Launching embedded persistent MongoDB server for development...');
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbDir = path.resolve(__dirname, '../../.mongo-data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'freightbid',
        dbPath: dbDir,
        storageEngine: 'wiredTiger'
      }
    });

    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] Successfully connected to persistent MongoDB at ${memoryUri}`);
  } catch (memErr) {
    console.error('[DB] Failed to start embedded MongoDB:', memErr.message);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[DB] Error during DB close:', err);
  }
};

module.exports = {
  connectDB,
  closeDB
};
