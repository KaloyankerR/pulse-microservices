const express = require('express');
const router = express.Router();

// Import controller
const notificationController = require('../controllers/notificationController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const {
  validateGetNotifications,
  validateNotificationId,
  validateUpdatePreferences,
  validateCleanup,
  sanitizeInput,
} = require('../middleware/validation');
const {
  apiLimiter,
  preferencesUpdateLimiter,
} = require('../middleware/rateLimiter');
const {
  requestMetrics,
  businessMetrics,
} = require('../middleware/metrics');

// Health endpoint (no auth required)
router.get('/health', async (req, res) => {
  try {
    const dbHealth = await require('../config/database').healthCheck();
    const redisHealth = await require('../config/redis').healthCheck();
    const rabbitmqHealth = await require('../config/rabbitmq').healthCheck();

    const overallStatus = dbHealth.status === 'healthy' && 
                         redisHealth.status === 'healthy' && 
                         rabbitmqHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      success: true,
      data: {
        status: overallStatus,
        service: 'pulse-notification-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: dbHealth,
          redis: redisHealth,
          rabbitmq: rabbitmqHealth
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_FAILED'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });
  }
});

// Apply middleware to all other routes
router.use(authenticateToken);
router.use(requestMetrics);
router.use(sanitizeInput);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a test notification (for testing purposes)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient_id:
 *                 type: string
 *                 description: ID of the user receiving the notification
 *               sender_id:
 *                 type: string
 *                 description: ID of the user sending the notification
 *               type:
 *                 type: string
 *                 enum: [FOLLOW, LIKE, COMMENT, EVENT_INVITE, EVENT_RSVP, POST_MENTION, SYSTEM, MESSAGE, POST_SHARE, EVENT_REMINDER, FRIEND_REQUEST, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT]
 *                 description: Type of notification
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               reference_id:
 *                 type: string
 *                 description: ID of the referenced object
 *               reference_type:
 *                 type: string
 *                 description: Type of the referenced object
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [FOLLOW, LIKE, COMMENT, EVENT_INVITE, EVENT_RSVP, POST_MENTION, SYSTEM, MESSAGE, POST_SHARE, EVENT_REMINDER, FRIEND_REQUEST, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT]
 *         description: Filter by notification type
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only unread notifications
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order by creation date
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/', apiLimiter, notificationController.createNotification);
router.get('/', apiLimiter, validateGetNotifications, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     unread_count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/unread-count', apiLimiter, notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     unread:
 *                       type: integer
 *                       example: 5
 *                     read:
 *                       type: integer
 *                       example: 95
 *                     typeBreakdown:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           read:
 *                             type: integer
 *                           unread:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', apiLimiter, notificationController.getNotificationStats);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     modified_count:
 *                       type: integer
 *                       example: 10
 *                     message:
 *                       type: string
 *                       example: "10 notifications marked as read"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/read-all', apiLimiter, notificationController.markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/cleanup:
 *   delete:
 *     summary: Cleanup old notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days_old
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days old notifications to delete
 *     responses:
 *       200:
 *         description: Old notifications cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       example: 50
 *                     message:
 *                       type: string
 *                       example: "50 old notifications cleaned up"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/cleanup', apiLimiter, validateCleanup, notificationController.cleanupOldNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id/read', apiLimiter, validateNotificationId, businessMetrics.trackNotificationRead, notificationController.markNotificationAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', apiLimiter, validateNotificationId, notificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "user123"
 *                     email_notifications:
 *                       type: boolean
 *                       example: true
 *                     push_notifications:
 *                       type: boolean
 *                       example: true
 *                     in_app_notifications:
 *                       type: boolean
 *                       example: true
 *                     preferences:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           email:
 *                             type: boolean
 *                           push:
 *                             type: boolean
 *                           in_app:
 *                             type: boolean
 *                     quiet_hours:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         start_time:
 *                           type: string
 *                           example: "22:00"
 *                         end_time:
 *                           type: string
 *                           example: "08:00"
 *                         timezone:
 *                           type: string
 *                           example: "UTC"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/preferences', apiLimiter, notificationController.getNotificationPreferences);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *                 description: Enable/disable email notifications
 *               push_notifications:
 *                 type: boolean
 *                 description: Enable/disable push notifications
 *               in_app_notifications:
 *                 type: boolean
 *                 description: Enable/disable in-app notifications
 *               quiet_hours:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   start_time:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                     example: "22:00"
 *                   end_time:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                     example: "08:00"
 *                   timezone:
 *                     type: string
 *                     example: "UTC"
 *               preferences:
 *                 type: object
 *                 additionalProperties:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                     push:
 *                       type: boolean
 *                     in_app:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.put('/preferences', preferencesUpdateLimiter, validateUpdatePreferences, businessMetrics.trackPreferenceUpdate, notificationController.updateNotificationPreferences);

module.exports = router;
