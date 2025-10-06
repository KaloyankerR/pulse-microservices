require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const expressWinston = require('express-winston');

// Import configurations
const database = require('./config/database');
const redis = require('./config/redis');
const rabbitmq = require('./config/rabbitmq');
const metrics = require('./config/metrics');

// Import services
const eventService = require('./services/eventService');

// Import utilities
const logger = require('./utils/logger');

// Import middleware
const { errorHandler, notFound, initializeErrorHandlers } = require('./middleware/errorHandler');
const { generalLimiter, healthCheckLimiter, metricsLimiter } = require('./middleware/rateLimiter');
const { requestMetrics, healthCheckMetrics } = require('./middleware/metrics');

// Import routes
const notificationRoutes = require('./routes/notifications');

// Create Express app
const app = express();
const PORT = process.env.PORT || 8086;

// Initialize error handlers
initializeErrorHandlers();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:8080', // Allow Swagger UI direct access
      'http://localhost:8086', // Allow service direct access
      'http://localhost:8000', // Allow Kong Gateway
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req) => req.url === '/health' || req.url.startsWith('/api-docs') || req.url === '/metrics',
}));

// Add request ID to logs
app.use(logger.addRequestId);

// Apply general rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', healthCheckLimiter, healthCheckMetrics, async (req, res) => {
  try {
    const [dbHealth, redisHealth, rabbitmqHealth] = await Promise.all([
      database.healthCheck(),
      redis.healthCheck(),
      rabbitmq.healthCheck(),
    ]);

    const overallStatus = dbHealth.status === 'healthy' && 
                         redisHealth.status === 'healthy' && 
                         rabbitmqHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus === 'healthy',
      data: {
        status: overallStatus,
        service: 'pulse-notification-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: dbHealth,
          redis: redisHealth,
          rabbitmq: rabbitmqHealth,
        },
        eventConsumers: eventService.getConsumerStatus(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  } catch (error) {
    logger.logError(error, { action: 'healthCheck' });
    
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        service: 'pulse-notification-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  }
});

// Readiness check endpoint
app.get('/ready', healthCheckLimiter, async (req, res) => {
  try {
    // Check if all required services are connected
    const [dbHealth, redisHealth, rabbitmqHealth] = await Promise.all([
      database.healthCheck(),
      redis.healthCheck(),
      rabbitmq.healthCheck(),
    ]);

    const isReady = dbHealth.status === 'healthy' && 
                   redisHealth.status === 'healthy' && 
                   rabbitmqHealth.status === 'healthy';

    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      success: isReady,
      data: {
        ready: isReady,
        service: 'pulse-notification-service',
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  } catch (error) {
    logger.logError(error, { action: 'readinessCheck' });
    
    res.status(503).json({
      success: false,
      data: {
        ready: false,
        service: 'pulse-notification-service',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  }
});

// Metrics endpoint
app.get('/metrics', metricsLimiter, async (req, res) => {
  try {
    const metricsData = await metrics.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metricsData);
  } catch (error) {
    logger.logError(error, { action: 'getMetrics' });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve metrics',
        code: 'METRICS_ERROR',
      },
    });
  }
});

// API documentation (Swagger)
const swaggerSpecs = {
  openapi: '3.0.0',
  info: {
    title: 'Pulse Notification Service API',
    version: '1.0.0',
    description: 'Notification microservice for Pulse social media platform',
    contact: {
      name: 'Pulse Team',
      email: 'support@pulse.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Error message',
              },
              code: {
                type: 'string',
                example: 'ERROR_CODE',
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              version: {
                type: 'string',
                example: 'v1',
              },
            },
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              version: {
                type: 'string',
                example: 'v1',
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Notifications',
      description: 'Notification management endpoints',
    },
    {
      name: 'Notification Preferences',
      description: 'User notification preferences management',
    },
  ],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pulse Notification Service API',
}));

// Apply request metrics middleware to all routes
app.use(requestMetrics);

// API routes
app.use('/api/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Pulse Notification Service API',
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
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

// Export the app for testing or use by server.js
module.exports = app;
