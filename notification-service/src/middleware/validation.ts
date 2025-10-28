import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/api';

// Generic validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: property === 'query', // Allow unknown for query params, strict for body/params
      });

      if (error) {
        const errorDetails = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        logger.warn('Validation error', {
          errors: errorDetails,
          property,
          requestId: req.requestId,
        });

        res.status(400).json({
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
        return;
      }

      // Replace the request property with the validated and sanitized value
      // @ts-ignore - AuthenticatedRequest index signature
      (req as Record<string, unknown>)[property] = value;
      next();
    } catch (validationError) {
      logger.logError(validationError, { action: 'validate', property });
      res.status(500).json({
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
export const notificationSchemas = {
  // GET /api/notifications query parameters
  getNotifications: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string()
      .valid(
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
      )
      .optional(),
    unread_only: Joi.boolean().optional(),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Notification ID parameter
  notificationId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),

  // Cleanup query parameters
  cleanup: Joi.object({
    days_old: Joi.number().integer().min(1).max(365).default(30),
  }),
};

// Notification preferences validation schemas
export const preferencesSchemas = {
  // Update notification preferences
  updatePreferences: Joi.object({
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    in_app_notifications: Joi.boolean().optional(),
    quiet_hours: Joi.object({
      enabled: Joi.boolean().optional(),
      start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      timezone: Joi.string().optional(),
    }).optional(),
    preferences: Joi.object()
      .pattern(
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
      )
      .optional(),
  }).min(1), // At least one field must be provided
};

// Common validation schemas
export const commonSchemas = {
  // MongoDB ObjectId
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

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
export const validateNotificationId = validate(notificationSchemas.notificationId, 'params');
export const validateGetNotifications = validate(notificationSchemas.getNotifications, 'query');
export const validateCleanup = validate(notificationSchemas.cleanup, 'query');
export const validateUpdatePreferences = validate(preferencesSchemas.updatePreferences, 'body');

// Custom validation middleware for specific use cases
export const validateObjectId = (paramName = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];

      if (!id) {
        res.status(400).json({
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
        return;
      }

      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({
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
        return;
      }

      next();
    } catch (error) {
      logger.logError(error, { action: 'validateObjectId', paramName });
      res.status(500).json({
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
export const validateUUID = (paramName = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];

      if (!id) {
        res.status(400).json({
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
        return;
      }

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        res.status(400).json({
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
        return;
      }

      next();
    } catch (error) {
      logger.logError(error, { action: 'validateUUID', paramName });
      res.status(500).json({
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
export const validatePagination = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (Number.isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
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
      return;
    }

    if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
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
      return;
    }

    // Update query parameters with parsed values
    // @ts-ignore - query parameter type conversion
    req.query.page = pageNum;
    // @ts-ignore - query parameter type conversion
    req.query.limit = limitNum;

    next();
  } catch (error) {
    logger.logError(error, { action: 'validatePagination' });
    res.status(500).json({
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
export const sanitizeInput = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Recursively sanitize strings in request body
    const sanitizeObject = (obj: unknown): unknown => {
      if (typeof obj === 'string') {
        return obj.trim();
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        Object.keys(obj).forEach((key) => {
          sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
        });
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body) as typeof req.body;
    }

    if (req.query) {
      req.query = sanitizeObject(req.query) as typeof req.query;
    }

    next();
  } catch (error) {
    logger.logError(error, { action: 'sanitizeInput' });
    next(); // Continue even if sanitization fails
  }
};

export const schemas = {
  notification: notificationSchemas,
  preferences: preferencesSchemas,
  common: commonSchemas,
};

