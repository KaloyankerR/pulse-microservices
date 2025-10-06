const winston = require('winston');
const path = require('path');

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
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
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
  }));
}

// Add request ID to logs if available
logger.addRequestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || 
    req.headers['x-correlation-id'] || 
    Math.random().toString(36).substr(2, 9);
  
  // Add request ID to logger context
  const originalLogger = logger;
  req.logger = {
    info: (message, meta) => originalLogger.info(message, { ...meta, requestId: req.requestId }),
    error: (message, meta) => originalLogger.error(message, { ...meta, requestId: req.requestId }),
    warn: (message, meta) => originalLogger.warn(message, { ...meta, requestId: req.requestId }),
    debug: (message, meta) => originalLogger.debug(message, { ...meta, requestId: req.requestId }),
  };
  
  next();
};

// Logging middleware for Express
logger.expressMiddleware = (req, res, next) => {
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
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Utility methods for structured logging
logger.logNotification = (action, notificationId, userId, meta = {}) => {
  logger.info(`Notification ${action}`, {
    action,
    notificationId,
    userId,
    ...meta,
  });
};

logger.logEventProcessing = (eventType, status, meta = {}) => {
  logger.info(`Event processing: ${eventType}`, {
    eventType,
    status,
    ...meta,
  });
};

logger.logDatabaseOperation = (operation, collection, status, meta = {}) => {
  logger.info(`Database operation: ${operation}`, {
    operation,
    collection,
    status,
    ...meta,
  });
};

logger.logCacheOperation = (operation, key, status, meta = {}) => {
  logger.info(`Cache operation: ${operation}`, {
    operation,
    key,
    status,
    ...meta,
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

// Performance logging
logger.logPerformance = (operation, duration, meta = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
};

module.exports = logger;
