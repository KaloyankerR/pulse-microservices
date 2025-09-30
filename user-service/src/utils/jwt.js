const jwt = require('jsonwebtoken');

class JwtUtil {
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateTokens(user) {
    const payload = {
      iss: 'pulse-user-service', // Issuer claim for Kong
      sub: user.email, // Subject claim (standard JWT)
      id: user.id,
      userId: user.id, // For post-service compatibility
      email: user.email,
      username: user.username,
      role: user.role || 'USER', // Add role claim
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    };
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
  }
}

module.exports = JwtUtil;

