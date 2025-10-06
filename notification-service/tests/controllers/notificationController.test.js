const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

// Mock the models
const Notification = require('../../src/models/notification');
const NotificationPreferences = require('../../src/models/notificationPreferences');

describe('Notification Controller', () => {
  let authToken;
  let testUser;

  beforeAll(() => {
    testUser = global.createMockUser();
    authToken = jwt.sign(testUser, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should get all notifications for authenticated user', async () => {
      // Mock Notification.find to return test data
      const mockNotifications = [
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'FOLLOW',
          title: 'New Follower',
          message: 'User1 started following you',
          _id: '507f1f77bcf86cd799439001',
        }),
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'LIKE',
          title: 'Post Liked',
          message: 'User2 liked your post',
          is_read: true,
          _id: '507f1f77bcf86cd799439002',
        }),
      ];

      // Mock the static methods
      Notification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockNotifications),
            }),
          }),
        }),
      });

      Notification.countDocuments = jest.fn().mockResolvedValue(2);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter notifications by type', async () => {
      // Mock filtered results
      const followNotifications = [
        global.createMockNotification({
          recipient_id: testUser.id,
          type: 'FOLLOW',
          title: 'New Follower',
          message: 'User1 started following you',
          _id: '507f1f77bcf86cd799439001',
        }),
      ];

      Notification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(followNotifications),
            }),
          }),
        }),
      });

      Notification.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/notifications?type=FOLLOW')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].type).toBe('FOLLOW');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/notifications')
        .expect(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let notificationId;

    beforeEach(() => {
      notificationId = '507f1f77bcf86cd799439001';
      
      // Mock Notification.findByIdAndUpdate
      const mockNotification = global.createMockNotification({
        recipient_id: testUser.id,
        _id: notificationId,
        is_read: true,
        read_at: new Date(),
      });

      Notification.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNotification),
      });

      Notification.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNotification),
      });
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
      // Mock Notification.findById to return null
      Notification.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const fakeId = '507f1f77bcf86cd799439999';
      await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Mock Notification.updateMany
      Notification.updateMany = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modified_count).toBe(2);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      // Mock Notification.countDocuments
      Notification.countDocuments = jest.fn().mockResolvedValue(3);

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(3);
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('should return notification statistics', async () => {
      // Mock Notification.aggregate
      const mockStats = [
        {
          total: 3,
          unread: 1,
          read: 2,
        },
      ];

      Notification.aggregate = jest.fn().mockResolvedValue(mockStats);

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
    it('should delete notification', async () => {
      const notificationId = '507f1f77bcf86cd799439001';
      
      // Mock Notification.findByIdAndDelete
      const mockNotification = global.createMockNotification({
        recipient_id: testUser.id,
        _id: notificationId,
      });

      Notification.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNotification),
      });

      Notification.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNotification),
      });

      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      // Mock Notification.findById to return null
      Notification.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const fakeId = '507f1f77bcf86cd799439999';
      await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/notifications/cleanup', () => {
    it('should cleanup old read notifications', async () => {
      // Mock Notification.deleteMany
      Notification.deleteMany = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 2 }),
      });

      const response = await request(app)
        .delete('/api/notifications/cleanup?days_old=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted_count).toBe(2);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should return notification preferences', async () => {
      // Mock NotificationPreferences.findByUserId
      const mockPreferences = {
        user_id: testUser.id,
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        preferences: {
          FOLLOW: { email: true, push: true, in_app: true },
        },
      };

      NotificationPreferences.findByUserId = jest.fn().mockResolvedValue(mockPreferences);

      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUser.id);
      expect(response.body.data.email_notifications).toBe(true);
    });
  });

  describe('PUT /api/notifications/preferences', () => {
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

      const mockUpdatedPreferences = {
        user_id: testUser.id,
        email_notifications: false,
        push_notifications: true,
        preferences: updateData.preferences,
      };

      // Mock NotificationPreferences.findByUserId
      NotificationPreferences.findByUserId = jest.fn().mockResolvedValue({
        user_id: testUser.id,
        save: jest.fn().mockResolvedValue(mockUpdatedPreferences),
      });

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email_notifications).toBe(false);
      expect(response.body.data.push_notifications).toBe(true);
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