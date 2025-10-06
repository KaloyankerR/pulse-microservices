const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_notifications';
      
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      
      logger.info('Connected to MongoDB successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          message: 'Database not connected',
          timestamp: new Date().toISOString(),
        };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is active',
        timestamp: new Date().toISOString(),
        connectionInfo: this.getConnectionStatus(),
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new DatabaseConfig();
