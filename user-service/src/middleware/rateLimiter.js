const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
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
    handler: (req, res) => {
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
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  20, // 20 requests per window (increased from 5)
  'Too many authentication attempts, please try again later.',
  true // Skip successful requests
);

// Moderate rate limiter for user operations
const userLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests per window (increased from 50)
  'Too many user operations, please try again later.'
);

module.exports = {
  generalLimiter,
  authLimiter,
  userLimiter,
};

