import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import { HealthCheckResponse, RedisClient } from '../types/config';

class RedisConfig {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<RedisClientType> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis max retry attempts reached');
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      }) as RedisClientType;

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection ended');
        this.isConnected = false;
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Disconnected from Redis');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      if (!this.isConnected || !this.client) {
        return {
          status: 'unhealthy',
          message: 'Redis not connected',
          timestamp: new Date().toISOString(),
        };
      }

      // Ping Redis
      await this.client.ping();

      return {
        status: 'healthy',
        message: 'Redis connection is active',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Redis health check failed:', err);
      return {
        status: 'unhealthy',
        message: 'Redis health check failed',
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Cache methods
  async set(key: string, value: string, ttl = 3600): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.getClient();
      const value = await client.get(key);
      return value;
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      throw error;
    }
  }
}

export default new RedisConfig();

