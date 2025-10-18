const socialService = require('../services/socialService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class SocialController {
  async followUser(req, res, next) {
    try {
      const { userId } = req.params;
      const followerId = req.user.id || req.user.userId;

      const result = await socialService.followUser(followerId, userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req, res, next) {
    try {
      const { userId } = req.params;
      const followerId = req.user.id || req.user.userId;

      const result = await socialService.unfollowUser(followerId, userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req, res, next) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      const result = await socialService.getFollowers(
        userId,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req, res, next) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      const result = await socialService.getFollowing(
        userId,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const blockerId = req.user.id || req.user.userId;

      const result = await socialService.blockUser(blockerId, userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const blockerId = req.user.id || req.user.userId;

      const result = await socialService.unblockUser(blockerId, userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id || req.user.userId;
      const { limit } = req.query;

      const result = await socialService.getRecommendations(
        userId,
        parseInt(limit) || 10
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSocialStats(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await socialService.getSocialStats(userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id || req.user.userId;

      const [isFollowing, isFollowedBy, isBlocked] = await Promise.all([
        socialService.isFollowing(currentUserId, userId),
        socialService.isFollowing(userId, currentUserId),
        socialService.isBlocked(currentUserId, userId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          is_following: isFollowing,
          is_followed_by: isFollowedBy,
          is_blocked: isBlocked,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SocialController();

