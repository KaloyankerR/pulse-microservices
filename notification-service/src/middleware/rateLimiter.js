const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');
const logger = require('../utils/logger');

// Redis store for rate limiting (if available)
const createRedisStore = () => {
  try {
    const client = redis.getClient();
    
    return {
      async increment(key, windowMs) {
        try {
          const pipeline = client.multi();
          const now = Date.now();
          const window = Math.floor(now / windowMs);
          const redisKey = `rate_limit:${key}:${window}`;
          
          pipeline.incr(redisKey);
          pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
          
          const results = await pipeline.exec();
          return results[0][1]; // Return the count
        } catch (error) {
          logger.warn('Redis rate limit store error', { error: error.message });
          return 1; // Fallback to allowing the request
        }
      },
      
      async decrement(key, windowMs) {
        try {
          const now = Date.now();
          const window = Math.floor(now / windowMs);
          const redisKey = `rate_limit:${key}:${window}`;
          
          await client.decr(redisKey);
        } catch (error) {
          logger.warn('Redis rate limit decrement error', { error: error.message });
        }
      },
      
      async resetKey(key, windowMs) {
        try {
          const now = Date.now();
          const window = Math.floor(now / windowMs);
          const redisKey = `rate_limit:${key}:${window}`;
          
          await client.del(redisKey);
        } catch (error) {
          logger.warn('Redis rate limit reset error', { error: error.message });
        }
      }
    };
  } catch (error) {
    logger.warn('Redis not available for rate limiting, using memory store', { error: error.message });
    return null;
  }
};

// Custom key generator that includes user ID when available
const keyGenerator = (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${req.ip}`;
};

// Custom skip function for authenticated users with higher limits
const skipFunction = (req) => {
  // Skip rate limiting for admin users
  if (req.user && req.user.role === 'ADMIN') {
    return true;
  }
  return false;
};

// General rate limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Higher limits for authenticated users
    if (req.user && req.user.id) {
      return 200;
    }
    return 100;
  },
  keyGenerator,
  skip: skipFunction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  },
});

// Strict rate limiter for authentication endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator,
  skip: skipFunction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  },
});

// API rate limiter for general API endpoints (300 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Higher limits for authenticated users
    if (req.user && req.user.id) {
      return 500;
    }
    return 300;
  },
  keyGenerator,
  skip: skipFunction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'API rate limit exceeded, please try again later',
      code: 'API_RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'API rate limit exceeded, please try again later',
        code: 'API_RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  },
});

// Notification creation rate limiter (10 notifications per minute per user)
const notificationCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator,
  skip: skipFunction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many notification requests, please try again later',
      code: 'NOTIFICATION_RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
  handler: (req, res) => {
    logger.warn('Notification creation rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many notification requests, please try again later',
        code: 'NOTIFICATION_RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  },
});

// Preferences update rate limiter (5 updates per minute per user)
const preferencesUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator,
  skip: skipFunction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many preference updates, please try again later',
      code: 'PREFERENCES_RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
  handler: (req, res) => {
    logger.warn('Preferences update rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many preference updates, please try again later',
        code: 'PREFERENCES_RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  },
});

// Health check rate limiter (very permissive)
const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 1 request per second
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message: 'Health check rate limit exceeded',
      code: 'HEALTH_CHECK_RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
});

// Metrics endpoint rate limiter (very restrictive)
const metricsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Metrics endpoint rate limit exceeded',
      code: 'METRICS_RATE_LIMIT_EXCEEDED',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  },
  handler: (req, res) => {
    logger.warn('Metrics rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Metrics endpoint rate limit exceeded',
        code: 'METRICS_RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  },
});

// Dynamic rate limiter factory
const createRateLimiter = (options) => {
  const defaultOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skip: skipFunction,
    message: {
      success: false,
      error: {
        message: 'Rate limit exceeded, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    },
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  notificationCreationLimiter,
  preferencesUpdateLimiter,
  healthCheckLimiter,
  metricsLimiter,
  createRateLimiter,
};
