import mongoose, { Connection } from 'mongoose';
import logger from '../utils/logger';
import { DatabaseConnectionStatus, HealthCheckResponse } from '../types/config';

class DatabaseConfig {
  private connection: Connection | null = null;
  private isConnected = false;

  async connect(): Promise<Connection> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_notifications';

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      // @ts-ignore - mongoose connection type
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

  async disconnect(): Promise<void> {
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

  getConnectionStatus(): DatabaseConnectionStatus {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || undefined,
      port: mongoose.connection.port || undefined,
      name: mongoose.connection.name || undefined,
    };
  }

  async healthCheck(): Promise<HealthCheckResponse> {
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
        connectionInfo: this.getConnectionStatus() as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Database health check failed:', err);
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new DatabaseConfig();

