process.env.TZ = process.env.TZ || 'Asia/Kolkata';
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initStatusCron } = require('./jobs/statusCron');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;
const User = require('./models/User');
const { seedData } = require('./seed/seed');

const startServer = async () => {
  try {
    // Connect to MongoDB (or memory server fallback)
    await connectDB();

    // Auto-seed if database is freshly started
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Seeding initial platform data...');
      await seedData(false);
    }

    // Start background status transition cron job
    initStatusCron();

    // Create HTTP server and initialize WebSocket
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 LoadX Server with WebSockets running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
};

startServer();
