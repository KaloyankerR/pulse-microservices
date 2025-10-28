import { Response, NextFunction } from 'express';
import JwtUtil from '../utils/jwt';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: (error as Error).message,
      },
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = JwtUtil.extractTokenFromHeader(authHeader);
      const decoded = JwtUtil.verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail if token is invalid
    next();
  }
};

