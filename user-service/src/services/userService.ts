import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import axios from 'axios';
import {
  UserProfile, CreateProfileRequest, UpdateProfileRequest, SearchUsersResponse, FollowResponse,
} from '../types';

class UserService {
  async createProfile(profileData: CreateProfileRequest): Promise<UserProfile> {
    try {
      logger.info('Creating user profile', {
        userId: profileData.id,
        username: profileData.username,
        displayName: profileData.displayName,
      });

      // Check if username already exists
      const existingProfile = await prisma.userProfile.findUnique({
        where: { username: profileData.username },
      });

      if (existingProfile) {
        logger.warn('Username already exists', {
          userId: profileData.id,
          username: profileData.username,
          existingUserId: existingProfile.id,
        });
        throw new AppError('Username already exists', 409, 'USERNAME_EXISTS');
      }

      // Check if ID already exists (from auth-service)
      const existingById = await prisma.userProfile.findUnique({
        where: { id: profileData.id },
      });

      if (existingById) {
        logger.warn('Profile already exists for this user ID', {
          userId: profileData.id,
          username: profileData.username,
        });
        throw new AppError('Profile already exists for this user', 409, 'PROFILE_EXISTS');
      }

      // Create profile
      const profile = await prisma.userProfile.create({
        data: {
          id: profileData.id,
          username: profileData.username,
          displayName: profileData.displayName || profileData.username,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Profile created successfully', {
        userId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
      });

      return {
        ...profile,
        followersCount: 0,
        followingCount: 0,
      };
    } catch (error: any) {
      logger.error('Create profile error:', {
        userId: profileData.id,
        username: profileData.username,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error.code,
        isAppError: error instanceof AppError,
      });

      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error.code && error.code.startsWith('P')) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = error.meta?.target?.[0] || 'field';
          throw new AppError(
            `A user with this ${field} already exists`,
            409,
            'DUPLICATE_ENTRY',
          );
        }
        if (error.code === 'P1001' || error.code === 'P1002') {
          throw new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
        }
        throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
      }

