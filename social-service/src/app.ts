import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import expressWinston from 'express-winston';
import logger from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { metricsMiddleware, register } from './config/metrics';
import swaggerSpecs from './config/swagger';
import { CorsOptions } from './types';

// Import routes
import socialRoutes from './routes/social';

const app: Express = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:8085',
      'http://localhost:8086',
      'http://localhost:8000', // Kong Gateway
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

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req) => req.url === '/health' || req.url === '/ready' || req.url === '/metrics' || req.url.startsWith('/api-docs'),
}));

// Apply general rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'pulse-social-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

// Readiness check endpoint
app.get('/ready', async (_req, res) => {
  try {
    // Check database connection
    const prisma = (await import('./config/database')).default;
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        service: 'pulse-social-service',
        checks: {
          database: 'connected',
          redis: process.env.REDIS_URL ? 'configured' : 'not configured',
          rabbitmq: process.env.RABBITMQ_URL ? 'configured' : 'not configured',
        },
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is not ready',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pulse Social Service API',
}));

// API routes
app.use('/api/v1/social', socialRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Pulse Social Service API',
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

export default app;

