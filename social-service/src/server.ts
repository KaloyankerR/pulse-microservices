import app from './app';
import logger from './utils/logger';
import { connectRedis } from './config/redis';
import { connectRabbitMQ, closeRabbitMQ } from './config/rabbitmq';
import eventService from './services/eventService';

const PORT = process.env.PORT || 8085;

// Initialize connections and start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to Redis
    await connectRedis();

    // Connect to RabbitMQ and start event consumers
    await connectRabbitMQ();
    await eventService.startEventConsumers();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Pulse Social Service is running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`Readiness check available at http://localhost:${PORT}/ready`);
      logger.info(`Metrics available at http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully');
  await closeRabbitMQ();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();

