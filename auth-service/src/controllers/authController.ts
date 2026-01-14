import { Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

class AuthController {
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

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

  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4396fcc-f0a9-4a0d-b201-c34d196a149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.ts:27',message:'Login controller entry',data:{ip:req.ip,forwardedFor:req.get('X-Forwarded-For'),email:req.body?.email,hasPassword:!!req.body?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4396fcc-f0a9-4a0d-b201-c34d196a149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.ts:32',message:'Login success',data:{ip:req.ip,forwardedFor:req.get('X-Forwarded-For'),email,userId:result.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4396fcc-f0a9-4a0d-b201-c34d196a149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.ts:45',message:'Login error',data:{ip:req.ip,forwardedFor:req.get('X-Forwarded-For'),email:req.body?.email,errorMessage:error instanceof Error ? error.message : String(error),errorStatus:(error as any)?.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      next(error);
    }
  }

  async refreshToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
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

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
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

  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id);

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

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);

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

  async banUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await authService.banUser(id);

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
      const result = await authService.unbanUser(id);

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

  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const result = await authService.updateUserRole(id, role);

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

  async getUserAuthData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await authService.getUserAuthData(id);

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
}

export default new AuthController();







