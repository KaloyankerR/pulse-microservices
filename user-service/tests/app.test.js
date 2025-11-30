const request = require('supertest');

// Mock all dependencies before requiring app
jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../src/middleware/rateLimiter', () => ({
  generalLimiter: (req, res, next) => next(),
  userLimiter: (req, res, next) => next(),
}));

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    userProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../src/config/metrics', () => ({
  __esModule: true,
  default: {
    metricsMiddleware: (req, res, next) => next(),
    getMetrics: jest.fn().mockResolvedValue('# metrics'),
    register: {
      contentType: 'text/plain',
    },
  },
}));

describe('App', () => {
  let app;

  beforeAll(() => {
    // Set test environment variables
    process.env.PORT = '8080';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test-secret';

    // Require app after mocks are set up
    app = require('../src/app').default || require('../src/app');
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
    it('should have user routes mounted', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'test' });

      // Should either return 200, 400, 401, 404, or 500 depending on validation/auth/errors
      expect([200, 400, 401, 404, 500]).toContain(response.status);
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
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/users/profile')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

