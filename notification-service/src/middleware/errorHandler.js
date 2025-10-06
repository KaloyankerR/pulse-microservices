const logger = require('../utils/logger');
const metrics = require('../config/metrics');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  } else if (error.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    
    const validationErrors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
    
    logger.warn('Mongoose validation error', {
      errors: validationErrors,
      requestId: req.requestId,
    });

    return res.status(statusCode).json({
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
  } else if (error.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    statusCode = 400;
    message = 'Invalid data format';
    code = 'CAST_ERROR';
  } else if (error.name === 'MongoError' && error.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ERROR';
  } else if (error.name === 'MongoNetworkError') {
    // MongoDB network error
    statusCode = 503;
    message = 'Database connection error';
    code = 'DATABASE_ERROR';
  } else if (error.name === 'MongoTimeoutError') {
    // MongoDB timeout error
    statusCode = 504;
    message = 'Database operation timeout';
    code = 'DATABASE_TIMEOUT';
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    // JSON parsing error
    statusCode = 400;
    message = 'Invalid JSON format';
    code = 'INVALID_JSON';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
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
  metrics.incrementHttpRequest(req.method, req.route?.path || req.path, statusCode);

  // Send error response
  const errorResponse = {
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
const notFound = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
  });

  metrics.incrementHttpRequest(req.method, req.url, 404);

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
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle unhandled promise rejections
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason.toString(),
      stack: reason.stack,
      promise: promise.toString(),
    });
    
    // Don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
};

// Handle uncaught exceptions
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    
    // Exit the process as it's in an undefined state
    process.exit(1);
  });
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
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
const handleDatabaseError = (error) => {
  logger.error('Database connection error', {
    message: error.message,
    name: error.name,
    code: error.code,
  });

  // Implement retry logic or fallback mechanisms here
  // For now, we'll just log the error
};

// Redis connection error handler
const handleRedisError = (error) => {
  logger.error('Redis connection error', {
    message: error.message,
    name: error.name,
    code: error.code,
  });

  // Implement retry logic or fallback mechanisms here
  // For now, we'll just log the error
};

// RabbitMQ connection error handler
const handleRabbitMQError = (error) => {
  logger.error('RabbitMQ connection error', {
    message: error.message,
    name: error.name,
    code: error.code,
  });

  // Implement retry logic or fallback mechanisms here
  // For now, we'll just log the error
};

// Validation error factory
const createValidationError = (message, details = []) => {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  error.details = details;
  return error;
};

// Not found error factory
const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

// Unauthorized error factory
const createUnauthorizedError = (message = 'Unauthorized') => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

// Forbidden error factory
const createForbiddenError = (message = 'Forbidden') => {
  return new AppError(message, 403, 'FORBIDDEN');
};

// Conflict error factory
const createConflictError = (message = 'Resource conflict') => {
  return new AppError(message, 409, 'CONFLICT');
};

// Too many requests error factory
const createTooManyRequestsError = (message = 'Too many requests') => {
  return new AppError(message, 429, 'TOO_MANY_REQUESTS');
};

// Initialize error handlers
const initializeErrorHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  gracefulShutdown,
  handleDatabaseError,
  handleRedisError,
  handleRabbitMQError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError,
  createTooManyRequestsError,
  initializeErrorHandlers,
};
