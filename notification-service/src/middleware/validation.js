const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        logger.warn('Validation error', {
          errors: errorDetails,
          property,
          requestId: req.requestId,
        });

        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errorDetails,
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      // Replace the request property with the validated and sanitized value
      req[property] = value;
      next();
    } catch (validationError) {
      logger.logError(validationError, { action: 'validate', property });
      return res.status(500).json({
        success: false,
        error: {
          message: 'Validation processing error',
          code: 'VALIDATION_PROCESSING_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  };
};

// Notification validation schemas
const notificationSchemas = {
  // GET /api/notifications query parameters
  getNotifications: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid(
      'FOLLOW',
      'LIKE',
      'COMMENT',
      'EVENT_INVITE',
      'EVENT_RSVP',
      'POST_MENTION',
      'SYSTEM',
      'MESSAGE',
      'POST_SHARE',
      'EVENT_REMINDER',
      'FRIEND_REQUEST',
      'ACCOUNT_VERIFICATION',
      'PASSWORD_RESET',
      'SECURITY_ALERT'
    ).optional(),
    unread_only: Joi.boolean().optional(),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Notification ID parameter
  notificationId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),

  // Cleanup query parameters
  cleanup: Joi.object({
    days_old: Joi.number().integer().min(1).max(365).default(30),
  }),
};

// Notification preferences validation schemas
const preferencesSchemas = {
  // Update notification preferences
  updatePreferences: Joi.object({
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    in_app_notifications: Joi.boolean().optional(),
    quiet_hours: Joi.object({
      enabled: Joi.boolean().optional(),
      start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timezone: Joi.string().optional(),
    }).optional(),
    preferences: Joi.object().pattern(
      Joi.string().valid(
        'FOLLOW',
        'LIKE',
        'COMMENT',
        'EVENT_INVITE',
        'EVENT_RSVP',
        'POST_MENTION',
        'SYSTEM',
        'MESSAGE',
        'POST_SHARE',
        'EVENT_REMINDER',
        'FRIEND_REQUEST',
        'ACCOUNT_VERIFICATION',
        'PASSWORD_RESET',
        'SECURITY_ALERT'
      ),
      Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        in_app: Joi.boolean().optional(),
      })
    ).optional(),
  }).min(1), // At least one field must be provided
};

// Common validation schemas
const commonSchemas = {
  // MongoDB ObjectId
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  // UUID
  uuid: Joi.string().uuid().required(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Search query
  searchQuery: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

// Validation middleware functions
const validateNotificationId = validate(notificationSchemas.notificationId, 'params');
const validateGetNotifications = validate(notificationSchemas.getNotifications, 'query');
const validateCleanup = validate(notificationSchemas.cleanup, 'query');
const validateUpdatePreferences = validate(preferencesSchemas.updatePreferences, 'body');

// Custom validation middleware for specific use cases
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            message: `${paramName} parameter is required`,
            code: 'MISSING_PARAMETER',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid ${paramName} format`,
            code: 'INVALID_OBJECT_ID',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      next();
    } catch (error) {
      logger.logError(error, { action: 'validateObjectId', paramName });
      return res.status(500).json({
        success: false,
        error: {
          message: 'Parameter validation error',
          code: 'VALIDATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  };
};

// Validate UUID
const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            message: `${paramName} parameter is required`,
            code: 'MISSING_PARAMETER',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid ${paramName} format`,
            code: 'INVALID_UUID',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      }

      next();
    } catch (error) {
      logger.logError(error, { action: 'validateUUID', paramName });
      return res.status(500).json({
        success: false,
        error: {
          message: 'Parameter validation error',
          code: 'VALIDATION_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }
  };
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid page parameter',
          code: 'INVALID_PAGE',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid limit parameter (must be between 1 and 100)',
          code: 'INVALID_LIMIT',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    }

    // Update query parameters with parsed values
    req.query.page = pageNum;
    req.query.limit = limitNum;

    next();
  } catch (error) {
    logger.logError(error, { action: 'validatePagination' });
    return res.status(500).json({
      success: false,
      error: {
        message: 'Pagination validation error',
        code: 'VALIDATION_ERROR',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
  }
};

// Sanitize input middleware
const sanitizeInput = (req, res, next) => {
  try {
    // Recursively sanitize strings in request body
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        return obj.trim();
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized = {};
        Object.keys(obj).forEach(key => {
          sanitized[key] = sanitizeObject(obj[key]);
        });
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    logger.logError(error, { action: 'sanitizeInput' });
    next(); // Continue even if sanitization fails
  }
};

module.exports = {
  validate,
  validateNotificationId,
  validateGetNotifications,
  validateCleanup,
  validateUpdatePreferences,
  validateObjectId,
  validateUUID,
  validatePagination,
  sanitizeInput,
  schemas: {
    notification: notificationSchemas,
    preferences: preferencesSchemas,
    common: commonSchemas,
  },
};
