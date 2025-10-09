const {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError,
  createTooManyRequestsError,
} = require('../../src/middleware/errorHandler');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  logError: jest.fn(),
}));

// Mock metrics
jest.mock('../../src/config/metrics', () => ({
  incrementHttpRequest: jest.fn(),
}));

const logger = require('../../src/utils/logger');
const metrics = require('../../src/config/metrics');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      path: '/api/test',
      route: { path: '/api/test' },
      ip: '127.0.0.1',
      requestId: 'test-req-123',
      get: jest.fn(() => 'TestAgent/1.0'),
      user: { id: 'user-123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create AppError with message and status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create AppError with custom code', () => {
      const error = new AppError('Custom error', 422, 'CUSTOM_ERROR');

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('CUSTOM_ERROR');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Stack error', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack error');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Application error', 400, 'APP_ERROR');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Application error',
          code: 'APP_ERROR',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(logger.logError).toHaveBeenCalled();
      expect(metrics.incrementHttpRequest).toHaveBeenCalled();
    });

    it('should handle Mongoose ValidationError', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: {
            path: 'email',
            message: 'Email is required',
            value: '',
          },
          username: {
            path: 'username',
            message: 'Username must be at least 3 characters',
            value: 'ab',
          },
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [
            {
              field: 'email',
              message: 'Email is required',
              value: '',
            },
            {
              field: 'username',
              message: 'Username must be at least 3 characters',
              value: 'ab',
            },
          ],
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle CastError', () => {
      const error = {
        name: 'CastError',
        message: 'Cast to ObjectId failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid data format',
          code: 'CAST_ERROR',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
    });

    it('should handle MongoDB duplicate key error', () => {
      const error = {
        name: 'MongoError',
        code: 11000,
        message: 'Duplicate key error',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource already exists',
          code: 'DUPLICATE_ERROR',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
    });

    it('should handle JSON syntax error', () => {
      const error = {
        name: 'SyntaxError',
        message: 'Unexpected token in JSON',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid JSON format',
          code: 'INVALID_JSON',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Dev error');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFound', () => {
    it('should return 404 response', () => {
      notFound(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Route not found',
          code: 'ROUTE_NOT_FOUND',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(logger.warn).toHaveBeenCalled();
      expect(metrics.incrementHttpRequest).toHaveBeenCalledWith('GET', '/api/test', 404);
    });
  });

  describe('asyncHandler', () => {
    it('should call next with error if promise rejects', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should not call next if promise resolves', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error Factory Functions', () => {
    it('createValidationError should create validation error', () => {
      const error = createValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email' },
      ]);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(1);
    });

    it('createNotFoundError should create not found error', () => {
      const error = createNotFoundError('User');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('createUnauthorizedError should create unauthorized error', () => {
      const error = createUnauthorizedError('Invalid credentials');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('createForbiddenError should create forbidden error', () => {
      const error = createForbiddenError('Access denied');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('createConflictError should create conflict error', () => {
      const error = createConflictError('Resource already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('createTooManyRequestsError should create rate limit error', () => {
      const error = createTooManyRequestsError('Rate limit exceeded');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('TOO_MANY_REQUESTS');
    });
  });
});

