const NotificationService = require('../services/notificationService');
const NotificationPreferencesService = require('../services/notificationPreferencesService');
const logger = require('../utils/logger');
const metrics = require('../config/metrics');

class NotificationController {
  // POST /api/notifications (for testing purposes)
  async createNotification(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const notificationData = {
        recipient_id: req.body.recipient_id || userId,
        sender_id: req.body.sender_id,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        reference_id: req.body.reference_id,
        reference_type: req.body.reference_type,
        priority: req.body.priority || 'MEDIUM',
        metadata: req.body.metadata || {}
      };

      logger.info('Creating test notification', { userId, notificationData });

      const notification = await NotificationService.createNotification(notificationData);

      metrics.incrementHttpRequest('POST', '/api/notifications', 201);
      metrics.recordHttpRequestDuration('POST', '/api/notifications', Date.now() - startTime);

      res.status(201).json({
        success: true,
        data: notification,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'createNotification' });
      metrics.incrementHttpRequest('POST', '/api/notifications', 500);
      metrics.recordHttpRequestDuration('POST', '/api/notifications', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create notification',
          code: 'CREATE_NOTIFICATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // GET /api/notifications
  async getNotifications(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        type,
        unread_only = false,
        sort = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        type,
        unreadOnly: unread_only === 'true',
        sort: sort === 'desc' ? -1 : 1,
      };

      logger.info('Fetching notifications', { userId, options });

      const result = await NotificationService.getNotifications(userId, options);

      metrics.incrementHttpRequest('GET', '/api/notifications', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getNotifications' });
      metrics.incrementHttpRequest('GET', '/api/notifications', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch notifications',
          code: 'FETCH_NOTIFICATIONS_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // PUT /api/notifications/:id/read
  async markNotificationAsRead(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      logger.info('Marking notification as read', { userId, notificationId });

      const notification = await NotificationService.markAsRead(userId, notificationId);

      if (!notification) {
        metrics.incrementHttpRequest('PUT', '/api/notifications/:id/read', 404);
        metrics.recordHttpRequestDuration('PUT', '/api/notifications/:id/read', Date.now() - startTime);
        
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      metrics.incrementHttpRequest('PUT', '/api/notifications/:id/read', 200);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/:id/read', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: notification,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, notificationId: req.params.id, action: 'markNotificationAsRead' });
      metrics.incrementHttpRequest('PUT', '/api/notifications/:id/read', 500);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/:id/read', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark notification as read',
          code: 'MARK_READ_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // PUT /api/notifications/read-all
  async markAllNotificationsAsRead(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;

      logger.info('Marking all notifications as read', { userId });

      const result = await NotificationService.markAllAsRead(userId);

      metrics.incrementHttpRequest('PUT', '/api/notifications/read-all', 200);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/read-all', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: {
          modified_count: result.modifiedCount,
          message: `${result.modifiedCount} notifications marked as read`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'markAllNotificationsAsRead' });
      metrics.incrementHttpRequest('PUT', '/api/notifications/read-all', 500);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/read-all', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark all notifications as read',
          code: 'MARK_ALL_READ_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // GET /api/notifications/unread-count
  async getUnreadCount(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;

      logger.info('Fetching unread notification count', { userId });

      const count = await NotificationService.getUnreadCount(userId);

      metrics.incrementHttpRequest('GET', '/api/notifications/unread-count', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/unread-count', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: {
          unread_count: count,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getUnreadCount' });
      metrics.incrementHttpRequest('GET', '/api/notifications/unread-count', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/unread-count', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get unread notification count',
          code: 'GET_UNREAD_COUNT_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // GET /api/notifications/stats
  async getNotificationStats(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;

      logger.info('Fetching notification statistics', { userId });

      const stats = await NotificationService.getNotificationStats(userId);

      metrics.incrementHttpRequest('GET', '/api/notifications/stats', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/stats', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getNotificationStats' });
      metrics.incrementHttpRequest('GET', '/api/notifications/stats', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/stats', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get notification statistics',
          code: 'GET_STATS_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // GET /api/notifications/preferences
  async getNotificationPreferences(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;

      logger.info('Fetching notification preferences', { userId });

      const preferences = await NotificationPreferencesService.getPreferences(userId);

      metrics.incrementHttpRequest('GET', '/api/notifications/preferences', 200);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/preferences', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: preferences,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'getNotificationPreferences' });
      metrics.incrementHttpRequest('GET', '/api/notifications/preferences', 500);
      metrics.recordHttpRequestDuration('GET', '/api/notifications/preferences', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get notification preferences',
          code: 'GET_PREFERENCES_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // PUT /api/notifications/preferences
  async updateNotificationPreferences(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const preferences = req.body;

      logger.info('Updating notification preferences', { userId, preferences });

      const updatedPreferences = await NotificationPreferencesService.updatePreferences(userId, preferences);

      metrics.incrementHttpRequest('PUT', '/api/notifications/preferences', 200);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/preferences', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: updatedPreferences,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'updateNotificationPreferences' });
      metrics.incrementHttpRequest('PUT', '/api/notifications/preferences', 500);
      metrics.recordHttpRequestDuration('PUT', '/api/notifications/preferences', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update notification preferences',
          code: 'UPDATE_PREFERENCES_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // DELETE /api/notifications/:id
  async deleteNotification(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      logger.info('Deleting notification', { userId, notificationId });

      const result = await NotificationService.deleteNotification(userId, notificationId);

      if (!result) {
        metrics.incrementHttpRequest('DELETE', '/api/notifications/:id', 404);
        metrics.recordHttpRequestDuration('DELETE', '/api/notifications/:id', Date.now() - startTime);
        
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      metrics.incrementHttpRequest('DELETE', '/api/notifications/:id', 200);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/:id', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: {
          message: 'Notification deleted successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, notificationId: req.params.id, action: 'deleteNotification' });
      metrics.incrementHttpRequest('DELETE', '/api/notifications/:id', 500);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/:id', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete notification',
          code: 'DELETE_NOTIFICATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }

  // DELETE /api/notifications/cleanup
  async cleanupOldNotifications(req, res) {
    const startTime = Date.now();
    
    try {
      const userId = req.user.id;
      const { days_old = 30 } = req.query;

      logger.info('Cleaning up old notifications', { userId, days_old });

      const result = await NotificationService.cleanupOldNotifications(userId, parseInt(days_old, 10));

      metrics.incrementHttpRequest('DELETE', '/api/notifications/cleanup', 200);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/cleanup', Date.now() - startTime);

      res.status(200).json({
        success: true,
        data: {
          deleted_count: result.deletedCount,
          message: `${result.deletedCount} old notifications cleaned up`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      logger.logError(error, { userId: req.user?.id, action: 'cleanupOldNotifications' });
      metrics.incrementHttpRequest('DELETE', '/api/notifications/cleanup', 500);
      metrics.recordHttpRequestDuration('DELETE', '/api/notifications/cleanup', Date.now() - startTime);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to cleanup old notifications',
          code: 'CLEANUP_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  }
}

module.exports = new NotificationController();
