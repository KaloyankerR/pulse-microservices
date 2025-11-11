import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema, property: string = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property as keyof Request], { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      logger.warn('Validation error:', { errors, property });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  updateProfile: Joi.object({
    displayName: Joi.string().min(1).max(100).optional().messages({
      'string.min': 'Display name cannot be empty',
      'string.max': 'Display name cannot exceed 100 characters',
    }),
    bio: Joi.string().max(500).optional().messages({
      'string.max': 'Bio cannot exceed 500 characters',
    }),
    avatarUrl: Joi.string().uri().optional().messages({
      'string.uri': 'Avatar URL must be a valid URL',
    }),
  }),

  searchUsers: Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 100 characters',
      'any.required': 'Search query is required',
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  createProfile: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.uuid': 'ID must be a valid UUID',
      'any.required': 'ID is required',
    }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required',
      }),
    displayName: Joi.string().min(1).max(100).optional().messages({
      'string.min': 'Display name cannot be empty',
      'string.max': 'Display name cannot exceed 100 characters',
    }),
  }),
};








