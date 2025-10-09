const NotificationService = require('../../src/services/notificationService');
const Notification = require('../../src/models/notification');
const UserCache = require('../../src/models/userCache');
const redis = require('../../src/config/redis');

describe('NotificationService', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testSenderId = '507f1f77bcf86cd799439012';

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const notificationData = {
        recipient_id: testUserId,
        sender_id: testSenderId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: 'Someone started following you',
        reference_id: testSenderId,
        reference_type: 'USER',
        priority: 'MEDIUM',
        metadata: {},
      };

      const notification = await NotificationService.createNotification(notificationData);

      expect(notification).toBeDefined();
      expect(notification.recipient_id).toBe(testUserId);
      expect(notification.type).toBe('FOLLOW');
      expect(notification.is_read).toBe(false);
    });

    it('should handle notification creation errors', async () => {
      const invalidNotificationData = {
        // Missing required fields
        type: 'INVALID_TYPE',
      };

      await expect(
        NotificationService.createNotification(invalidNotificationData)
      ).rejects.toThrow();
    });
  });

  describe('getNotifications', () => {
    beforeEach(async () => {
      // Clean up existing test data
      await Notification.deleteMany({ recipient_id: testUserId });
      
      // Clear Redis cache for this user (clear specific cache keys)
      try {
        await redis.del(`notifications:${testUserId}:1:20:all:false`);
        await redis.del(`notifications:${testUserId}:1:20:FOLLOW:false`);
        await redis.del(`notifications:${testUserId}:1:20:all:true`);
        await redis.del(`unread_count:${testUserId}`);
      } catch (e) {
        // Ignore cache clear errors in tests
      }
      
      // Create test notifications
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUserId,
          type: 'FOLLOW',
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          type: 'LIKE',
          is_read: true,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          type: 'COMMENT',
          is_read: false,
        }),
      ]);

      // Create user cache for sender
      await UserCache.createOrUpdate({
        user_id: testSenderId,
        username: 'testsender',
        display_name: 'Test Sender',
      });
    });

    it('should get all notifications for user', async () => {
      const result = await NotificationService.getNotifications(testUserId);

      expect(result.notifications).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should filter notifications by type', async () => {
      const result = await NotificationService.getNotifications(testUserId, {
        type: 'FOLLOW',
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('FOLLOW');
    });

    it('should filter unread notifications', async () => {
      const result = await NotificationService.getNotifications(testUserId, {
        unreadOnly: true,
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.notifications.every(n => !n.is_read)).toBe(true);
    });

    it('should handle pagination', async () => {
      const result = await NotificationService.getNotifications(testUserId, {
        page: 1,
        limit: 2,
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.has_next).toBe(true);
    });

    it('should enrich notifications with user data', async () => {
      const result = await NotificationService.getNotifications(testUserId);

      expect(result.notifications[0].sender).toBeDefined();
      expect(result.notifications[0].sender.username).toBe('testsender');
    });
  });

  describe('markAsRead', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await Notification.create(
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: false,
        })
      );
      notificationId = notification._id.toString();
    });

    it('should mark notification as read', async () => {
      const notification = await NotificationService.markAsRead(testUserId, notificationId);

      expect(notification).toBeDefined();
      expect(notification.is_read).toBe(true);
      expect(notification.read_at).toBeDefined();
    });

    it('should return null for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const result = await NotificationService.markAsRead(testUserId, fakeId);

      expect(result).toBeNull();
    });

    it('should return null for notification belonging to another user', async () => {
      const otherUserId = '507f1f77bcf86cd799439999';
      const result = await NotificationService.markAsRead(otherUserId, notificationId);

      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(async () => {
      // Clean up existing test data
      await Notification.deleteMany({ recipient_id: testUserId });
      
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: false,
        }),
      ]);
    });

    it('should mark all notifications as read for user', async () => {
      const result = await NotificationService.markAllAsRead(testUserId);

      expect(result.modifiedCount).toBe(2);

      // Verify notifications are marked as read
      const notifications = await Notification.find({
        recipient_id: testUserId,
        is_read: true,
      });
      expect(notifications).toHaveLength(2);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      // Clean up existing test data
      await Notification.deleteMany({ recipient_id: testUserId });
      
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: true,
        }),
      ]);
    });

    it('should return correct unread count', async () => {
      const count = await NotificationService.getUnreadCount(testUserId);

      expect(count).toBe(2);
    });
  });

  describe('getNotificationStats', () => {
    beforeEach(async () => {
      // Clean up existing test data
      await Notification.deleteMany({ recipient_id: testUserId });
      
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUserId,
          type: 'FOLLOW',
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          type: 'LIKE',
          is_read: true,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          type: 'FOLLOW',
          is_read: true,
        }),
      ]);
    });

    it('should return notification statistics', async () => {
      const stats = await NotificationService.getNotificationStats(testUserId);

      expect(stats.total).toBe(3);
      expect(stats.unread).toBe(1);
      expect(stats.read).toBe(2);
      expect(stats.typeBreakdown).toBeDefined();
    });
  });

  describe('deleteNotification', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await Notification.create(
        global.createMockNotification({
          recipient_id: testUserId,
        })
      );
      notificationId = notification._id.toString();
    });

    it('should delete notification', async () => {
      const result = await NotificationService.deleteNotification(testUserId, notificationId);

      expect(result).toBeDefined();

      // Verify notification is deleted
      const deletedNotification = await Notification.findById(notificationId);
      expect(deletedNotification).toBeNull();
    });

    it('should return null for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const result = await NotificationService.deleteNotification(testUserId, fakeId);

      expect(result).toBeNull();
    });
  });

  describe('processEvent', () => {
    beforeEach(async () => {
      // Clean up existing test data before each processEvent test
      await Notification.deleteMany({ recipient_id: testUserId });
    });

    it('should process follow event', async () => {
      const eventData = {
        event_type: 'user.followed',
        data: {
          follower_id: testSenderId,
          follower_username: 'testsender',
          following_id: testUserId,
        },
      };

      await NotificationService.processEvent(eventData);

      const notifications = await Notification.find({
        recipient_id: testUserId,
        type: 'FOLLOW',
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].sender_id).toBe(testSenderId);
    });

    it('should process like event', async () => {
      const eventData = {
        event_type: 'post.liked',
        data: {
          post_id: '507f1f77bcf86cd799439013',
          post_author_id: testUserId,
          user_id: testSenderId,
          user_username: 'testsender',
        },
      };

      await NotificationService.processEvent(eventData);

      const notifications = await Notification.find({
        recipient_id: testUserId,
        type: 'LIKE',
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].reference_id).toBe('507f1f77bcf86cd799439013');
    });

    it('should process comment event', async () => {
      const eventData = {
        event_type: 'comment.created',
        data: {
          post_id: '507f1f77bcf86cd799439013',
          post_author_id: testUserId,
          comment_id: '507f1f77bcf86cd799439014',
          commenter_id: testSenderId,
          commenter_username: 'testsender',
        },
      };

      await NotificationService.processEvent(eventData);

      const notifications = await Notification.find({
        recipient_id: testUserId,
        type: 'COMMENT',
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].reference_id).toBe('507f1f77bcf86cd799439013');
    });

    it('should process message event', async () => {
      const eventData = {
        event_type: 'message.sent',
        data: {
          conversation_id: '507f1f77bcf86cd799439015',
          message_id: '507f1f77bcf86cd799439016',
          sender_id: testSenderId,
          sender_username: 'testsender',
          recipient_id: testUserId,
        },
      };

      await NotificationService.processEvent(eventData);

      const notifications = await Notification.find({
        recipient_id: testUserId,
        type: 'MESSAGE',
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].reference_id).toBe('507f1f77bcf86cd799439015');
    });

    it('should handle unknown event type', async () => {
      const eventData = {
        event_type: 'unknown.event',
        data: {},
      };

      const result = await NotificationService.processEvent(eventData);

      expect(result).toBeNull();
    });

    it('should not create notification for same user', async () => {
      const eventData = {
        event_type: 'message.sent',
        data: {
          conversation_id: '507f1f77bcf86cd799439015',
          message_id: '507f1f77bcf86cd799439016',
          sender_id: testUserId,
          sender_username: 'testuser',
          recipient_id: testUserId, // Same user
        },
      };

      await NotificationService.processEvent(eventData);

      const notifications = await Notification.find({
        recipient_id: testUserId,
        type: 'MESSAGE',
      });

      expect(notifications).toHaveLength(0);
    });
  });

  describe('cleanupOldNotifications', () => {
    beforeEach(async () => {
      // Create old read notifications
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days old

      await Notification.create([
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: true,
          created_at: oldDate,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: true,
          created_at: oldDate,
        }),
        global.createMockNotification({
          recipient_id: testUserId,
          is_read: false, // Should not be deleted
          created_at: oldDate,
        }),
      ]);
    });

    it('should cleanup old read notifications', async () => {
      const result = await NotificationService.cleanupOldNotifications(testUserId, 30);

      expect(result.deletedCount).toBe(2);

      // Verify unread notification still exists
      const remainingNotifications = await Notification.find({
        recipient_id: testUserId,
      });
      expect(remainingNotifications).toHaveLength(1);
      expect(remainingNotifications[0].is_read).toBe(false);
    });
  });
});
