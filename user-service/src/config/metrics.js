const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'pulse-user-service',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for user service
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const authenticationCounter = new client.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'],
  registers: [register],
});

const userOperationsCounter = new client.Counter({
  name: 'user_operations_total',
  help: 'Total number of user operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

const databaseOperationDuration = new client.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const activeUsersGauge = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.observe(
      { method: req.method, route },
      duration
    );

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
};

// Custom metrics methods
const metrics = {
  register,
  metricsMiddleware,

  // Authentication metrics
  incrementAuthAttempt(type, status = 'success') {
    authenticationCounter.inc({ type, status });
  },

  // User operations metrics
  incrementUserOperation(operation, status = 'success') {
    userOperationsCounter.inc({ operation, status });
  },

  // Database metrics
  recordDatabaseOperationDuration(operation, duration) {
    databaseOperationDuration.observe({ operation }, duration);
  },

  // Active users metrics
  setActiveUsers(count) {
    activeUsersGauge.set(count);
  },

  // Get all metrics as string
  async getMetrics() {
    return register.metrics();
  },
};

logger.info('Prometheus metrics configured');

module.exports = metrics;

