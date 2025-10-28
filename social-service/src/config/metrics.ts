import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const followOperationsTotal = new client.Counter({
  name: 'follow_operations_total',
  help: 'Total number of follow/unfollow operations',
  labelNames: ['operation', 'status'],
});

const blockOperationsTotal = new client.Counter({
  name: 'block_operations_total',
  help: 'Total number of block/unblock operations',
  labelNames: ['operation', 'status'],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(followOperationsTotal);
register.registerMetric(blockOperationsTotal);

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
};

export {
  register,
  followOperationsTotal,
  blockOperationsTotal,
};

