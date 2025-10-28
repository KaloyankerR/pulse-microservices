import { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import logger from '../utils/logger';
import metrics from '../config/metrics';
import { AuthenticatedRequest } from '../types/api';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  code: string | null;
  isOperational: boolean;
  details?: unknown[];

  constructor(message: string, statusCode: number, code: string | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error | AppError,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  } else if ((error as Error & { name?: string }).name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';

    const mongooseError = error as Error & {
      errors?: Record<string, { path?: string; message?: string; value?: unknown }>;
    };

    const validationErrors =
      mongooseError.errors
        ? Object.values(mongooseError.errors).map((err) => ({
            field: err.path || '',
            message: err.message || '',
            value: err.value,
          }))
        : [];

    logger.warn('Mongoose validation error', {
      errors: validationErrors,
      requestId: req.requestId,
    });

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        details: validationErrors,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
    return;
  } else if ((error as Error & { name?: string }).name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    statusCode = 400;
    message = 'Invalid data format';
    code = 'CAST_ERROR';
  } else if (
    (error as Error & { name?: string; code?: number }).name === 'MongoError' &&
    (error as Error & { code?: number }).code === 11000
  ) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ERROR';
  } else if ((error as Error & { name?: string }).name === 'MongoNetworkError') {
    // MongoDB network error
    statusCode = 503;
    message = 'Database connection error';
    code = 'DATABASE_ERROR';
  } else if ((error as Error & { name?: string }).name === 'MongoTimeoutError') {
    // MongoDB timeout error
    statusCode = 504;
    message = 'Database operation timeout';
    code = 'DATABASE_TIMEOUT';
  } else if ((error as Error & { name?: string }).name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if ((error as Error & { name?: string }).name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (
    (error as Error & { name?: string }).name === 'SyntaxError' &&
    error.message.includes('JSON')
  ) {
    // JSON parsing error
    statusCode = 400;
    message = 'Invalid JSON format';
    code = 'INVALID_JSON';
  } else if (
    (error as Error & { code?: string }).code === 'ENOTFOUND' ||
    (error as Error & { code?: string }).code === 'ECONNREFUSED'
  ) {
    // Network connection errors
    statusCode = 503;
    message = 'Service unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }

  // Log error details
  logger.logError(error, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });

  // Increment error metrics
  const route = (req as Request & { route?: { path?: string } }).route?.path || req.path;
  metrics.incrementHttpRequest(req.method, route, statusCode);

  // Send error response
  const errorResponse: {
    success: boolean;
    error: {
      message: string;
      code: string;
      stack?: string;
    };
    meta: {
      timestamp: string;
      version: string;
    };
  } = {
    success: false,
    error: {
      message,
      code,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFound = (req: AuthenticatedRequest, res: Response): void => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
  });

  const route = (req as Request & { route?: { path?: string } }).route?.path || req.url;
  metrics.incrementHttpRequest(req.method, route, 404);

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.toString() : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });

    // Don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
};

// Handle uncaught exceptions
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });

    // Exit the process as it's in an undefined state
    process.exit(1);
  });
};

// Graceful shutdown handler
export const gracefulShutdown = (server: Server) => {
  return (signal: string): void => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown', { error: err.message });
        process.exit(1);
      }

      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
};

// Database connection error handler
export const handleDatabaseError = (error: Error): void => {
  logger.error('Database connection error', {
    message: error.message,
    name: error.name,
    code: (error as Error & { code?: string }).code,
  });

  // Implement retry logic or fallback mechanisms here
  // For now, we'll just log the error
};

// Redis connection error handler
export const handleRedisError = (error: Error): void => {
  logger.error('Redis connection error', {
    message: error.message,
    name: error.name,
    code: (error as Error & { code?: string }).code,
  });

  // Implement retry logic or fallback mechanisms here
  // For now, we'll just log the error
};

// RabbitMQ connection error handler
export const handleRabbitMQError = (error: Error): void => {
  logger.error('RabbitMQ connection error', {
    message: error.message,
    name: error.name,
    code: (error as Error & { code?: string }).code,
  });

  // Implement retry logic or fallback mechanisms here
  // For now, we'll just log the error
};

// Validation error factory
export const createValidationError = (message: string, details: unknown[] = []): AppError => {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  error.details = details;
  return error;
};

// Not found error factory
export const createNotFoundError = (resource = 'Resource'): AppError => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

// Unauthorized error factory
export const createUnauthorizedError = (message = 'Unauthorized'): AppError => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

// Forbidden error factory
export const createForbiddenError = (message = 'Forbidden'): AppError => {
  return new AppError(message, 403, 'FORBIDDEN');
};

// Conflict error factory
export const createConflictError = (message = 'Resource conflict'): AppError => {
  return new AppError(message, 409, 'CONFLICT');
};

// Too many requests error factory
export const createTooManyRequestsError = (message = 'Too many requests'): AppError => {
  return new AppError(message, 429, 'TOO_MANY_REQUESTS');
};

// Initialize error handlers
export const initializeErrorHandlers = (): void => {
  handleUnhandledRejection();
  handleUncaughtException();
};

