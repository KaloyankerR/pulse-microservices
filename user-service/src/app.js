require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const expressWinston = require('express-winston');
const passport = require('passport');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const swaggerSpecs = require('./config/swagger');
const sessionConfig = require('./config/session');

// Initialize Passport
require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(sessionConfig);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req) => req.url === '/health' || req.url.startsWith('/api-docs'),
}));

// Apply general rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'pulse-user-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pulse User Service API',
}));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// OAuth failure route
app.get('/auth/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: {
      code: 'OAUTH_FAILURE',
      message: 'OAuth authentication failed',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Pulse User Service API',
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/health',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} - {{err.message}}',
}));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Pulse User Service is running on port ${PORT}`);
  logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;
