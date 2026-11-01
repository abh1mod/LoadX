const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware with cross-origin resource policy enabled
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS Configuration supporting default production domains, netlify apps, and comma-separated CLIENT_URL
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

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile, or requests without Origin header
    if (!origin) return callback(null, true);

    const isExplicit = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    const isNetlify = /^https:\/\/([a-zA-Z0-9_-]+\.)?netlify\.app$/.test(origin);
    const isVercel = /^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(origin);

    if (isExplicit || isNetlify || isVercel) {
      return callback(null, true);
    }

    console.warn(`[CORS] Rejected request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome & status endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'LoadX Logistics API',
    status: 'ONLINE',
    version: '1.0.0',
    healthCheck: '/api/health',
    clientApp: process.env.CLIENT_URL || 'http://localhost:5173'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'LoadX API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/public', publicRoutes);

// 404 handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found.`
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
