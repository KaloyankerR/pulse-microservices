import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests = false,
) => {
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4396fcc-f0a9-4a0d-b201-c34d196a149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rateLimiter.ts:30',message:'Rate limit exceeded handler triggered',data:{ip:req.ip,forwardedFor:req.get('X-Forwarded-For'),endpoint:req.path,method:req.method,skipSuccessfulRequests},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
  'Too many requests from this IP, please try again later.',
);

// Strict rate limiter for authentication endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 failed requests per window (increased from 20 to reduce false positives)
  'Too many authentication attempts, please try again later.',
  true, // Skip successful requests
);












