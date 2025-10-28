import { Request, Response, NextFunction } from 'express';
import metrics from '../config/metrics';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/api';

// Request metrics middleware
export const requestMetrics = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Override res.end to capture response metrics
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: unknown, encoding?: unknown): Response {
    const duration = Date.now() - startTime;
    const route = (req as Request & { route?: { path?: string } }).route?.path || req.path;

    // Record HTTP request metrics
    metrics.incrementHttpRequest(req.method, route, res.statusCode);
    metrics.recordHttpRequestDuration(req.method, route, duration); // Already in ms, metrics handles conversion

    // Log performance metrics for slow requests
    if (duration > 1000) {
      // Log requests taking more than 1 second
      logger.logPerformance(`${req.method} ${route}`, duration, {
        statusCode: res.statusCode,
        userId: req.user?.id,
        requestId: req.requestId,
      });
    }

    return originalEnd(chunk as string, encoding as BufferEncoding);
  };

  next();
};

// Database operation metrics middleware
export const databaseMetrics = (operation: string, collection: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    try {
      await next();
      const duration = Date.now() - startTime;

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation(operation, collection, 'success');
      metrics.recordDatabaseOperationDuration(operation, duration);

    } catch (error) {
      const duration = Date.now() - startTime;

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation(operation, collection, 'error');
      metrics.recordDatabaseOperationDuration(operation, duration);

      logger.logError(error, {
        operation,
        collection,
        duration,
        userId: (req as AuthenticatedRequest).user?.id,
      });

      throw error;
    }
  };
};

// Cache operation metrics middleware
export const cacheMetrics = (operation: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    try {
      await next();
      const duration = Date.now() - startTime;

      logger.logPerformance(`Cache ${operation}`, duration, {
        operation,
        userId: req.user?.id,
        requestId: req.requestId,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.logError(error, {
        cacheOperation: operation,
        duration,
        userId: req.user?.id,
      });

      throw error;
    }
  };
};

// Notification processing metrics middleware
export const notificationMetrics = (type: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    try {
      await next();
      const duration = Date.now() - startTime;

      metrics.incrementNotificationCounter(type, 'success');
      metrics.recordNotificationProcessingDuration(type, duration);

    } catch (error) {
      const duration = Date.now() - startTime;

      metrics.incrementNotificationCounter(type, 'error');
      metrics.recordNotificationProcessingDuration(type, duration);

      logger.logError(error, {
        notificationType: type,
        duration,
        userId: req.user?.id,
      });

      throw error;
    }
  };
};

// Event processing metrics middleware
export const eventMetrics = (eventType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    try {
      await next();
      const duration = Date.now() - startTime;

      metrics.incrementEventProcessingCounter(eventType, 'success');
      metrics.recordEventProcessingDuration(eventType, duration);

    } catch (error) {
      const duration = Date.now() - startTime;

      metrics.incrementEventProcessingCounter(eventType, 'error');
      metrics.recordEventProcessingDuration(eventType, duration);

      logger.logError(error, {
        eventType,
        duration,
        userId: req.user?.id,
      });

      throw error;
    }
  };
};

// Memory usage metrics middleware
export const memoryMetrics = (req: Request, res: Response, next: NextFunction): void => {
  // Update memory metrics
  metrics.updateMemoryUsage();

  next();
};

// Connection metrics middleware
export const connectionMetrics = (req: Request, res: Response, next: NextFunction): void => {
  // This would typically be called when connections are established/closed
  // For HTTP requests, we can track active connections
  metrics.setActiveConnections(process.listenerCount('request'));

  next();
};

// Custom metrics middleware for specific operations
export const customMetrics = (metricName: string, labels: Record<string, unknown> = {}) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Override res.end to capture custom metrics
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: unknown): Response {
      const duration = Date.now() - startTime;

      // You can create custom metrics here based on your needs
      logger.logPerformance(metricName, duration, {
        ...labels,
        statusCode: res.statusCode,
        userId: req.user?.id,
      });

      return originalEnd(chunk as string, encoding as BufferEncoding);
    };

    next();
  };
};

// Business logic metrics middleware
export const businessMetrics = {
  // Track notification creation
  trackNotificationCreation: (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: unknown): Response {
      const duration = Date.now() - startTime;

      if (res.statusCode === 200 || res.statusCode === 201) {
        const body = (req as Request & { body?: { type?: string; id?: string } }).body;
        metrics.incrementNotificationCounter(body?.type || 'UNKNOWN', 'created');
        logger.logNotification('created', body?.id || 'unknown', req.user?.id || 'unknown', {
          type: body?.type,
          duration,
        });
      }

      return originalEnd(chunk as string, encoding as BufferEncoding);
    };

    next();
  },

  // Track notification reads
  trackNotificationRead: (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: unknown): Response {
      const duration = Date.now() - startTime;

      if (res.statusCode === 200) {
        logger.logNotification('read', (req.params as { id?: string }).id || 'unknown', req.user?.id || 'unknown', {
          duration,
        });
      }

      return originalEnd(chunk as string, encoding as BufferEncoding);
    };

    next();
  },

  // Track preference updates
  trackPreferenceUpdate: (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: unknown): Response {
      const duration = Date.now() - startTime;

      if (res.statusCode === 200) {
        const body = req.body as Record<string, unknown> | undefined;
        logger.info('Notification preferences updated', {
          userId: req.user?.id,
          preferences: body ? Object.keys(body) : [],
          duration,
        });
      }

      return originalEnd(chunk as string, encoding as BufferEncoding);
    };

    next();
  },
};

// Metrics endpoint handler
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metricsData = await metrics.getMetrics();

    res.set('Content-Type', 'text/plain');
    res.send(metricsData);
  } catch (error) {
    logger.logError(error, { action: 'getMetrics' });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve metrics',
        code: 'METRICS_ERROR',
      },
    });
  }
};

// Health check metrics
export const healthCheckMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: unknown, encoding?: unknown): Response {
    const duration = Date.now() - startTime;

    // Track health check response times
    logger.logPerformance('health_check', duration, {
      statusCode: res.statusCode,
      endpoint: req.path,
    });

    return originalEnd(chunk as string, encoding as BufferEncoding);
  };

  next();
};

// Error metrics middleware
export const errorMetrics = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const originalSend = res.send.bind(res);

  res.send = function (data: unknown): Response {
    // Track error responses
    if (res.statusCode >= 400) {
      logger.warn('Error response sent', {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        requestId: req.requestId,
      });
    }

    return originalSend(data);
  };

  next();
};

