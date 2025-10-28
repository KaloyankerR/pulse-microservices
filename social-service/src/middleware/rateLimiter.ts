import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import logger from '../utils/logger';
import { Request, Response } from 'express';

const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests = false
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      });
    },
  });
};

// General API rate limiter
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this IP, please try again later.'
);

// Social operations rate limiter
export const socialLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests per window
  'Too many social operations, please try again later.'
);

