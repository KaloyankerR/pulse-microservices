import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// JWT Payload interface
export interface JWTPayload extends JwtPayload {
  id: string;
  userId: string;
  email: string;
  username?: string;
  role: string;
  iss?: string;
  sub?: string;
}

// Authenticated request interface
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Auth service types
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse extends TokenResponse {
  user: {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    verified?: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Password validation result
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

// User model (from Prisma)
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: string;
  banned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

