// server.ts - Entry point for production
import app from './app';
import logger from './utils/logger';
import database from './config/database';
import redis from './config/redis';
import rabbitmq from './config/rabbitmq';
import eventService from './services/eventService';
import { Server } from 'http';

const PORT = process.env.PORT || 8086;

// Initialize services and start server
const initializeServices = async (): Promise<void> => {
  try {
    logger.info('Initializing services...');

    // Connect to databases
    await Promise.all([database.connect(), redis.connect(), rabbitmq.connect()]);

    // Initialize event consumers
    await eventService.initializeConsumers(rabbitmq);

    logger.info('All services initialized successfully');
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to initialize services', { error: err.message });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string, server: Server): Promise<void> => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Force close after 30 seconds if shutdown doesn't complete
  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    // Close server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    // Disconnect from services
    await Promise.all([database.disconnect(), redis.disconnect(), rabbitmq.disconnect()]);

    clearTimeout(forceShutdownTimeout);
    logger.info('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdownTimeout);
    const err = error as Error;
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<Server> => {
  try {
    await initializeServices();

    const server = app.listen(PORT, () => {
      logger.info(`Pulse Notification Service is running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`Metrics available at http://localhost:${PORT}/metrics`);
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));

    return server;
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

// Start the server
startServer().then((server) => {
  // Server is started
  logger.info('Server startup completed');
});

