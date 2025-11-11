import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import winston from 'winston';
import expressWinston from 'express-winston';
import logger from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import metrics from './config/metrics';
import authRoutes from './routes/auth';

const app: Express = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:8080', // Allow Swagger UI direct access
      'http://localhost:8087', // Allow Docker service access
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
  ignoreRoute: (req) => req.url === '/health' || req.url === '/metrics' || req.url.startsWith('/api-docs'),
}));

// Metrics middleware
app.use(metrics.metricsMiddleware);

// Apply general rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'pulse-auth-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    const metricsOutput = await metrics.getMetrics();
    res.end(metricsOutput);
  } catch (error: any) {
    res.status(500).end(error.message);
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Pulse Auth Service API',
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/health',
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








