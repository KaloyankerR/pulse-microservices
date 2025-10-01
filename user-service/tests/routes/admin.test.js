const express = require('express');
const request = require('supertest');
const adminRoutes = require('../../src/routes/admin');
const adminController = require('../../src/controllers/adminController');
const { authenticateToken, requireAdmin } = require('../../src/middleware/auth');

jest.mock('../../src/controllers/adminController');
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/rateLimiter', () => ({
  userLimiter: (req, res, next) => next(),
}));

describe('Admin Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/admin', adminRoutes);
    jest.clearAllMocks();

    // Mock authenticateToken
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'admin-id', email: 'admin@example.com' };
      next();
    });

    // Mock requireAdmin
    requireAdmin.mockImplementation((req, res, next) => {
      next();
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('should call getAllUsers controller with authentication and admin check', async () => {
      adminController.getAllUsers.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: {
            users: [],
            pagination: { page: 1, limit: 20, totalCount: 0 },
          },
        });
      });

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(adminController.getAllUsers).toHaveBeenCalled();
    });

    it('should support pagination query params', async () => {
      adminController.getAllUsers.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: {
            users: [],
            pagination: { page: 2, limit: 10, totalCount: 0 },
          },
        });
      });

      const response = await request(app)
        .get('/api/v1/admin/users')
        .query({ page: 2, limit: 10 })
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(adminController.getAllUsers).toHaveBeenCalled();
    });
  });
});

