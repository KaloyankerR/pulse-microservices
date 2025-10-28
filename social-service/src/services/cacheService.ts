import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

class CacheService {
  private defaultTTL: number;

  constructor() {
    this.defaultTTL = 3600; // 1 hour
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      if (!client) return null;

      const data = await client.get(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, ttl = this.defaultTTL): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Cache keys
  getFollowersKey(userId: string): string {
    return `followers:${userId}`;
  }

  getFollowingKey(userId: string): string {
    return `following:${userId}`;
  }

  getSocialStatsKey(userId: string): string {
    return `stats:${userId}`;
  }

  getRecommendationsKey(userId: string): string {
    return `recommendations:${userId}`;
  }
}

export default new CacheService();

