const request = require('supertest');
const app = require('../../src/app');
const Notification = require('../../src/models/notification');
const NotificationPreferences = require('../../src/models/notificationPreferences');
const jwt = require('jsonwebtoken');

describe('Notification Controller', () => {
  let authToken;
  let testUser;

  beforeAll(() => {
    testUser = global.createMockUser();
    authToken = jwt.sign(testUser, process.env.JWT_SECRET);
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'FOLLOW',
          title: 'New Follower',
          message: 'User1 started following you',
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'LIKE',
          title: 'Post Liked',
          message: 'User2 liked your post',
          is_read: true,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'COMMENT',
          title: 'New Comment',
          message: 'User3 commented on your post',
        }),
      ]);
    });

    it('should get all notifications for authenticated user', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=FOLLOW')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].type).toBe('FOLLOW');
    });

    it('should filter unread notifications only', async () => {
      const response = await request(app)
        .get('/api/notifications?unread_only=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.notifications.every(n => !n.is_read)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/notifications')
        .expect(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await Notification.create(
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: false,
        })
      );
      notificationId = notification._id.toString();
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
      expect(response.body.data.read_at).toBeDefined();
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for notification belonging to another user', async () => {
      const otherUserNotification = await Notification.create(
        global.createMockNotification({
          recipient_id: '507f1f77bcf86cd799439999',
        })
      );

      await request(app)
        .put(`/api/notifications/${otherUserNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    beforeEach(async () => {
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: false,
        }),
      ]);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modified_count).toBe(2);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    beforeEach(async () => {
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: true,
        }),
      ]);
    });

    it('should return unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(2);
    });
  });

  describe('GET /api/notifications/stats', () => {
    beforeEach(async () => {
      await Notification.create([
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'FOLLOW',
          is_read: false,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'LIKE',
          is_read: true,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'FOLLOW',
          is_read: true,
        }),
      ]);
    });

    it('should return notification statistics', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.unread).toBe(1);
      expect(response.body.data.read).toBe(2);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await Notification.create(
        global.createMockNotification({
          recipient_id: testUser.id,
        })
      );
      notificationId = notification._id.toString();
    });

    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify notification is deleted
      const deletedNotification = await Notification.findById(notificationId);
      expect(deletedNotification).toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/notifications/cleanup', () => {
    beforeEach(async () => {
      // Create old read notifications
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days old

      await Notification.create([
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: true,
          created_at: oldDate,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: true,
          created_at: oldDate,
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          is_read: false, // Should not be deleted
          created_at: oldDate,
        }),
      ]);
    });

    it('should cleanup old read notifications', async () => {
      const response = await request(app)
        .delete('/api/notifications/cleanup?days_old=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted_count).toBe(2);

      // Verify unread notification still exists
      const remainingNotifications = await Notification.find({
        recipient_id: testUser.id,
      });
      expect(remainingNotifications).toHaveLength(1);
      expect(remainingNotifications[0].is_read).toBe(false);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    beforeEach(async () => {
      await NotificationPreferences.createDefault(testUser.id);
    });

    it('should return notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUser.id);
      expect(response.body.data.email_notifications).toBe(true);
    });

    it('should create default preferences if not exist', async () => {
      // Delete existing preferences
      await NotificationPreferences.findOneAndDelete({ user_id: testUser.id });

      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUser.id);
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    beforeEach(async () => {
      await NotificationPreferences.createDefault(testUser.id);
    });

    it('should update notification preferences', async () => {
      const updateData = {
        email_notifications: false,
        push_notifications: true,
        preferences: {
          FOLLOW: {
            email: false,
            push: true,
            in_app: true,
          },
        },
      };

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email_notifications).toBe(false);
      expect(response.body.data.push_notifications).toBe(true);
      expect(response.body.data.preferences.FOLLOW.email).toBe(false);
    });

    it('should validate preference data', async () => {
      const invalidData = {
        preferences: {
          INVALID_TYPE: {
            email: 'not-a-boolean',
          },
        },
      };

      await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });
});
