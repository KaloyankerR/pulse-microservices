const logger = require('../../src/utils/logger');

describe('Logger Utility', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Logger Instance', () => {
    it('should have required methods', () => {
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should have custom logging methods', () => {
      expect(logger.logNotification).toBeDefined();
      expect(logger.logEventProcessing).toBeDefined();
      expect(logger.logDatabaseOperation).toBeDefined();
      expect(logger.logCacheOperation).toBeDefined();
      expect(logger.logError).toBeDefined();
      expect(logger.logPerformance).toBeDefined();
    });
  });

  describe('logNotification', () => {
    it('should log notification action with required parameters', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logNotification('created', 'notif-123', 'user-456');
      
      expect(spy).toHaveBeenCalledWith('Notification created', {
        action: 'created',
        notificationId: 'notif-123',
        userId: 'user-456',
      });
    });

    it('should log notification with additional metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logNotification('updated', 'notif-789', 'user-123', { status: 'read' });
      
      expect(spy).toHaveBeenCalledWith('Notification updated', {
        action: 'updated',
        notificationId: 'notif-789',
        userId: 'user-123',
        status: 'read',
      });
    });
  });

  describe('logEventProcessing', () => {
    it('should log event processing with status', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logEventProcessing('user.created', 'success');
      
      expect(spy).toHaveBeenCalledWith('Event processing: user.created', {
        eventType: 'user.created',
        status: 'success',
      });
    });

    it('should log event processing with metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logEventProcessing('post.liked', 'processing', { attemptCount: 1 });
      
      expect(spy).toHaveBeenCalledWith('Event processing: post.liked', {
        eventType: 'post.liked',
        status: 'processing',
        attemptCount: 1,
      });
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log database operation', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logDatabaseOperation('insert', 'notifications', 'success');
      
      expect(spy).toHaveBeenCalledWith('Database operation: insert', {
        operation: 'insert',
        collection: 'notifications',
        status: 'success',
      });
    });

    it('should log database operation with metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logDatabaseOperation('query', 'users', 'success', { duration: '50ms' });
      
      expect(spy).toHaveBeenCalledWith('Database operation: query', {
        operation: 'query',
        collection: 'users',
        status: 'success',
        duration: '50ms',
      });
    });
  });

  describe('logCacheOperation', () => {
    it('should log cache operation', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logCacheOperation('get', 'user:123', 'hit');
      
      expect(spy).toHaveBeenCalledWith('Cache operation: get', {
        operation: 'get',
        key: 'user:123',
        status: 'hit',
      });
    });

    it('should log cache operation with metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logCacheOperation('set', 'notification:456', 'success', { ttl: 3600 });
      
      expect(spy).toHaveBeenCalledWith('Cache operation: set', {
        operation: 'set',
        key: 'notification:456',
        status: 'success',
        ttl: 3600,
      });
    });
  });

  describe('logError', () => {
    it('should log error with message and stack', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Test error');
      
      logger.logError(error);
      
      expect(spy).toHaveBeenCalledWith('Application error', {
        error: 'Test error',
        stack: expect.stringContaining('Error: Test error'),
      });
    });

    it('should log error with context', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Database error');
      
      logger.logError(error, { userId: 'user-123', operation: 'save' });
      
      expect(spy).toHaveBeenCalledWith('Application error', {
        error: 'Database error',
        stack: expect.stringContaining('Error: Database error'),
        userId: 'user-123',
        operation: 'save',
      });
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logPerformance('getNotifications', 150);
      
      expect(spy).toHaveBeenCalledWith('Performance: getNotifications', {
        operation: 'getNotifications',
        duration: '150ms',
      });
    });

    it('should log performance with metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      
      logger.logPerformance('saveNotification', 75, { userId: 'user-789' });
      
      expect(spy).toHaveBeenCalledWith('Performance: saveNotification', {
        operation: 'saveNotification',
        duration: '75ms',
        userId: 'user-789',
      });
    });
  });

  describe('addRequestId middleware', () => {
    it('should add request ID from x-request-id header', () => {
      const req = {
        headers: {
          'x-request-id': 'req-123',
        },
      };
      const res = {};
      const next = jest.fn();

      logger.addRequestId(req, res, next);

      expect(req.requestId).toBe('req-123');
      expect(req.logger).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should add request ID from x-correlation-id header', () => {
      const req = {
        headers: {
          'x-correlation-id': 'corr-456',
        },
      };
      const res = {};
      const next = jest.fn();

      logger.addRequestId(req, res, next);

      expect(req.requestId).toBe('corr-456');
      expect(next).toHaveBeenCalled();
    });

    it('should generate random request ID if no header present', () => {
      const req = {
        headers: {},
      };
      const res = {};
      const next = jest.fn();

      logger.addRequestId(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(req.requestId.length).toBeGreaterThan(0);
      expect(next).toHaveBeenCalled();
    });

    it('should attach logger with requestId to req', () => {
      const req = {
        headers: { 'x-request-id': 'test-123' },
      };
      const res = {};
      const next = jest.fn();

      logger.addRequestId(req, res, next);

      expect(req.logger).toBeDefined();
      expect(req.logger.info).toBeDefined();
      expect(req.logger.error).toBeDefined();
      expect(req.logger.warn).toBeDefined();
      expect(req.logger.debug).toBeDefined();
    });
  });

  describe('expressMiddleware', () => {
    it('should log HTTP request and response', (done) => {
      const infoSpy = jest.spyOn(logger, 'info');
      
      const req = {
        method: 'GET',
        url: '/api/notifications',
        ip: '127.0.0.1',
        requestId: 'test-req-123',
        get: jest.fn(() => 'TestAgent/1.0'),
      };
      
      const res = {
        statusCode: 200,
        end: function(chunk, encoding) {
          // Verify request was logged
          expect(infoSpy).toHaveBeenCalledWith('HTTP Request', {
            method: 'GET',
            url: '/api/notifications',
            userAgent: 'TestAgent/1.0',
            ip: '127.0.0.1',
            requestId: 'test-req-123',
          });

          // Verify response will be logged
          setTimeout(() => {
            expect(infoSpy).toHaveBeenCalledWith('HTTP Response', {
              method: 'GET',
              url: '/api/notifications',
              statusCode: 200,
              duration: expect.stringMatching(/\d+ms/),
              requestId: 'test-req-123',
            });
            done();
          }, 10);
        },
      };
      
      const next = jest.fn(() => {
        res.end();
      });

      logger.expressMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});

