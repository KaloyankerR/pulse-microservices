import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType | null> => {
  try {
    if (!process.env.REDIS_URL) {
      logger.warn('Redis URL not configured, caching will be disabled');
      return null;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL,
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    return null;
  }
};

export const getRedisClient = (): RedisClientType | null => redisClient;

