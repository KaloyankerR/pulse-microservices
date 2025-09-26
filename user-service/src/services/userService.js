const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserService {
  async getUserById(userId, currentUserId = null) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError('User account is not active', 403, 'USER_INACTIVE');
      }

      // Get follower counts
      const [followersCount, followingCount] = await Promise.all([
        prisma.userFollow.count({ where: { followingId: userId } }),
        prisma.userFollow.count({ where: { followerId: userId } }),
      ]);

      let isFollowing = false;
      if (currentUserId && currentUserId !== userId) {
        const followRelation = await prisma.userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: userId,
            },
          },
        });
        isFollowing = !!followRelation;
      }

      return {
        ...user,
        followersCount,
        followingCount,
        isFollowing,
      };
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          status: true,
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
      await prisma.user.delete({
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
      const skip = (page - 1) * limit;

      const users = await prisma.user.findMany({
        where: {
          AND: [
            { status: 'ACTIVE' },
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
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
        take: limit,
      });

      const totalCount = await prisma.user.count({
        where: {
          AND: [
            { status: 'ACTIVE' },
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
      });

      // Get follower counts and follow status for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [followersCount, followingCount] = await Promise.all([
            prisma.userFollow.count({ where: { followingId: user.id } }),
            prisma.userFollow.count({ where: { followerId: user.id } }),
          ]);

          let isFollowing = false;
          if (currentUserId && currentUserId !== user.id) {
            const followRelation = await prisma.userFollow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: currentUserId,
                  followingId: user.id,
                },
              },
            });
            isFollowing = !!followRelation;
          }

          return {
            ...user,
            followersCount,
            followingCount,
            isFollowing,
          };
        })
      );

      const totalPages = Math.ceil(totalCount / limit);

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
      logger.error('Search users error:', error);
      throw error;
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

      // Check if target user exists and is active
      const targetUser = await prisma.user.findUnique({
        where: { id: followingId },
      });

      if (!targetUser || targetUser.status !== 'ACTIVE') {
        throw new AppError('User not found or inactive', 404, 'USER_NOT_FOUND');
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

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const totalCount = await prisma.user.count();
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

  async updateUserStatus(userId, status) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User status updated successfully', { userId, status });

      return user;
    } catch (error) {
      logger.error('Update user status error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
