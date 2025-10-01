const express = require('express');
const request = require('supertest');
const userRoutes = require('../../src/routes/users');
const userController = require('../../src/controllers/userController');
const { authenticateToken, optionalAuth } = require('../../src/middleware/auth');

jest.mock('../../src/controllers/userController');
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/rateLimiter', () => ({
  userLimiter: (req, res, next) => next(),
}));

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/users', userRoutes);
    jest.clearAllMocks();

    // Mock authenticateToken
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user-id', email: 'test@example.com' };
      next();
    });

    // Mock optionalAuth
    optionalAuth.mockImplementation((req, res, next) => {
      next();
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should call getCurrentUserProfile controller', async () => {
      userController.getCurrentUserProfile.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { user: {} } });
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(userController.getCurrentUserProfile).toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should call updateCurrentUserProfile controller', async () => {
      userController.updateCurrentUserProfile.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { user: {} } });
      });

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ displayName: 'New Name' });

      expect(response.status).toBe(200);
      expect(userController.updateCurrentUserProfile).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/search', () => {
    it('should call searchUsers controller', async () => {
      userController.searchUsers.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { users: [] } });
      });

      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'test' });

      expect(response.status).toBe(200);
      expect(userController.searchUsers).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should call getUserById controller', async () => {
      userController.getUserById.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { user: {} } });
      });

      const response = await request(app)
        .get('/api/v1/users/user-id-123');

      expect(response.status).toBe(200);
      expect(userController.getUserById).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/:id/followers', () => {
    it('should call getFollowers controller', async () => {
      userController.getFollowers.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { followers: [] } });
      });

      const response = await request(app)
        .get('/api/v1/users/user-id-123/followers');

      expect(response.status).toBe(200);
      expect(userController.getFollowers).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/:id/following', () => {
    it('should call getFollowing controller', async () => {
      userController.getFollowing.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { following: [] } });
      });

      const response = await request(app)
        .get('/api/v1/users/user-id-123/following');

      expect(response.status).toBe(200);
      expect(userController.getFollowing).toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should call updateProfile controller with authentication', async () => {
      userController.updateProfile.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { user: {} } });
      });

      const response = await request(app)
        .put('/api/v1/users/user-id')
        .set('Authorization', 'Bearer valid-token')
        .send({ displayName: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(userController.updateProfile).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should call deleteUser controller with authentication', async () => {
      userController.deleteUser.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { message: 'Deleted' } });
      });

      const response = await request(app)
        .delete('/api/v1/users/user-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(userController.deleteUser).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/users/:id/follow', () => {
    it('should call followUser controller with authentication', async () => {
      userController.followUser.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { message: 'Followed' } });
      });

      const response = await request(app)
        .post('/api/v1/users/other-user-id/follow')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(userController.followUser).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/users/:id/follow', () => {
    it('should call unfollowUser controller with authentication', async () => {
      userController.unfollowUser.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { message: 'Unfollowed' } });
      });

      const response = await request(app)
        .delete('/api/v1/users/other-user-id/follow')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(userController.unfollowUser).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/:id/follow-status', () => {
    it('should call getFollowStatus controller with authentication', async () => {
      userController.getFollowStatus.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { isFollowing: false } });
      });

      const response = await request(app)
        .get('/api/v1/users/other-user-id/follow-status')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(userController.getFollowStatus).toHaveBeenCalled();
    });
  });
});