      throw new AppError(
        error.message || 'Failed to create profile',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  async getUserById(userId: string, currentUserId: string | null = null): Promise<UserProfile> {
    try {
      // Validate userId format (UUID)
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError('Invalid user ID format', 400, 'INVALID_ID');
      }

      const user = await prisma.userProfile.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Get follower counts with error handling
      let followersCount = 0;
      let followingCount = 0;
      try {
        [followersCount, followingCount] = await Promise.all([
          prisma.userFollow.count({ where: { followingId: userId } }),
          prisma.userFollow.count({ where: { followerId: userId } }),
        ]);
      } catch (countError: any) {
        logger.warn('Failed to get follower counts:', {
          userId,
          error: countError.message,
        });
        // Continue with zero counts if query fails
      }

      let isFollowing = false;
      if (currentUserId && currentUserId !== userId) {
        try {
          const followRelation = await prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: userId,
              },
            },
          });
          isFollowing = !!followRelation;
        } catch (followError: any) {
          logger.warn('Failed to get follow status:', {
            followerId: currentUserId,
            followingId: userId,
            error: followError.message,
          });
          // Continue with false if query fails
        }
      }

      return {
        ...user,
        followersCount,
        followingCount,
        isFollowing,
      };
    } catch (error: any) {
      // Enhanced error logging
      logger.error('Get user by ID error:', {
        userId,
        currentUserId,
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        meta: error.meta,
        clientVersion: error.clientVersion,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // If it's already an AppError, re-throw it
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors - check both string and number codes
      const errorCode = error.code?.toString() || '';
      if (errorCode && (errorCode.startsWith('P') || errorCode.startsWith('Prisma'))) {
        if (errorCode === 'P2025') {
          // Record not found
          throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (errorCode === 'P2003') {
          // Foreign key constraint violation
          throw new AppError('Invalid reference', 400, 'INVALID_REFERENCE');
        }
        if (errorCode === 'P1001' || errorCode === 'P1002' || errorCode === 'P1008') {
          // Database connection/timeout errors
          throw new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
        }
        // Generic Prisma error
        logger.error('Unhandled Prisma error:', {
          code: errorCode,
          message: error.message,
          meta: error.meta,
        });
        throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
      }

      // Handle database connection errors
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('connect') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
        throw new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
      }

      // Handle Prisma Client errors (different format)
      if (error.name === 'PrismaClientKnownRequestError' || error.name === 'PrismaClientUnknownRequestError') {
        logger.error('Prisma Client error:', {
          name: error.name,
          code: error.code,
          message: error.message,
          meta: error.meta,
        });
        throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
      }

      // Generic error - log full details for debugging
      logger.error('Unhandled error in getUserById:', {
        errorType: typeof error,
        errorConstructor: error.constructor?.name,
        errorKeys: Object.keys(error),
        fullError: error,
      });

      throw new AppError(
        process.env.NODE_ENV === 'development' 
          ? `Failed to retrieve user: ${error.message || 'Unknown error'}`
          : 'Failed to retrieve user',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  async updateProfile(userId: string, updateData: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const user = await prisma.userProfile.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Get follower counts
      const [followersCount, followingCount] = await Promise.all([
        prisma.userFollow.count({ where: { followingId: userId } }),
        prisma.userFollow.count({ where: { followerId: userId } }),
      ]);

      logger.info('Profile updated successfully', { userId });

      return {
        ...user,
        followersCount,
        followingCount,
      };
    } catch (error: any) {
      logger.error('Update profile error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      await prisma.userProfile.delete({
        where: { id: userId },
      });

      logger.info('User deleted successfully', { userId });

      return { message: 'User account deleted successfully' };
    } catch (error: any) {
      logger.error('Delete user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
    currentUserId: string | null = null,
  ): Promise<SearchUsersResponse> {
    // Validate query parameter early
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new AppError('Search query is required and cannot be empty', 400, 'VALIDATION_ERROR');
    }

    // Sanitize query
    const sanitizedQuery = query.trim();

    // Validate pagination parameters
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));

    try {

      const skip = (validPage - 1) * validLimit;

      // Build search conditions - handle nullable displayName properly
      // Try case-insensitive search first, fallback to case-sensitive if needed
      const searchConditions: any[] = [
        { 
          username: { 
            contains: sanitizedQuery, 
            mode: 'insensitive' as const 
          } 
        },
      ];
      
      // Only search displayName if it exists (not null)
      // Use case-insensitive search
      searchConditions.push({
        AND: [
          { displayName: { not: null } },
          { 
            displayName: { 
              contains: sanitizedQuery, 
              mode: 'insensitive' as const 
            } 
          },
        ],
      });

      let users;
      let totalCount;
      
      try {
        users = await prisma.userProfile.findMany({
          where: {
            OR: searchConditions,
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            verified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: validLimit,
        });

        totalCount = await prisma.userProfile.count({
          where: {
            OR: searchConditions,
          },
        });
      } catch (prismaError: any) {
        // If case-insensitive search fails, try case-sensitive as fallback
        if (prismaError.code && prismaError.code.startsWith('P')) {
          logger.warn('Case-insensitive search failed, trying case-sensitive fallback', {
            error: prismaError.message,
            code: prismaError.code,
          });
          
          const fallbackConditions: any[] = [
            { username: { contains: sanitizedQuery } },
          ];
          
          fallbackConditions.push({
            AND: [
              { displayName: { not: null } },
              { displayName: { contains: sanitizedQuery } },
            ],
          });

          users = await prisma.userProfile.findMany({
            where: {
              OR: fallbackConditions,
            },
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
              verified: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: validLimit,
          });

          totalCount = await prisma.userProfile.count({
            where: {
              OR: fallbackConditions,
            },
          });
        } else {
          // Re-throw if it's not a Prisma error
          throw prismaError;
        }
      }

      // Get follower counts and follow status for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          try {
            const [followersCount, followingCount] = await Promise.all([
              prisma.userFollow.count({ where: { followingId: user.id } }),
              prisma.userFollow.count({ where: { followerId: user.id } }),
            ]);

            let isFollowing = false;
            if (currentUserId && currentUserId !== user.id) {
              try {
                const followRelation = await prisma.userFollow.findUnique({
                  where: {
                    followerId_followingId: {
                      followerId: currentUserId,
                      followingId: user.id,
                    },
                  },
                });
                isFollowing = !!followRelation;
              } catch (followError) {
                // If follow check fails, just set isFollowing to false
                logger.warn('Failed to check follow status', {
                  userId: user.id,
                  currentUserId,
                  error: followError,
                });
                isFollowing = false;
              }
            }

            return {
              ...user,
              followersCount,
              followingCount,
              isFollowing,
            };
          } catch (userStatError) {
            // If getting stats for a user fails, return user without stats
            logger.warn('Failed to get user stats', {
              userId: user.id,
              error: userStatError,
            });
            return {
              ...user,
              followersCount: 0,
              followingCount: 0,
              isFollowing: false,
            };
          }
        }),
      );

      const totalPages = Math.ceil(totalCount / validLimit);

      return {
        users: usersWithStats,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalCount,
          totalPages,
          hasNext: validPage < totalPages,
          hasPrev: validPage > 1,
        },
      };
    } catch (error: any) {
      logger.error('Search users error:', {
        error: error.message,
        stack: error.stack,
        query: sanitizedQuery,
        page: validPage,
        limit: validLimit,
        code: error.code,
        name: error.name,
      });

      // If it's already an AppError, just rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error.code && typeof error.code === 'string' && error.code.startsWith('P')) {
        logger.error('Prisma error in searchUsers:', error.code);
        throw new AppError('Database error while searching users', 500, 'DATABASE_ERROR');
      }

      // Handle database connection errors
      if (
        error.message?.includes('connect') ||
        error.message?.includes('connection') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'
      ) {
        throw new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
      }

      // Generic error
      throw new AppError(
        `Failed to search users: ${error.message || 'Unknown error'}`,
        500,
        'SEARCH_ERROR',
      );
    }
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<FollowResponse> {
    try {
      const skip = (page - 1) * limit;

      const followers = await prisma.userFollow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
              verified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const totalCount = await prisma.userFollow.count({
        where: { followingId: userId },
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        followers: followers.map((follow) => ({
          ...follow.follower,
          updatedAt: follow.follower.updatedAt,
          followedAt: follow.createdAt,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error: any) {
      logger.error('Get followers error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<FollowResponse> {
    try {
      const skip = (page - 1) * limit;

      const following = await prisma.userFollow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
              verified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const totalCount = await prisma.userFollow.count({
        where: { followerId: userId },
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        followers: following.map((follow) => ({
          ...follow.following,
          updatedAt: follow.following.updatedAt,
          followedAt: follow.createdAt,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error: any) {
      logger.error('Get following error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async followUser(followerId: string, followingId: string): Promise<{ message: string }> {
    try {
      if (followerId === followingId) {
        throw new AppError('Cannot follow yourself', 400, 'CANNOT_FOLLOW_SELF');
      }

      // Check if target user exists
      const targetUser = await prisma.userProfile.findUnique({
        where: { id: followingId },
      });

      if (!targetUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check if already following
      const existingFollow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existingFollow) {
        throw new AppError('Already following this user', 409, 'ALREADY_FOLLOWING');
      }

      // Create follow relationship
      await prisma.userFollow.create({
        data: {
          followerId,
          followingId,
        },
      });

      logger.info('User followed successfully', { followerId, followingId });

      return { message: 'User followed successfully' };
    } catch (error: any) {
      logger.error('Follow user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<{ message: string }> {
    try {
      const followRelation = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!followRelation) {
        throw new AppError('Not following this user', 404, 'NOT_FOLLOWING');
      }

      await prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      logger.info('User unfollowed successfully', { followerId, followingId });

      return { message: 'User unfollowed successfully' };
    } catch (error: any) {
      logger.error('Unfollow user error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async getFollowStatus(followerId: string, followingId: string): Promise<{ isFollowing: boolean }> {
    try {
      const followRelation = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return { isFollowing: !!followRelation };
    } catch (error: any) {
      logger.error('Get follow status error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async banUser(userId: string, authHeader?: string): Promise<{ message: string }> {
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';
      
      logger.info('Banning user via auth-service', { userId, authServiceUrl });

      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await axios.post(
        `${authServiceUrl}/api/v1/auth/users/${userId}/ban`,
        {},
        {
          headers,
          timeout: 5000,
        },
      );

      if (response.data && response.data.success) {
        logger.info('User banned successfully', { userId });
        return { message: 'User banned successfully' };
      }

      throw new AppError('Failed to ban user', 500, 'BAN_FAILED');
    } catch (error: any) {
      logger.error('Ban user error:', {
        userId,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });

      if (error instanceof AppError) {
        throw error;
      }

      if (error.response?.status === 404) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 'Invalid request';
        throw new AppError(errorMessage, 400, 'INVALID_REQUEST');
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new AppError('Auth service is unavailable', 503, 'SERVICE_UNAVAILABLE');
      }

      throw new AppError(
        `Failed to ban user: ${error.message || 'Unknown error'}`,
        500,
        'BAN_FAILED',
      );
    }
  }

  async unbanUser(userId: string, authHeader?: string): Promise<{ message: string }> {
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';
      
      logger.info('Unbanning user via auth-service', { userId, authServiceUrl });

      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await axios.post(
        `${authServiceUrl}/api/v1/auth/users/${userId}/unban`,
        {},
        {
          headers,
          timeout: 5000,
        },
      );

      if (response.data && response.data.success) {
        logger.info('User unbanned successfully', { userId });
        return { message: 'User unbanned successfully' };
      }

      throw new AppError('Failed to unban user', 500, 'UNBAN_FAILED');
    } catch (error: any) {
      logger.error('Unban user error:', {
        userId,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });

      if (error instanceof AppError) {
        throw error;
      }

      if (error.response?.status === 404) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 'Invalid request';
        throw new AppError(errorMessage, 400, 'INVALID_REQUEST');
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new AppError('Auth service is unavailable', 503, 'SERVICE_UNAVAILABLE');
      }

      throw new AppError(
        `Failed to unban user: ${error.message || 'Unknown error'}`,
        500,
        'UNBAN_FAILED',
      );
    }
  }

  async getAllUsers(page: number = 1, limit: number = 20, authHeader?: string): Promise<SearchUsersResponse> {
    try {
      const skip = (page - 1) * limit;
      const validLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));
      const validPage = Math.max(1, Math.floor(page) || 1);

      const users = await prisma.userProfile.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: validLimit,
      });

      const totalCount = await prisma.userProfile.count();

      // Get follower counts and auth data (role, banned) for each user
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';

      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [followersCount, followingCount] = await Promise.all([
            prisma.userFollow.count({ where: { followingId: user.id } }),
            prisma.userFollow.count({ where: { followerId: user.id } }),
          ]);

          // Fetch role and banned status from auth-service via internal API
          let role = 'USER';
          let banned = false;
          try {
            // Call auth-service internal endpoint to get user auth data
            const headers: any = {};
            if (authHeader) {
              headers['Authorization'] = authHeader;
            }
            const authResponse = await axios.get(
              `${authServiceUrl}/api/v1/auth/users/${user.id}/auth-data`,
              {
                headers,
                timeout: 2000,
              },
            );
            if (authResponse.data?.data) {
              role = authResponse.data.data.role || 'USER';
              banned = authResponse.data.data.banned || false;
            }
          } catch (authError: any) {
            // If endpoint doesn't exist or fails, default to USER and not banned
            logger.debug('Could not fetch auth data for user', { userId: user.id, error: authError.message });
          }

          return {
            ...user,
            followersCount,
            followingCount,
            role,
            banned,
          };
        }),
      );

      const totalPages = Math.ceil(totalCount / validLimit);

      return {
        users: usersWithStats,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalCount,
          totalPages,
          hasNext: validPage < totalPages,
          hasPrev: validPage > 1,
        },
      };
    } catch (error: any) {
      logger.error('Get all users error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }
}

export default new UserService();

