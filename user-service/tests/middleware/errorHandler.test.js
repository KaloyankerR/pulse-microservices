const { AppError, errorHandler, notFound } = require('../../src/middleware/errorHandler');
const logger = require('../../src/utils/logger').default || require('../../src/utils/logger');

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ErrorHandler Middleware', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    logger.error = jest.fn();
  });

  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should have default code if not provided', () => {
      const error = new AppError('Test error', 500);

      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle Prisma P2002 error (unique constraint)', () => {
      const error = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A user with this email already exists',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle Prisma P2025 error (record not found)', () => {
      const error = {
        code: 'P2025',
        message: 'Record not found',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle Prisma P2003 error (foreign key constraint)', () => {
      const error = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Invalid reference',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'Invalid token',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'Token expired',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle ValidationError', () => {
      const error = {
        name: 'ValidationError',
        message: 'Validation failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle CastError', () => {
      const error = {
        name: 'CastError',
        message: 'Cast failed',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle JSON parsing error', () => {
      const error = new SyntaxError('Unexpected token');
      error.status = 400;
      error.body = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON format in request body',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle unknown errors as internal server error', () => {
      const error = new Error('Unknown error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: expect.any(String), // Can be "Internal server error" or "Unknown error" depending on NODE_ENV
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should log error details', () => {
      const error = new AppError('Test error', 400);

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error occurred:', expect.objectContaining({
        error: 'Test error',
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'Test User Agent',
      }));
    });
  });

  describe('notFound', () => {
    it('should create 404 error for unknown routes', () => {
      req.originalUrl = '/unknown/route';

      notFound(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Route /unknown/route not found',
          statusCode: 404,
          code: 'ROUTE_NOT_FOUND',
        }),
      );
    });
  });
});

