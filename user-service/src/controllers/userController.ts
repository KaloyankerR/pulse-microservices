import { Response, NextFunction } from 'express';
import userService from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

class UserController {
  async createProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.createProfile(req.body);

      res.status(201).json({
        success: true,
        data: {
          user: result,
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

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID parameter
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'User ID is required and must be a valid string',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const currentUserId = req.user?.id || null;
      const user = await userService.getUserById(id.trim(), currentUserId);

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
    } catch (error: any) {
      // Log error before passing to error handler
      logger.error('Error in getUserById controller:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        params: req.params,
        userId: req.user?.id,
      });
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user is updating their own profile OR is a moderator
      const isModerator = req.user!.role === 'MODERATOR';
      if (req.user!.id !== id && !isModerator) {
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

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user is deleting their own account OR is a moderator
      const isModerator = req.user!.role === 'MODERATOR';
      if (req.user!.id !== id && !isModerator) {
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

  async searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, page, limit } = req.query;
      
      logger.info('Search users request:', {
        query: q,
        page,
        limit,
        userId: req.user?.id,
        url: req.url,
      });
      
      // Ensure query is defined and not empty (validation should catch this, but add extra safety)
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Search query is required and cannot be empty',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const currentUserId = req.user?.id || null;
      const result = await userService.searchUsers(
        q.trim(),
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20,
        currentUserId,
      );

      logger.info('Search users success:', {
        query: q,
        resultCount: result.users.length,
        totalCount: result.pagination.totalCount,
      });

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
    } catch (error: any) {
      // Enhanced error logging before passing to error handler
      logger.error('Error in searchUsers controller:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        query: req.query.q,
        userId: req.user?.id,
        url: req.url,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      next(error);
    }
  }

  async getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await userService.getFollowers(
        id,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20,
      );

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

  async getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await userService.getFollowing(
        id,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20,
      );

      res.status(200).json({
        success: true,
        data: {
          following: result.followers,
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

  async followUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await userService.followUser(req.user!.id, id);

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
      const { id } = req.params;
      const result = await userService.unfollowUser(req.user!.id, id);

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
      const { id } = req.params;
      const result = await userService.getFollowStatus(req.user!.id, id);

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

  async getCurrentUserProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await userService.getUserById(req.user!.id, req.user!.id);

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

  async updateCurrentUserProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await userService.updateProfile(req.user!.id, req.body);

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

  async banUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const result = await userService.banUser(id, authHeader);

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

  async unbanUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const result = await userService.unbanUser(id, authHeader);

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

  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const authHeader = req.headers.authorization;
      const result = await userService.getAllUsers(
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20,
        authHeader,
      );

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
}

export default new UserController();

