import { Response, NextFunction } from 'express';
import socialService from '../services/socialService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, FollowStatus } from '../types';

class SocialController {
  async followUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user?.id || req.user?.userId;
      
      if (!followerId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

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

  async unfollowUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user?.id || req.user?.userId;
      
      if (!followerId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

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

  async getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await socialService.getFollowers(userId, page, limit);

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

  async getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await socialService.getFollowing(userId, page, limit);

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

  async blockUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const blockerId = req.user?.id || req.user?.userId;
      
      if (!blockerId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

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

  async unblockUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const blockerId = req.user?.id || req.user?.userId;
      
      if (!blockerId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

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

  async getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!userId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const result = await socialService.getRecommendations(userId, limit);

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

  async getSocialStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

  async syncUsers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await socialService.syncUsersFromUserService();
      
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

  async getFollowStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id || req.user?.userId;
      
      if (!currentUserId) {
        throw new AppError('User ID not found in token', 401, 'UNAUTHORIZED');
      }

      const [isFollowing, isFollowedBy, isBlocked] = await Promise.all([
        socialService.isFollowing(currentUserId, userId),
        socialService.isFollowing(userId, currentUserId),
        socialService.isBlocked(currentUserId, userId),
      ]);

      const status: FollowStatus = {
        is_following: isFollowing,
        is_followed_by: isFollowedBy,
        is_blocked: isBlocked,
      };

      res.status(200).json({
        success: true,
        data: status,
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

export default new SocialController();

