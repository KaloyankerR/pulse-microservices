import { Response, NextFunction } from 'express';
import JwtUtil from '../utils/jwt';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
      return;
    }

    const token = JwtUtil.extractTokenFromHeader(authHeader);
    const decoded = JwtUtil.verifyToken(token);

    req.user = decoded;
    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message,
      },
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      try {
        const token = JwtUtil.extractTokenFromHeader(authHeader);
        const decoded = JwtUtil.verifyToken(token);
        req.user = decoded;
      } catch (tokenError: any) {
        // Silently ignore token errors for optional auth
        logger.debug('Optional auth token verification failed:', {
          error: tokenError.message,
          url: req.url,
        });
      }
    }

    next();
  } catch (error: any) {
    // For optional auth, we don't fail if token is invalid
    logger.debug('Optional auth error (ignored):', {
      error: error.message,
      url: req.url,
    });
    next();
  }
};

export const requireModerator = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userRole = req.user.role || 'USER';
    if (userRole !== 'MODERATOR') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Moderator access required',
        },
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error('Moderator authorization error:', error);
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Moderator access required',
      },
    });
  }
};

