import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// JWT Payload interface
export interface JWTPayload extends JwtPayload {
  id: string;
  userId: string;
  email: string;
  username?: string;
  role?: string;
  iss?: string;
  sub?: string;
}

// Authenticated request interface
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// User profile types
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt?: Date;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  followedAt?: Date; // For follow lists
}

export interface CreateProfileRequest {
  id: string;
  username: string;
  displayName?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface SearchUsersResponse {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FollowResponse {
  followers: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

