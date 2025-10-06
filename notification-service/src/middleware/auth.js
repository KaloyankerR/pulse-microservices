const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
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
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        logger.warn('Invalid token provided', { 
          error: err.message, 
          token: token.substring(0, 20) + '...',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
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
        }

        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
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
        }

        return res.status(403).json({
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
      }

      // Add user information to request object
      req.user = user;
      
      logger.info('User authenticated successfully', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
        requestId: req.requestId,
      });

      next();
    });
  } catch (error) {
    logger.logError(error, { action: 'authenticateToken' });
    return res.status(500).json({
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
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        logger.warn('Invalid optional token provided', { 
          error: err.message,
          ip: req.ip,
        });
        req.user = null;
      } else {
        req.user = user;
        logger.info('User authenticated with optional auth', {
          userId: user.id,
          username: user.username,
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
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
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
      }

      const userRole = req.user.role || 'USER';
      
      if (!roles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          requiredRoles: roles,
          ip: req.ip,
        });

        return res.status(403).json({
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
      }

      logger.info('Role authorization successful', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
      });

      next();
    } catch (error) {
      logger.logError(error, { action: 'requireRole' });
      return res.status(500).json({
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
const requireOwnership = (resourceUserIdParam = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
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
      }

      const requestedUserId = req.params[resourceUserIdParam];
      const currentUserId = req.user.id;

      // Admin users can access any resource
      if (req.user.role === 'ADMIN') {
        return next();
      }

      if (requestedUserId !== currentUserId) {
        logger.warn('Resource ownership violation', {
          currentUserId,
          requestedUserId,
          ip: req.ip,
        });

        return res.status(403).json({
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
      }

      logger.info('Resource ownership verified', {
        userId: req.user.id,
        resourceUserId: requestedUserId,
      });

      next();
    } catch (error) {
      logger.logError(error, { action: 'requireOwnership' });
      return res.status(500).json({
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

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOwnership,
};
