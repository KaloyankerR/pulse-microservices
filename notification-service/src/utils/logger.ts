import winston from 'winston';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Extended logger interface
interface ExtendedLogger extends winston.Logger {
  addRequestId: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
  expressMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
  logNotification: (action: string, notificationId: string | 'all', userId: string, meta?: Record<string, unknown>) => void;
  logEventProcessing: (eventType: string, status: string, meta?: Record<string, unknown>) => void;
  logDatabaseOperation: (operation: string, collection: string, status: string, meta?: Record<string, unknown>) => void;
  logCacheOperation: (operation: string, key: string, status: string, meta?: Record<string, unknown>) => void;
  logError: (error: Error | unknown, context?: Record<string, unknown>) => void;
  logPerformance: (operation: string, duration: number, meta?: Record<string, unknown>) => void;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'pulse-notification-service',
    version: '1.0.0',
  },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
}) as ExtendedLogger;

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0) {
            metaStr = ` ${JSON.stringify(meta)}`;
          }
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// Add request ID to logs if available
logger.addRequestId = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  req.requestId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    Math.random().toString(36).substr(2, 9);

  // Add request ID to logger context
  const originalLogger = logger;
  req.logger = {
    info: (message: string, meta?: Record<string, unknown>) => {
      originalLogger.info(message, { ...meta, requestId: req.requestId });
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      originalLogger.error(message, { ...meta, requestId: req.requestId });
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      originalLogger.warn(message, { ...meta, requestId: req.requestId });
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      originalLogger.debug(message, { ...meta, requestId: req.requestId });
    },
  };

  next();
};

// Logging middleware for Express
logger.expressMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId,
  });

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: unknown, encoding?: unknown): Response {
    const duration = Date.now() - start;

    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
    });

    return originalEnd(chunk as string, encoding as BufferEncoding);
  };

  next();
};

// Utility methods for structured logging
logger.logNotification = (
  action: string,
  notificationId: string | 'all',
  userId: string,
  meta: Record<string, unknown> = {}
): void => {
  logger.info(`Notification ${action}`, {
    action,
    notificationId,
    userId,
    ...meta,
  });
};

logger.logEventProcessing = (
  eventType: string,
  status: string,
  meta: Record<string, unknown> = {}
): void => {
  logger.info(`Event processing: ${eventType}`, {
    eventType,
    status,
    ...meta,
  });
};

logger.logDatabaseOperation = (
  operation: string,
  collection: string,
  status: string,
  meta: Record<string, unknown> = {}
): void => {
  logger.info(`Database operation: ${operation}`, {
    operation,
    collection,
    status,
    ...meta,
  });
};

logger.logCacheOperation = (
  operation: string,
  key: string,
  status: string,
  meta: Record<string, unknown> = {}
): void => {
  logger.info(`Cache operation: ${operation}`, {
    operation,
    key,
    status,
    ...meta,
  });
};

logger.logError = (error: Error | unknown, context: Record<string, unknown> = {}): void => {
  if (error instanceof Error) {
    logger.error('Application error', {
      error: error.message,
      stack: error.stack,
      ...context,
    });
  } else {
    logger.error('Application error', {
      error: String(error),
      ...context,
    });
  }
};

// Performance logging
logger.logPerformance = (
  operation: string,
  duration: number,
  meta: Record<string, unknown> = {}
): void => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
};

export default logger;

