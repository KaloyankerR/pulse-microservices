import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;

  code: string;

  isOperational: boolean;

  constructor(message: string, statusCode: number, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handlePrismaError = (error: any): AppError => {
  if (error.code === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?.[0] || 'field';
    return new AppError(
      `A user with this ${field} already exists`,
      409,
      'DUPLICATE_ENTRY',
    );
  }

  if (error.code === 'P2025') {
    // Record not found
    return new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (error.code === 'P2003') {
    // Foreign key constraint violation
    return new AppError('Invalid reference', 400, 'INVALID_REFERENCE');
  }

  // Generic Prisma error
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let error: AppError = { ...err };
  error.message = err.message;

  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    error = handlePrismaError(err);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400, 'VALIDATION_ERROR');
  }

  // Handle cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400, 'INVALID_ID');
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    error = new AppError('Invalid JSON format in request body', 400, 'INVALID_JSON');
  }

  // Default error
  if (!error.isOperational) {
    error = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

