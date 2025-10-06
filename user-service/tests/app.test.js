const request = require('supertest');

// Mock all dependencies before requiring app
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../src/config/swagger', () => ({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
}));

jest.mock('../src/middleware/rateLimiter', () => ({
  generalLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
  userLimiter: (req, res, next) => next(),
}));

jest.mock('../src/routes/auth', () => {
  const express = require('express');
  const router = express.Router();
  router.post('/register', (req, res) => res.status(201).json({ success: true }));
  router.post('/login', (req, res) => res.status(200).json({ success: true }));
  return router;
});

jest.mock('../src/routes/users', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/search', (req, res) => res.status(200).json({ success: true }));
  return router;
});

jest.mock('../src/routes/admin', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/users', (req, res) => res.status(200).json({ success: true }));
  return router;
});

describe('App', () => {
  let app;

  beforeAll(() => {
    // Set test environment variables
    process.env.PORT = '8080';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test-secret';

    // Require app after mocks are set up
    app = require('../src/app');
  });

  describe('Health Check', () => {
    it('should return 200 on /health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'healthy',
          service: 'pulse-user-service',
          version: '1.0.0',
          timestamp: expect.any(String),
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });
  });

  describe('Root Endpoint', () => {
    it('should return 200 on /', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Pulse User Service API',
          version: '1.0.0',
          documentation: '/api-docs',
          health: '/health',
          metrics: '/metrics',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });
  });

  describe('API Routes', () => {
    it('should have auth routes mounted', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
    });

    it('should have user routes mounted', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'test' });

      expect(response.status).toBe(200);
    });

    it('should have admin routes mounted', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users');

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('CORS Configuration', () => {
    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should have security headers from helmet', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('JSON Body Parser', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

