import { Request, Response } from 'express';
import NotificationService from '../services/notificationService';
import NotificationPreferencesService from '../services/notificationPreferencesService';
import logger from '../utils/logger';
import metrics from '../config/metrics';
import { AuthenticatedRequest, ApiResponse, CreateNotificationRequest, UpdatePreferencesRequest } from '../types/api';
import { INotification, INotificationPreferences } from '../types/models';

class NotificationController {
  // POST /api/notifications (for testing purposes)
  async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;
      const notificationData: CreateNotificationRequest = {
        recipient_id: (req.body as CreateNotificationRequest).recipient_id || userId,
        sender_id: (req.body as CreateNotificationRequest).sender_id,
        type: (req.body as CreateNotificationRequest).type,
        title: (req.body as CreateNotificationRequest).title,
        message: (req.body as CreateNotificationRequest).message,
        reference_id: (req.body as CreateNotificationRequest).reference_id,
        reference_type: (req.body as CreateNotificationRequest).reference_type,
        priority: (req.body as CreateNotificationRequest).priority || 'MEDIUM',
        metadata: (req.body as CreateNotificationRequest).metadata || {},
      };

      logger.info('Creating test notification', { userId, notificationData });

      // @ts-ignore - request body type conversion
      const notification = await NotificationService.createNotification(notificationData);

      metrics.incrementHttpRequest('POST', '/api/notifications', 201);
      metrics.recordHttpRequestDuration('POST', '/api/notifications', Date.now() - startTime);

