const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const cacheService = require('./cacheService');
const eventService = require('./eventService');
const logger = require('../utils/logger');
const { followOperationsTotal, blockOperationsTotal } = require('../config/metrics');

class SocialService {
  // Follow a user
  async followUser(followerId, followingId) {
    try {
      // Validation
      if (followerId === followingId) {
        throw new AppError('Cannot follow yourself', 400, 'INVALID_OPERATION');
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
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

      // Check if blocked
      const isBlocked = await this.isBlocked(followerId, followingId);
      if (isBlocked) {
        throw new AppError('Cannot follow this user', 403, 'BLOCKED');
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Update stats
      await this.incrementFollowerCount(followingId);
      await this.incrementFollowingCount(followerId);

      // Invalidate cache
      await cacheService.delete(cacheService.getFollowersKey(followingId));
      await cacheService.delete(cacheService.getFollowingKey(followerId));
      await cacheService.delete(cacheService.getSocialStatsKey(followerId));
      await cacheService.delete(cacheService.getSocialStatsKey(followingId));

      // Publish event
      logger.info('About to publish user.followed event', { followerId, followingId });
      await eventService.publishUserFollowed(followerId, followingId);
      logger.info('Finished publishing user.followed event', { followerId, followingId });

      // Track metrics
      followOperationsTotal.inc({ operation: 'follow', status: 'success' });

      logger.info(`User ${followerId} followed user ${followingId}`);

      return {
        message: 'Successfully followed user',
        isFollowing: true,
      };
    } catch (error) {
      followOperationsTotal.inc({ operation: 'follow', status: 'error' });
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(followerId, followingId) {
    try {
      // Validation
      if (followerId === followingId) {
        throw new AppError('Cannot unfollow yourself', 400, 'INVALID_OPERATION');
      }

      // Check if following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!existingFollow) {
        throw new AppError('Not following this user', 404, 'NOT_FOLLOWING');
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      // Update stats
      await this.decrementFollowerCount(followingId);
      await this.decrementFollowingCount(followerId);

      // Invalidate cache
      await cacheService.delete(cacheService.getFollowersKey(followingId));
      await cacheService.delete(cacheService.getFollowingKey(followerId));
      await cacheService.delete(cacheService.getSocialStatsKey(followerId));
      await cacheService.delete(cacheService.getSocialStatsKey(followingId));

      // Track metrics
      followOperationsTotal.inc({ operation: 'unfollow', status: 'success' });

      logger.info(`User ${followerId} unfollowed user ${followingId}`);

      return {
        message: 'Successfully unfollowed user',
        isFollowing: false,
      };
    } catch (error) {
      followOperationsTotal.inc({ operation: 'unfollow', status: 'error' });
      throw error;
    }
  }

  // Get followers of a user
  async getFollowers(userId, page = 1, limit = 20) {
    const cacheKey = `${cacheService.getFollowersKey(userId)}:${page}:${limit}`;
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    // Get user info from cache
    const followersWithInfo = await Promise.all(
      followers.map(async (follow) => {
        const userCache = await prisma.userCache.findUnique({
          where: { id: follow.followerId },
        });
        
        return {
          userId: follow.followerId,
          username: userCache?.username || 'unknown',
          displayName: userCache?.displayName || null,
          avatarUrl: userCache?.avatarUrl || null,
          verified: userCache?.verified || false,
          followedAt: follow.createdAt,
        };
      })
    );

    const result = {
      followers: followersWithInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache result
    await cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  // Get users a user is following
  async getFollowing(userId, page = 1, limit = 20) {
    const cacheKey = `${cacheService.getFollowingKey(userId)}:${page}:${limit}`;
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    // Get user info from cache
    const followingWithInfo = await Promise.all(
      following.map(async (follow) => {
        const userCache = await prisma.userCache.findUnique({
          where: { id: follow.followingId },
        });
        
        return {
          userId: follow.followingId,
          username: userCache?.username || 'unknown',
          displayName: userCache?.displayName || null,
          avatarUrl: userCache?.avatarUrl || null,
          verified: userCache?.verified || false,
          followedAt: follow.createdAt,
        };
      })
    );

    const result = {
      following: followingWithInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache result
    await cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  // Block a user
  async blockUser(blockerId, blockedId) {
    try {
      // Validation
      if (blockerId === blockedId) {
        throw new AppError('Cannot block yourself', 400, 'INVALID_OPERATION');
      }

      // Check if already blocked
      const existingBlock = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      if (existingBlock) {
        throw new AppError('Already blocked this user', 409, 'ALREADY_BLOCKED');
      }

      // Create block relationship
      await prisma.block.create({
        data: {
          blockerId,
          blockedId,
        },
      });

      // Remove any existing follow relationships
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });

      // Invalidate cache
      await cacheService.deletePattern(`*:${blockerId}*`);
      await cacheService.deletePattern(`*:${blockedId}*`);

      // Publish event
      await eventService.publishUserBlocked(blockerId, blockedId);

      // Track metrics
      blockOperationsTotal.inc({ operation: 'block', status: 'success' });

      logger.info(`User ${blockerId} blocked user ${blockedId}`);

      return {
        message: 'Successfully blocked user',
        isBlocked: true,
      };
    } catch (error) {
      blockOperationsTotal.inc({ operation: 'block', status: 'error' });
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(blockerId, blockedId) {
    try {
      // Check if blocked
      const existingBlock = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      if (!existingBlock) {
        throw new AppError('User not blocked', 404, 'NOT_BLOCKED');
      }

      // Delete block relationship
      await prisma.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      // Track metrics
      blockOperationsTotal.inc({ operation: 'unblock', status: 'success' });

      logger.info(`User ${blockerId} unblocked user ${blockedId}`);

      return {
        message: 'Successfully unblocked user',
        isBlocked: false,
      };
    } catch (error) {
      blockOperationsTotal.inc({ operation: 'unblock', status: 'error' });
      throw error;
    }
  }

  // Get user recommendations
  async getRecommendations(userId, limit = 10) {
    const cacheKey = cacheService.getRecommendationsKey(userId);
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get users followed by people you follow (friends of friends)
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Get blocked users
    const blocked = await prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });

    const blockedIds = blocked.map((b) => b.blockedId);

    // Find users followed by your following but not by you
    const recommendations = await prisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: {
          notIn: [...followingIds, userId, ...blockedIds],
        },
      },
      select: {
        followingId: true,
      },
      take: limit * 3, // Get more to filter duplicates
    });

    // Count occurrences (popularity)
    const userCounts = {};
    recommendations.forEach((rec) => {
      userCounts[rec.followingId] = (userCounts[rec.followingId] || 0) + 1;
    });

    // Sort by count and get top recommendations
    const topUserIds = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((entry) => entry[0]);

    // If no recommendations from social graph, get random users
    if (topUserIds.length === 0) {
      const allUsers = await prisma.userCache.findMany({
        where: {
          id: {
            notIn: [userId, ...blockedIds],
          },
        },
        take: limit,
      });
      topUserIds.push(...allUsers.map(u => u.id));
    }

    // If still no users, try to get from user service directly
    if (topUserIds.length === 0) {
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8081';
        const response = await fetch(`${userServiceUrl}/api/v1/users?limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN || ''}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const users = userData.data || [];
          
          // Cache these users and use them for recommendations
          for (const user of users) {
            if (user.id !== userId && !blockedIds.includes(user.id)) {
              await prisma.userCache.upsert({
                where: { id: user.id },
                update: {
                  username: user.username,
                  displayName: user.displayName || null,
                  avatarUrl: user.avatarUrl || null,
                  verified: user.verified || false,
                  lastSynced: new Date(),
                },
                create: {
                  id: user.id,
                  username: user.username,
                  displayName: user.displayName || null,
                  avatarUrl: user.avatarUrl || null,
                  verified: user.verified || false,
                  lastSynced: new Date(),
                },
              });
              topUserIds.push(user.id);
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch users from user service:', error.message);
      }
    }

    // Get user info from cache
    const recommendedUsers = await Promise.all(
      topUserIds.map(async (id) => {
        let userCache = await prisma.userCache.findUnique({
          where: { id },
        });

        // If user cache is empty, try to fetch from user service
        if (!userCache) {
          try {
            // Try to fetch user data from user service
            const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8081';
            const response = await fetch(`${userServiceUrl}/api/v1/users/${id}`, {
              headers: {
                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN || ''}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const userData = await response.json();
              const user = userData.data;
              
              // Cache the user data
              userCache = await prisma.userCache.create({
                data: {
                  id: user.id,
                  username: user.username,
                  displayName: user.displayName || null,
                  avatarUrl: user.avatarUrl || null,
                  verified: user.verified || false,
                  lastSynced: new Date(),
                },
              });
            }
          } catch (error) {
            logger.warn(`Failed to fetch user data for ${id}:`, error.message);
          }
        }

        const stats = await this.getSocialStats(id);

        return {
          id: id,
          username: userCache?.username || `user_${id.slice(0, 8)}`,
          displayName: userCache?.displayName || `User ${id.slice(0, 8)}`,
          avatarUrl: userCache?.avatarUrl || null,
          verified: userCache?.verified || false,
          followers_count: stats.followers_count,
          following_count: stats.following_count,
          mutualFollowersCount: userCounts[id] || 0,
        };
      })
    );

    const result = {
      recommendations: recommendedUsers,
    };

    // Cache result
    await cacheService.set(cacheKey, result, 600); // 10 minutes

    return result;
  }

  // Sync users from user service
  async syncUsersFromUserService() {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8081';
      const response = await fetch(`${userServiceUrl}/api/v1/admin/users?limit=100`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const userData = await response.json();
      const users = userData.data?.users || [];
      
      let syncedCount = 0;
      
      // Cache these users
      for (const user of users) {
        await prisma.userCache.upsert({
          where: { id: user.id },
          update: {
            username: user.username,
            displayName: user.displayName || null,
            avatarUrl: user.avatarUrl || null,
            verified: user.verified || false,
            lastSynced: new Date(),
          },
          create: {
            id: user.id,
            username: user.username,
            displayName: user.displayName || null,
            avatarUrl: user.avatarUrl || null,
            verified: user.verified || false,
            lastSynced: new Date(),
          },
        });
        syncedCount++;
      }

      logger.info(`Successfully synced ${syncedCount} users from user service`);
      
      return {
        syncedCount,
        totalUsers: users.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error syncing users from user service:', error);
      throw error;
    }
  }

  // Get social stats for a user
  async getSocialStats(userId) {
    const cacheKey = cacheService.getSocialStatsKey(userId);
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    let stats = await prisma.userSocialStats.findUnique({
      where: { userId },
    });

    // If stats don't exist, create them
    if (!stats) {
      const [followersCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
      ]);

      stats = await prisma.userSocialStats.create({
        data: {
          userId,
          followersCount,
          followingCount,
          postsCount: 0,
        },
      });
    }

    const result = {
      followers_count: stats.followersCount,
      following_count: stats.followingCount,
      posts_count: stats.postsCount,
    };

    // Cache result
    await cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  // Check if user is blocked
  async isBlocked(userId1, userId2) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });

    return !!block;
  }

  // Check if user is following another user
  async isFollowing(followerId, followingId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  // Helper methods for stats updates
  async incrementFollowerCount(userId) {
    await prisma.userSocialStats.upsert({
      where: { userId },
      update: {
        followersCount: { increment: 1 },
      },
      create: {
        userId,
        followersCount: 1,
        followingCount: 0,
        postsCount: 0,
      },
    });
  }

  async decrementFollowerCount(userId) {
    await prisma.userSocialStats.update({
      where: { userId },
      data: {
        followersCount: { decrement: 1 },
      },
    }).catch(() => {}); // Ignore if not exists
  }

  async incrementFollowingCount(userId) {
    await prisma.userSocialStats.upsert({
      where: { userId },
      update: {
        followingCount: { increment: 1 },
      },
      create: {
        userId,
        followersCount: 0,
        followingCount: 1,
        postsCount: 0,
      },
    });
  }

  async decrementFollowingCount(userId) {
    await prisma.userSocialStats.update({
      where: { userId },
      data: {
        followingCount: { decrement: 1 },
      },
    }).catch(() => {}); // Ignore if not exists
  }
}

module.exports = new SocialService();

