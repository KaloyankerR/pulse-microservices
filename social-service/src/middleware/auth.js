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
  optionalAuth,
};

