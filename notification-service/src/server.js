// server.js - Entry point for production
const app = require('./app');
const logger = require('./utils/logger');
const database = require('./config/database');
const redis = require('./config/redis');
const rabbitmq = require('./config/rabbitmq');
const eventService = require('./services/eventService');

const PORT = process.env.PORT || 8086;

// Initialize services and start server
const initializeServices = async () => {
  try {
    logger.info('Initializing services...');

    // Connect to databases
    await Promise.all([
      database.connect(),
      redis.connect(),
      rabbitmq.connect(),
    ]);

    // Initialize event consumers
    await eventService.initializeConsumers(rabbitmq);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('HTTP server closed');
    }

    // Disconnect from services
    await Promise.all([
      database.disconnect(),
      redis.disconnect(),
      rabbitmq.disconnect(),
    ]);

    logger.info('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    const server = app.listen(PORT, () => {
      logger.info(`Pulse Notification Service is running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`Metrics available at http://localhost:${PORT}/metrics`);
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Start the server
let server;
startServer().then((srv) => {
  server = srv;
});

