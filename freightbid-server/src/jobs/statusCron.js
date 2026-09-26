const cron = require('node-cron');
const Shipment = require('../models/Shipment');
const { deriveAndSyncShipmentStatus } = require('../services/shipmentService');
const { SHIPMENT_STATUS } = require('../utils/constants');

let isRunning = false;

const initStatusCron = () => {
  // Run every 5 seconds to transition UPCOMING -> OPEN -> CLOSED / EXPIRED
  cron.schedule('*/5 * * * * *', async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      // Find candidate shipments that might have transitioned
      const candidateShipments = await Shipment.find({
        status: { $in: [SHIPMENT_STATUS.UPCOMING, SHIPMENT_STATUS.OPEN] }
      }).select('_id biddingStart biddingEnd status').lean();

      for (const shipment of candidateShipments) {
        await deriveAndSyncShipmentStatus(shipment);
      }
    } catch (err) {
      console.error('[CRON] Error during shipment status sync:', err.message);
    } finally {
      isRunning = false;
    }
  });

  console.log('[CRON] Shipment status watcher initialized (runs every 5s)');
};

module.exports = {
  initStatusCron
};
