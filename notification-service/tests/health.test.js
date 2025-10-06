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

    it('should return ready status when all services are connected', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ready).toBe(true);
      expect(response.body.data.service).toBe('pulse-notification-service');
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

});
