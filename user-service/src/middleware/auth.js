const JwtUtil = require('../utils/jwt');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
    }

    const token = JwtUtil.extractTokenFromHeader(authHeader);
    const decoded = JwtUtil.verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message,
      },
    });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // For now, we'll check if the user email is the admin email
    // In a real application, you'd have a role-based system
    const isAdmin = req.user.email === process.env.ADMIN_EMAIL;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    next();
  } catch (error) {
    logger.error('Admin authorization error:', error);
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
};

const optionalAuth = async (req, res, next) => {
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

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
};
