import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import redis from '../config/redis';
import logger from '../utils/logger';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/api';

interface RedisStore {
  increment(key: string, windowMs: number): Promise<number>;
  decrement(key: string, windowMs: number): Promise<void>;
  resetKey(key: string, windowMs: number): Promise<void>;
}

// Redis store for rate limiting (if available)
const createRedisStore = (): RedisStore | null => {
  try {
    const client = redis.getClient();

    return {
      async increment(key: string, windowMs: number): Promise<number> {
        try {
          const multi = client.multi();
          const now = Date.now();
          const window = Math.floor(now / windowMs);
          const redisKey = `rate_limit:${key}:${window}`;

          multi.incr(redisKey);
          multi.expire(redisKey, Math.ceil(windowMs / 1000));

          const results = await multi.exec();
          // Results format: [[null, count], [null, result]]
          if (results && results[0] && Array.isArray(results[0])) {
            return (results[0][1] as number) || 1;
          }
          return 1;
        } catch (error) {
          const err = error as Error;
          logger.warn('Redis rate limit store error', { error: err.message });
          return 1; // Fallback to allowing the request
        }
      },

      async decrement(key: string, windowMs: number): Promise<void> {
        try {
          const now = Date.now();
          const window = Math.floor(now / windowMs);
          const redisKey = `rate_limit:${key}:${window}`;

          await client.decr(redisKey);
        } catch (error) {
          const err = error as Error;
          logger.warn('Redis rate limit decrement error', { error: err.message });
        }
      },

      async resetKey(key: string, windowMs: number): Promise<void> {
        try {
          const now = Date.now();
          const window = Math.floor(now / windowMs);
          const redisKey = `rate_limit:${key}:${window}`;

          await redis.del(redisKey);
        } catch (error) {
          const err = error as Error;
          logger.warn('Redis rate limit reset error', { error: err.message });
        }
      },
    };
  } catch (error) {
    const err = error as Error;
    logger.warn('Redis not available for rate limiting, using memory store', { error: err.message });
    return null;
  }
};

// Custom key generator that includes user ID when available
const keyGenerator = (req: AuthenticatedRequest): string => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${req.ip}`;
};

// Custom skip function for authenticated users with higher limits
const skipFunction = (req: AuthenticatedRequest): boolean => {
  // Skip rate limiting for admin users
  if (req.user && req.user.role === 'ADMIN') {
    return true;
  }
  return false;
};

// General rate limiter (100 requests per 15 minutes)
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    // Higher limits for authenticated users
    if (authReq.user && authReq.user.id) {
      return 200;
    }
    return 100;
  },
  keyGenerator: keyGenerator as (req: Request) => string,
  skip: skipFunction as (req: Request) => boolean,
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
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn('Rate limit exceeded', {
      ip: authReq.ip,
      userId: authReq.user?.id,
      userAgent: authReq.get('User-Agent'),
      requestId: authReq.requestId,
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
} as unknown as Options);

// Strict rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: keyGenerator as (req: Request) => string,
  skip: skipFunction as (req: Request) => boolean,
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
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn('Auth rate limit exceeded', {
      ip: authReq.ip,
      userId: authReq.user?.id,
      userAgent: authReq.get('User-Agent'),
      requestId: authReq.requestId,
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
} as unknown as Options);

// API rate limiter for general API endpoints (300 requests per 15 minutes)
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    // Higher limits for authenticated users
    if (authReq.user && authReq.user.id) {
      return 500;
    }
    return 300;
  },
  keyGenerator: keyGenerator as (req: Request) => string,
  skip: skipFunction as (req: Request) => boolean,
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
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn('API rate limit exceeded', {
      ip: authReq.ip,
      userId: authReq.user?.id,
      userAgent: authReq.get('User-Agent'),
      requestId: authReq.requestId,
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
} as unknown as Options);

// Notification creation rate limiter (10 notifications per minute per user)
export const notificationCreationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: keyGenerator as (req: Request) => string,
  skip: skipFunction as (req: Request) => boolean,
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
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn('Notification creation rate limit exceeded', {
      ip: authReq.ip,
      userId: authReq.user?.id,
      userAgent: authReq.get('User-Agent'),
      requestId: authReq.requestId,
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
} as unknown as Options);

// Preferences update rate limiter (5 updates per minute per user)
export const preferencesUpdateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: keyGenerator as (req: Request) => string,
  skip: skipFunction as (req: Request) => boolean,
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
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    logger.warn('Preferences update rate limit exceeded', {
      ip: authReq.ip,
      userId: authReq.user?.id,
      userAgent: authReq.get('User-Agent'),
      requestId: authReq.requestId,
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
} as unknown as Options);

// Health check rate limiter (very permissive)
export const healthCheckLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 1 request per second
  keyGenerator: (req: Request) => req.ip,
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
} as unknown as Options);

// Metrics endpoint rate limiter (very restrictive)
export const metricsLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: (req: Request) => req.ip,
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
  handler: (req: Request, res: Response) => {
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
} as unknown as Options);

// Dynamic rate limiter factory
export const createRateLimiter = (options: Partial<Options>): RateLimitRequestHandler => {
  const defaultOptions: Partial<Options> = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator as (req: Request) => string,
    skip: skipFunction as (req: Request) => boolean,
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
  } as unknown as Options);
};

