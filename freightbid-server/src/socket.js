const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  const defaultOrigins = [
    'https://loadxport.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  const rawClientUrls = process.env.CLIENT_URL || '';
  const envOrigins = rawClientUrls
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isExplicit = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
        const isNetlify = /^https:\/\/([a-zA-Z0-9_-]+\.)?netlify\.app$/.test(origin);
        const isVercel = /^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(origin);
        if (isExplicit || isNetlify || isVercel) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    // Client joins a shipment room to receive live bids and milestone events
    socket.on('join_shipment', (shipmentId) => {
      if (shipmentId) {
        const room = `shipment:${shipmentId}`;
        socket.join(room);
      }
    });

    socket.on('leave_shipment', (shipmentId) => {
      if (shipmentId) {
        const room = `shipment:${shipmentId}`;
        socket.leave(room);
      }
    });

    socket.on('disconnect', () => {
      // Room memberships are cleaned up by Socket.io automatically
    });
  });

  return io;
};

const getIO = () => io;

/**
 * Broadcast live bids / leaderboard updates to everyone in the shipment room
 */
const emitBidsUpdate = (shipmentId, payload) => {
  if (io && shipmentId) {
    io.to(`shipment:${shipmentId}`).emit('bids_updated', payload);
  }
};

/**
 * Broadcast milestone progression updates to everyone in the shipment room
 */
const emitMilestoneUpdate = (shipmentId, payload) => {
  if (io && shipmentId) {
    io.to(`shipment:${shipmentId}`).emit('milestone_updated', payload);
  }
};

/**
 * Broadcast general shipment state updates (status changes, awarded, closed, etc.)
 */
const emitShipmentUpdate = (shipmentId, payload) => {
  if (io && shipmentId) {
    io.to(`shipment:${shipmentId}`).emit('shipment_updated', payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitBidsUpdate,
  emitMilestoneUpdate,
  emitShipmentUpdate
};
