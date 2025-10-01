const express = require('express');
const request = require('supertest');
const authRoutes = require('../../src/routes/auth');
const authController = require('../../src/controllers/authController');
const { authenticateToken } = require('../../src/middleware/auth');

jest.mock('../../src/controllers/authController');
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/rateLimiter', () => ({
  authLimiter: (req, res, next) => next(),
}));

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    jest.clearAllMocks();

    // Mock authenticateToken to call next
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user-id', email: 'test@example.com' };
      next();
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should call register controller', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ success: true, data: { user: { id: 'user-id' } } });
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should call login controller', async () => {
      authController.login.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { accessToken: 'token' } });
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should call refreshToken controller', async () => {
      authController.refreshToken.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { accessToken: 'new-token' } });
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'refresh-token',
        });

      expect(response.status).toBe(200);
      expect(authController.refreshToken).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should call logout controller with authentication', async () => {
      authController.logout.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(authController.logout).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should call getCurrentUser controller with authentication', async () => {
      authController.getCurrentUser.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { user: { id: 'user-id' } } });
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(authController.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should call changePassword controller with authentication', async () => {
      authController.changePassword.mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { message: 'Password changed successfully' } });
      });

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(authController.changePassword).toHaveBeenCalled();
    });
  });
});

