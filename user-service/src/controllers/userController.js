const userService = require('../services/userService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserController {
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id || null;
      const user = await userService.getUserById(id, currentUserId);

      res.status(200).json({
        success: true,
        data: {
          user,
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

  async updateProfile(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user is updating their own profile
      if (req.user.id !== id) {
        throw new AppError('Can only update your own profile', 403, 'FORBIDDEN');
      }

      const user = await userService.updateProfile(id, req.body);

      res.status(200).json({
        success: true,
        data: {
          user,
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

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user is deleting their own account
      if (req.user.id !== id) {
        throw new AppError('Can only delete your own account', 403, 'FORBIDDEN');
      }

      const result = await userService.deleteUser(id);

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

  async searchUsers(req, res, next) {
    try {
      const { q, page, limit } = req.query;
      const currentUserId = req.user?.id || null;
      const result = await userService.searchUsers(q, parseInt(page) || 1, parseInt(limit) || 20, currentUserId);

      res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: result.pagination,
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

  async getFollowers(req, res, next) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await userService.getFollowers(id, parseInt(page) || 1, parseInt(limit) || 20);

      res.status(200).json({
        success: true,
        data: {
          followers: result.followers,
          pagination: result.pagination,
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

  async getFollowing(req, res, next) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await userService.getFollowing(id, parseInt(page) || 1, parseInt(limit) || 20);

      res.status(200).json({
        success: true,
        data: {
          following: result.following,
          pagination: result.pagination,
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

  async followUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.followUser(req.user.id, id);

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
      const { id } = req.params;
      const result = await userService.unfollowUser(req.user.id, id);

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
      const { id } = req.params;
      const result = await userService.getFollowStatus(req.user.id, id);

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

  async getCurrentUserProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id, req.user.id);

      res.status(200).json({
        success: true,
        data: {
          user,
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

  async updateCurrentUserProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);

      res.status(200).json({
        success: true,
        data: {
          user,
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

module.exports = new UserController();