      const response: ApiResponse<INotification> = {
        success: true,
        data: notification,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'createNotification' });
      metrics.incrementHttpRequest('POST', '/api/notifications', 500);
      metrics.recordHttpRequestDuration('POST', '/api/notifications', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to create notification',
          code: 'CREATE_NOTIFICATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // GET /api/notifications
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;
      const query = req.query as {
        page?: string;
        limit?: string;
        type?: string;
        unread_only?: string;
        sort?: string;
      };

      const { page = 1, limit = 20, type, unread_only = false, sort = 'desc' } = query;

      const options = {
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        type: type as typeof type,
        unreadOnly: unread_only === 'true',
        sort: sort === 'desc' ? -1 : 1 as -1 | 1,
      };

      logger.info('Fetching notifications', { userId, options });

      // @ts-ignore - query type conversion
      const result = await NotificationService.getNotifications(userId, options);

      metrics.incrementHttpRequest('GET', '/api/notifications', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getNotifications' });
      metrics.incrementHttpRequest('GET', '/api/notifications', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to fetch notifications',
          code: 'FETCH_NOTIFICATIONS_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // PUT /api/notifications/:id/read
  async markNotificationAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;

      logger.info('Marking notification as read', { userId, notificationId });

      const notification = await NotificationService.markAsRead(userId, notificationId);

      if (!notification) {
        metrics.incrementHttpRequest('PUT', '/api/notifications/:id/read', 404);
        metrics.recordHttpRequestDuration('PUT', '/api/notifications/:id/read', Date.now() - startTime);

        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        };

        res.status(404).json(response);
        return;
      }

      metrics.incrementHttpRequest('PUT', '/api/notifications/:id/read', 200);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/:id/read', Date.now() - startTime);

      const response: ApiResponse<INotification> = {
        success: true,
        data: notification,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, {
        userId: req.user?.id,
        notificationId: req.params.id,
        action: 'markNotificationAsRead',
      });
      metrics.incrementHttpRequest('PUT', '/api/notifications/:id/read', 500);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/:id/read', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to mark notification as read',
          code: 'MARK_READ_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // PUT /api/notifications/read-all
  async markAllNotificationsAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;

      logger.info('Marking all notifications as read', { userId });

      const result = await NotificationService.markAllAsRead(userId);

      metrics.incrementHttpRequest('PUT', '/api/notifications/read-all', 200);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/read-all', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: {
          modified_count: result.modifiedCount,
          message: `${result.modifiedCount} notifications marked as read`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'markAllNotificationsAsRead' });
      metrics.incrementHttpRequest('PUT', '/api/notifications/read-all', 500);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/read-all', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to mark all notifications as read',
          code: 'MARK_ALL_READ_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // GET /api/notifications/unread-count
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;

      logger.info('Fetching unread notification count', { userId });

      const count = await NotificationService.getUnreadCount(userId);

      metrics.incrementHttpRequest('GET', '/api/notifications/unread-count', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/unread-count', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: {
          unread_count: count,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getUnreadCount' });
      metrics.incrementHttpRequest('GET', '/api/notifications/unread-count', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/unread-count', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get unread notification count',
          code: 'GET_UNREAD_COUNT_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // GET /api/notifications/stats
  async getNotificationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;

      logger.info('Fetching notification statistics', { userId });

      const stats = await NotificationService.getNotificationStats(userId);

      metrics.incrementHttpRequest('GET', '/api/notifications/stats', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/stats', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getNotificationStats' });
      metrics.incrementHttpRequest('GET', '/api/notifications/stats', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/stats', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get notification statistics',
          code: 'GET_STATS_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // GET /api/notifications/preferences
  async getNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;

      logger.info('Fetching notification preferences', { userId });

      const preferences = await NotificationPreferencesService.getPreferences(userId);

      metrics.incrementHttpRequest('GET', '/api/notifications/preferences', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/preferences', Date.now() - startTime);

      const response: ApiResponse<INotificationPreferences> = {
        success: true,
        data: preferences,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getNotificationPreferences' });
      metrics.incrementHttpRequest('GET', '/api/notifications/preferences', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/preferences', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get notification preferences',
          code: 'GET_PREFERENCES_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // PUT /api/notifications/preferences
  async updateNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;
      const preferences = req.body as UpdatePreferencesRequest;

      logger.info('Updating notification preferences', { userId, preferences });

      const updatedPreferences = await NotificationPreferencesService.updatePreferences(userId, preferences);

      metrics.incrementHttpRequest('PUT', '/api/notifications/preferences', 200);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/preferences', Date.now() - startTime);

      const response: ApiResponse<INotificationPreferences> = {
        success: true,
        data: updatedPreferences,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'updateNotificationPreferences' });
      metrics.incrementHttpRequest('PUT', '/api/notifications/preferences', 500);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/preferences', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to update notification preferences',
          code: 'UPDATE_PREFERENCES_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // DELETE /api/notifications/:id
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;

      logger.info('Deleting notification', { userId, notificationId });

      const result = await NotificationService.deleteNotification(userId, notificationId);

      if (!result) {
        metrics.incrementHttpRequest('DELETE', '/api/notifications/:id', 404);
        metrics.recordHttpRequestDuration('DELETE', '/api/notifications/:id', Date.now() - startTime);

        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        };

        res.status(404).json(response);
        return;
      }

      metrics.incrementHttpRequest('DELETE', '/api/notifications/:id', 200);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/:id', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Notification deleted successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, {
        userId: req.user?.id,
        notificationId: req.params.id,
        action: 'deleteNotification',
      });
      metrics.incrementHttpRequest('DELETE', '/api/notifications/:id', 500);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/:id', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to delete notification',
          code: 'DELETE_NOTIFICATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // DELETE /api/notifications/all
  async deleteAllNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;

      logger.info('Deleting all notifications', { userId });

      const result = await NotificationService.deleteAllNotifications(userId);

      metrics.incrementHttpRequest('DELETE', '/api/notifications/all', 200);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/all', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: {
          deleted_count: result.deletedCount,
          message: `${result.deletedCount} notification(s) deleted successfully`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, {
        userId: req.user?.id,
        action: 'deleteAllNotifications',
      });
      metrics.incrementHttpRequest('DELETE', '/api/notifications/all', 500);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/all', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to delete all notifications',
          code: 'DELETE_ALL_NOTIFICATIONS_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }

  // DELETE /api/notifications/cleanup
  async cleanupOldNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const userId = req.user!.id;
      const query = req.query as { days_old?: string };
      const { days_old = 30 } = query;

      logger.info('Cleaning up old notifications', { userId, days_old });

      const result = await NotificationService.cleanupOldNotifications(userId, parseInt(String(days_old), 10));

      metrics.incrementHttpRequest('DELETE', '/api/notifications/cleanup', 200);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/cleanup', Date.now() - startTime);

      const response: ApiResponse = {
        success: true,
        data: {
          deleted_count: result.deletedCount,
          message: `${result.deletedCount} old notifications cleaned up`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'cleanupOldNotifications' });
      metrics.incrementHttpRequest('DELETE', '/api/notifications/cleanup', 500);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/cleanup', Date.now() - startTime);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to cleanup old notifications',
          code: 'CLEANUP_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      res.status(500).json(response);
    }
  }
}

export default new NotificationController();

