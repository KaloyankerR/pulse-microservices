const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserService {
  async createProfile(profileData) {
    try {
      const { id, username, displayName } = profileData;

      // Check if username already exists
      const existingUser = await prisma.userProfile.findFirst({
        where: { username },
      });

      if (existingUser) {
        throw new AppError('Username already exists', 409, 'USERNAME_EXISTS');
      }

      // Create user profile
      const profile = await prisma.userProfile.create({
        data: {
          id,
          username,
          displayName: displayName || username,
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

      logger.info('Profile created successfully', { userId: id, username });

      return profile;
    } catch (error) {
      logger.error('Create profile error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  }

  async getUserById(userId, currentUserId = null) {
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
      } catch (countError) {
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
        } catch (followError) {
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
    } catch (error) {
      logger.error('Get user by ID error:', {
        userId,
        currentUserId,
        error: error.message,
        stack: error.stack,
        code: error.code,
      });

      // If it's already an AppError, re-throw it
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error.code && error.code.startsWith('P')) {
        if (error.code === 'P2025') {
          // Record not found
          throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (error.code === 'P2003') {
          // Foreign key constraint violation
          throw new AppError('Invalid reference', 400, 'INVALID_REFERENCE');
        }
        // Generic Prisma error
        throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
      }

      // Handle database connection errors
      if (error.message && (
        error.message.includes('connect') ||
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')
      )) {
        throw new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
      }

      // Generic error
      throw new AppError(
        error.message || 'Failed to retrieve user',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  async updateProfile(userId, updateData) {
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
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      await prisma.userProfile.delete({
        where: { id: userId },
      });

      logger.info('User deleted successfully', { userId });

      return { message: 'User account deleted successfully' };
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }

  async searchUsers(query, page = 1, limit = 20, currentUserId = null) {
    try {
      // Validate query parameter
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new AppError('Search query is required and cannot be empty', 400, 'VALIDATION_ERROR');
      }

      // Sanitize query
      const sanitizedQuery = query.trim();

      // Validate pagination parameters
      const validPage = Math.max(1, Math.floor(page) || 1);
      const validLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));

      const skip = (validPage - 1) * validLimit;

      // Build search conditions - handle nullable displayName properly
      const searchConditions = [
        { 
          username: { 
            contains: sanitizedQuery, 
            mode: 'insensitive' 
          } 
        },
      ];
      
      // Only search displayName if it exists (not null)
      searchConditions.push({
        AND: [
          { displayName: { not: null } },
          { 
            displayName: { 
              contains: sanitizedQuery, 
              mode: 'insensitive' 
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
      } catch (prismaError) {
        // If case-insensitive search fails, try case-sensitive as fallback
        if (prismaError.code && prismaError.code.toString().startsWith('P')) {
          logger.warn('Case-insensitive search failed, trying case-sensitive fallback', {
            error: prismaError.message,
            code: prismaError.code,
          });
          
          const fallbackConditions = [
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
        })
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
    } catch (error) {
      // Use sanitizedQuery if available, otherwise use query parameter
      const queryForLog = typeof sanitizedQuery !== 'undefined' ? sanitizedQuery : (typeof query !== 'undefined' ? query : 'unknown');
      const pageForLog = typeof validPage !== 'undefined' ? validPage : (typeof page !== 'undefined' ? page : 'unknown');
      const limitForLog = typeof validLimit !== 'undefined' ? validLimit : (typeof limit !== 'undefined' ? limit : 'unknown');

      logger.error('Search users error:', {
        error: error.message,
        stack: error.stack,
        query: queryForLog,
        page: pageForLog,
        limit: limitForLog,
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

  async getFollowers(userId, page = 1, limit = 20) {
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
        followers: followers.map(follow => ({
          ...follow.follower,
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
    } catch (error) {
      logger.error('Get followers error:', error);
      throw error;
    }
  }

  async getFollowing(userId, page = 1, limit = 20) {
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
        following: following.map(follow => ({
          ...follow.following,
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
    } catch (error) {
      logger.error('Get following error:', error);
      throw error;
    }
  }

  async followUser(followerId, followingId) {
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
    } catch (error) {
      logger.error('Follow user error:', error);
      throw error;
    }
  }

  async unfollowUser(followerId, followingId) {
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
    } catch (error) {
      logger.error('Unfollow user error:', error);
      throw error;
    }
  }

  async getFollowStatus(followerId, followingId) {
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
    } catch (error) {
      logger.error('Get follow status error:', error);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

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
        take: limit,
      });

      const totalCount = await prisma.userProfile.count();
      const totalPages = Math.ceil(totalCount / limit);

      // Get follower counts for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [followersCount, followingCount] = await Promise.all([
            prisma.userFollow.count({ where: { followingId: user.id } }),
            prisma.userFollow.count({ where: { followerId: user.id } }),
          ]);

          return {
            ...user,
            followersCount,
            followingCount,
          };
        })
      );

      return {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  }

}

module.exports = new UserService();
