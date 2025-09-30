const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    try {
      const client = getRedisClient();
      if (!client) return null;

      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
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

  async delete(key) {
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

  async deletePattern(pattern) {
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
  getFollowersKey(userId) {
    return `followers:${userId}`;
  }

  getFollowingKey(userId) {
    return `following:${userId}`;
  }

  getSocialStatsKey(userId) {
    return `stats:${userId}`;
  }

  getRecommendationsKey(userId) {
    return `recommendations:${userId}`;
  }
}

module.exports = new CacheService();

