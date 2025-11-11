import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, TokenResponse } from '../types';

class JwtUtil {
  static generateAccessToken(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
  }

  static generateRefreshToken(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateTokens(user: { id: string; email: string; username?: string; role: string }): TokenResponse {
    const payload: JWTPayload = {
      iss: 'pulse-auth-service', // Issuer claim for Kong
      sub: user.email, // Subject claim (standard JWT)
      id: user.id,
      userId: user.id, // For post-service compatibility
      email: user.email,
      username: user.username,
      role: user.role, // Role is required
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    };
  }

  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
  }
}

export default JwtUtil;

