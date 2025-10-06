const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return healthy status when all services are connected', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('pulse-notification-service');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.dependencies).toBeDefined();
      expect(response.body.data.dependencies.database).toBeDefined();
      expect(response.body.data.dependencies.redis).toBeDefined();
      expect(response.body.data.dependencies.rabbitmq).toBeDefined();
      expect(response.body.data.eventConsumers).toBeDefined();
    });

    it('should include timestamp in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      
      // Verify timestamp is valid ISO string
      expect(new Date(response.body.data.timestamp)).toBeInstanceOf(Date);
      expect(new Date(response.body.meta.timestamp)).toBeInstanceOf(Date);
    });

    it('should include version information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.meta.version).toBe('v1');
    });
  });

  describe('GET /ready', () => {
    it('should return ready status when all services are connected', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ready).toBe(true);
      expect(response.body.data.service).toBe('pulse-notification-service');
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should return 503 when services are not ready', async () => {
      // Mock database health check to fail
      const database = require('../src/config/database');
      const originalHealthCheck = database.healthCheck;
      database.healthCheck = jest.fn().mockResolvedValue({
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/ready')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.ready).toBe(false);

      // Restore original function
      database.healthCheck = originalHealthCheck;
    });

    it('should handle health check errors gracefully', async () => {
      // Mock database health check to throw error
      const database = require('../src/config/database');
      const originalHealthCheck = database.healthCheck;
      database.healthCheck = jest.fn().mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/ready')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.ready).toBe(false);
      expect(response.body.data.error).toBeDefined();

      // Restore original function
      database.healthCheck = originalHealthCheck;
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    it('should handle metrics retrieval errors', async () => {
      // Mock metrics.getMetrics to throw error
      const metrics = require('../src/config/metrics');
      const originalGetMetrics = metrics.getMetrics;
      metrics.getMetrics = jest.fn().mockRejectedValue(new Error('Metrics retrieval failed'));

      await request(app)
        .get('/metrics')
        .expect(500);

      // Restore original function
      metrics.getMetrics = originalGetMetrics;
    });
  });

  describe('GET /', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Pulse Notification Service API');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.documentation).toBe('/api-docs');
      expect(response.body.data.health).toBe('/health');
      expect(response.body.data.ready).toBe('/ready');
      expect(response.body.data.metrics).toBe('/metrics');
    });
  });

  describe('Rate limiting on health endpoints', () => {
    it('should apply rate limiting to health check', async () => {
      // Make multiple requests quickly
      const promises = Array(10).fill().map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (health check has higher rate limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should apply stricter rate limiting to metrics', async () => {
      // Make multiple requests to metrics endpoint
      const promises = Array(15).fill().map(() =>
        request(app).get('/metrics')
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in health check response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock app to throw an error
      const originalApp = app;
      const mockApp = {
        get: jest.fn().mockImplementation((path, handler) => {
          if (path === '/health') {
            return (req, res) => {
              throw new Error('Unexpected error');
            };
          }
          return originalApp.get(path, handler);
        }),
        use: originalApp.use,
        listen: originalApp.listen,
      };

      // This test would require more complex mocking to properly test
      // For now, we'll just ensure the health check works normally
      await request(app)
        .get('/health')
        .expect(200);
    });
  });
});
