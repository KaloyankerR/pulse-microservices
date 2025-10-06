const metrics = require('../config/metrics');
const logger = require('../utils/logger');

// Request metrics middleware
const requestMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const route = req.route?.path || req.path;
    
    // Record HTTP request metrics
    metrics.incrementHttpRequest(req.method, route, res.statusCode);
    metrics.recordHttpRequestDuration(req.method, route, duration / 1000); // Convert to seconds
    
    // Log performance metrics for slow requests
    if (duration > 1000) { // Log requests taking more than 1 second
      logger.logPerformance(`${req.method} ${route}`, duration, {
        statusCode: res.statusCode,
        userId: req.user?.id,
        requestId: req.requestId,
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Database operation metrics middleware
const databaseMetrics = (operation, collection) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      await next();
      const duration = Date.now() - startTime;
      
      metrics.incrementDatabaseOperation(operation, collection, 'success');
      metrics.recordDatabaseOperationDuration(operation, duration / 1000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      metrics.incrementDatabaseOperation(operation, collection, 'error');
      metrics.recordDatabaseOperationDuration(operation, duration / 1000);
      
      logger.logError(error, {
        operation,
        collection,
        duration,
        userId: req.user?.id,
      });
      
      throw error;
    }
  };
};

// Cache operation metrics middleware
const cacheMetrics = (operation) => {
  return async (req, res, next) => {
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
const notificationMetrics = (type) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      await next();
      const duration = Date.now() - startTime;
      
      metrics.incrementNotificationCounter(type, 'success');
      metrics.recordNotificationProcessingDuration(type, duration / 1000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      metrics.incrementNotificationCounter(type, 'error');
      metrics.recordNotificationProcessingDuration(type, duration / 1000);
      
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
const eventMetrics = (eventType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      await next();
      const duration = Date.now() - startTime;
      
      metrics.incrementEventProcessingCounter(eventType, 'success');
      metrics.recordEventProcessingDuration(eventType, duration / 1000);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      metrics.incrementEventProcessingCounter(eventType, 'error');
      metrics.recordEventProcessingDuration(eventType, duration / 1000);
      
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
const memoryMetrics = (req, res, next) => {
  // Update memory metrics
  metrics.updateMemoryUsage();
  
  next();
};

// Connection metrics middleware
const connectionMetrics = (req, res, next) => {
  // This would typically be called when connections are established/closed
  // For HTTP requests, we can track active connections
  metrics.setActiveConnections(process.listenerCount('request'));
  
  next();
};

// Custom metrics middleware for specific operations
const customMetrics = (metricName, labels = {}) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to capture custom metrics
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      // You can create custom metrics here based on your needs
      logger.logPerformance(metricName, duration, {
        ...labels,
        statusCode: res.statusCode,
        userId: req.user?.id,
      });
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

// Business logic metrics middleware
const businessMetrics = {
  // Track notification creation
  trackNotificationCreation: (req, res, next) => {
    const startTime = Date.now();
    
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        metrics.incrementNotificationCounter(req.body?.type || 'UNKNOWN', 'created');
        logger.logNotification('created', req.body?.id, req.user?.id, {
          type: req.body?.type,
          duration,
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  },
  
  // Track notification reads
  trackNotificationRead: (req, res, next) => {
    const startTime = Date.now();
    
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        logger.logNotification('read', req.params.id, req.user?.id, {
          duration,
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  },
  
  // Track preference updates
  trackPreferenceUpdate: (req, res, next) => {
    const startTime = Date.now();
    
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        logger.info('Notification preferences updated', {
          userId: req.user?.id,
          preferences: Object.keys(req.body || {}),
          duration,
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  },
};

// Metrics endpoint handler
const getMetrics = async (req, res) => {
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
const healthCheckMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Track health check response times
    logger.logPerformance('health_check', duration, {
      statusCode: res.statusCode,
      endpoint: req.path,
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error metrics middleware
const errorMetrics = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
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
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  requestMetrics,
  databaseMetrics,
  cacheMetrics,
  notificationMetrics,
  eventMetrics,
  memoryMetrics,
  connectionMetrics,
  customMetrics,
  businessMetrics,
  getMetrics,
  healthCheckMetrics,
  errorMetrics,
};
