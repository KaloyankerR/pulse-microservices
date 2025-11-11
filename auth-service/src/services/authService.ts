import prisma from '../config/database';
import JwtUtil from '../utils/jwt';
import BcryptUtil from '../utils/bcrypt';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import axios from 'axios';
import {
  RegisterRequest, LoginRequest, TokenResponse, LoginResponse, User,
} from '../types';

class AuthService {
  private userServiceUrl: string;

  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8081';
  }

  async register(userData: RegisterRequest): Promise<User> {
    const { email, username, password, displayName } = userData;

    try {
      // Check if user already exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
      }

      // Note: Username uniqueness check will be done by user-service
      // This allows better separation of concerns

      // Validate password strength
      const passwordValidation = BcryptUtil.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          400,
          'WEAK_PASSWORD',
        );
      }

      // Hash password
      const hashedPassword = await BcryptUtil.hashPassword(password);

      // Create user in auth database
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'USER',
          banned: false,
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Call user-service to create profile
      try {
        logger.info('Creating user profile in user-service', {
          userId: user.id,
          username,
          displayName: displayName || username,
          userServiceUrl: this.userServiceUrl,
        });

        const axios = require('axios');
        const profileResponse = await axios.post(
          `${this.userServiceUrl}/api/v1/users/create-profile`,
          {
            id: user.id,
            username,
            displayName: displayName || username,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );

        logger.info('Profile created successfully in user-service', {
          userId: user.id,
          username,
          responseStatus: profileResponse.status,
        });
      } catch (profileError: any) {
        // Log detailed error information
        logger.error('Profile creation failed, rolling back user creation', {
          userId: user.id,
          username,
          error: profileError.message,
          status: profileError.response?.status,
          statusText: profileError.response?.statusText,
          responseData: profileError.response?.data,
          code: profileError.code,
          userServiceUrl: this.userServiceUrl,
        });

        // If profile creation fails, rollback user creation
        try {
          await prisma.user.delete({ where: { id: user.id } });
          logger.info('User creation rolled back successfully', { userId: user.id });
        } catch (rollbackError: any) {
          logger.error('Failed to rollback user creation', {
            userId: user.id,
            error: rollbackError.message,
          });
        }

        // Handle specific error cases
        if (profileError.response?.status === 409) {
          throw new AppError('Username already exists', 409, 'USERNAME_EXISTS');
        }
        if (profileError.response?.status === 400) {
          const errorMessage = profileError.response?.data?.error?.message || 'Invalid profile data';
          throw new AppError(errorMessage, 400, 'INVALID_PROFILE_DATA');
        }
        if (profileError.code === 'ECONNREFUSED' || profileError.code === 'ETIMEDOUT') {
          throw new AppError('User service is unavailable', 503, 'SERVICE_UNAVAILABLE');
        }

        throw new AppError(
          `Failed to create user profile: ${profileError.message || 'Unknown error'}`,
          500,
          'PROFILE_CREATION_FAILED',
        );
      }

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return user;
    } catch (error: any) {
      logger.error('Registration error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Check if user is banned
      if (user.banned) {
        throw new AppError('Account has been banned', 403, 'ACCOUNT_BANNED');
      }

      // Verify password
      const isPasswordValid = await BcryptUtil.comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Fetch user profile from user-service
      let userProfile = null;
      try {
        const profileResponse = await axios.get(
          `${this.userServiceUrl}/api/v1/users/${user.id}`,
          {
            timeout: 5000,
          },
        );
        
        // Check if response has the expected structure
        if (profileResponse.data && profileResponse.data.success && profileResponse.data.data) {
          userProfile = profileResponse.data.data.user || profileResponse.data.data;
        } else {
          logger.warn('Unexpected profile response structure', {
            userId: user.id,
            response: profileResponse.data,
          });
        }
      } catch (profileError: any) {
        // Log the error but don't fail login
        const errorStatus = profileError.response?.status;
        const errorMessage = profileError.message;
        const errorCode = profileError.code;
        
        logger.warn('Failed to fetch user profile during login, continuing with auth only', {
          userId: user.id,
          email: user.email,
          error: errorMessage,
          status: errorStatus,
          code: errorCode,
          responseData: profileError.response?.data,
          userServiceUrl: this.userServiceUrl,
        });
        
        // If it's a 404, the profile doesn't exist - try to create it
        if (errorStatus === 404) {
          logger.info('User profile not found, attempting to create profile', { userId: user.id });
          
          // Try to create a basic profile with email as username
          try {
            const createResponse = await axios.post(
              `${this.userServiceUrl}/api/v1/users/create-profile`,
              {
                id: user.id,
                username: user.email.split('@')[0] + '_' + user.id.substring(0, 8),
                displayName: user.email.split('@')[0],
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
                timeout: 5000,
              },
            );
            
            if (createResponse.data && createResponse.data.success && createResponse.data.data) {
              userProfile = createResponse.data.data.user || createResponse.data.data;
              logger.info('Profile created successfully during login', {
                userId: user.id,
                username: userProfile.username,
              });
            }
          } catch (createError: any) {
            logger.error('Failed to create profile during login', {
              userId: user.id,
              error: createError.message,
              status: createError.response?.status,
            });
            // Continue without profile data
          }
        }
      }

      // Generate tokens (include username from profile if available, role from database)
      const tokens = JwtUtil.generateTokens({
        id: user.id,
        email: user.email,
        username: userProfile?.username,
        role: user.role,
      });

      // Build user response with profile data if available, otherwise use defaults
      const userResponse = {
        id: user.id,
        email: user.email,
        username: userProfile?.username || null,
        displayName: userProfile?.displayName || null,
        bio: userProfile?.bio || null,
        avatarUrl: userProfile?.avatarUrl || null,
        verified: userProfile?.verified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Add follower counts if available
        followersCount: userProfile?.followersCount || 0,
        followingCount: userProfile?.followingCount || 0,
      };

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: userResponse,
        ...tokens,
      };
    } catch (error: any) {
      logger.error('Login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = JwtUtil.verifyToken(refreshToken);

      // Find user to ensure they still exist
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }

      // Check if user is banned
      if (user.banned) {
        throw new AppError('Account has been banned', 403, 'ACCOUNT_BANNED');
      }

      // Fetch username from user-service for token
      let username: string | undefined;
      try {
        const profileResponse = await axios.get(
          `${this.userServiceUrl}/api/v1/users/${user.id}`,
          {
            timeout: 5000,
          },
        );
        username = profileResponse.data.data?.username;
      } catch (profileError) {
        logger.warn('Failed to fetch username for token refresh', { userId: user.id });
      }

      // Generate new tokens (use role from database)
      const tokens = JwtUtil.generateTokens({
        id: user.id,
        email: user.email,
        username,
        role: user.role,
      });

      logger.info('Token refreshed successfully', { userId: user.id });

      return tokens;
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Fetch profile from user-service
      try {
        const profileResponse = await axios.get(
          `${this.userServiceUrl}/api/v1/users/${userId}`,
          {
            timeout: 5000,
          },
        );
        
        // Check if response has the expected structure
        if (profileResponse.data && profileResponse.data.success && profileResponse.data.data) {
          const profile = profileResponse.data.data.user || profileResponse.data.data;
          
          return {
            ...profile,
            email: user.email,
            role: user.role,
            banned: user.banned,
          };
        } else {
          logger.warn('Unexpected profile response structure in getCurrentUser', {
            userId,
            response: profileResponse.data,
          });
          // Return basic user info if response structure is unexpected
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            banned: user.banned,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        }
      } catch (profileError: any) {
        logger.warn('Failed to fetch user profile in getCurrentUser', {
          userId,
          error: profileError.message,
          status: profileError.response?.status,
          code: profileError.code,
        });
        // Return basic user info if profile fetch fails
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          banned: user.banned,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    } catch (error: any) {
      logger.error('Get current user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await BcryptUtil.comparePassword(
        currentPassword,
        user.passwordHash,
      );
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
      }

      // Validate new password strength
      const passwordValidation = BcryptUtil.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          400,
          'WEAK_PASSWORD',
        );
      }

      // Hash new password
      const hashedNewPassword = await BcryptUtil.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedNewPassword },
      });

      logger.info('Password changed successfully', { userId });

      return { message: 'Password changed successfully' };
    } catch (error: any) {
      logger.error('Change password error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async banUser(userId: string): Promise<{ message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.banned) {
        throw new AppError('User is already banned', 400, 'ALREADY_BANNED');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { banned: true },
      });

      logger.info('User banned successfully', { userId });
      return { message: 'User banned successfully' };
    } catch (error: any) {
      logger.error('Ban user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async unbanUser(userId: string): Promise<{ message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (!user.banned) {
        throw new AppError('User is not banned', 400, 'NOT_BANNED');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { banned: false },
      });

      logger.info('User unbanned successfully', { userId });
      return { message: 'User unbanned successfully' };
    } catch (error: any) {
      logger.error('Unban user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<{ message: string }> {
    try {
      const validRoles = ['USER', 'MODERATOR'];
      if (!validRoles.includes(role)) {
        throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400, 'INVALID_ROLE');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
      });

      logger.info('User role updated successfully', { userId, role });
      return { message: 'User role updated successfully' };
    } catch (error: any) {
      logger.error('Update user role error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async getUserAuthData(userId: string): Promise<{ role: string; banned: boolean }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          banned: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return {
        role: user.role,
        banned: user.banned,
      };
    } catch (error: any) {
      logger.error('Get user auth data error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }
}

export default new AuthService();

