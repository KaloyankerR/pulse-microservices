import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { AuthenticatedRequest, JWTClaims } from '../types/api';

// JWT Authentication Middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && (authHeader as string).split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access token is required',
          code: 'TOKEN_REQUIRED',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn('Invalid token provided', {
          error: err.message,
          token: token.substring(0, 20) + '...',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        if (err.name === 'TokenExpiredError') {
          res.status(401).json({
            success: false,
            error: {
              message: 'Access token has expired',
              code: 'TOKEN_EXPIRED',
            },
            meta: {
              timestamp: new Date().toISOString(),
              version: 'v1',
            },
          });
          return;
        }

        if (err.name === 'JsonWebTokenError') {
          res.status(401).json({
            success: false,
            error: {
              message: 'Invalid access token',
              code: 'TOKEN_INVALID',
            },
            meta: {
              timestamp: new Date().toISOString(),
              version: 'v1',
            },
          });
          return;
        }

        res.status(403).json({
          success: false,
          error: {
            message: 'Access token verification failed',
            code: 'TOKEN_VERIFICATION_FAILED',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      // Add user information to request object
      req.user = decoded as JWTClaims;

      logger.info('User authenticated successfully', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        requestId: req.requestId,
      });

      next();
    });
  } catch (error) {
    logger.logError(error, { action: 'authenticateToken' });
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && (authHeader as string).split(' ')[1];

    if (!token) {
      req.user = null;
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn('Invalid optional token provided', {
          error: err.message,
          ip: req.ip,
        });
        req.user = null;
      } else {
        req.user = decoded as JWTClaims;
        logger.info('User authenticated with optional auth', {
          userId: req.user.id,
          username: req.user.username,
        });
      }
      next();
    });
  } catch (error) {
    logger.logError(error, { action: 'optionalAuth' });
    req.user = null;
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const userRole = req.user.role || 'USER';

      if (!roles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          requiredRoles: roles,
          ip: req.ip,
        });

        res.status(403).json({
          success: false,
          error: {
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      logger.info('Role authorization successful', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
      });

      next();
    } catch (error) {
      logger.logError(error, { action: 'requireRole' });
      res.status(500).json({
        success: false,
        error: {
          message: 'Authorization error',
          code: 'AUTH_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  };
};

// Resource ownership middleware
export const requireOwnership = (resourceUserIdParam = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const requestedUserId = req.params[resourceUserIdParam];
      const currentUserId = req.user.id;

      // Admin users can access any resource
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      if (requestedUserId !== currentUserId) {
        logger.warn('Resource ownership violation', {
          currentUserId,
          requestedUserId,
          ip: req.ip,
        });

        res.status(403).json({
          success: false,
          error: {
            message: 'Access denied - resource ownership required',
            code: 'RESOURCE_OWNERSHIP_REQUIRED',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      logger.info('Resource ownership verified', {
        userId: req.user.id,
        resourceUserId: requestedUserId,
      });

      next();
    } catch (error) {
      logger.logError(error, { action: 'requireOwnership' });
      res.status(500).json({
        success: false,
        error: {
          message: 'Authorization error',
          code: 'AUTH_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  };
};

