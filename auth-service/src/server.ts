import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 8080;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server - bind to 0.0.0.0 to allow connections from other containers
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Pulse Auth Service is running on port ${PORT}`);
  logger.info(`Health check available at http://0.0.0.0:${PORT}/health`);
  logger.info(`Metrics available at http://0.0.0.0:${PORT}/metrics`);
});

