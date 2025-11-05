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
  // Convert code to string if it's not already
  const errorCode = error.code?.toString() || '';
  
  logger.error('Handling Prisma error:', {
    code: errorCode,
    message: error.message,
    meta: error.meta,
    name: error.name,
    clientVersion: error.clientVersion,
  });

  if (errorCode === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?.[0] || 'field';
    return new AppError(
      `A user with this ${field} already exists`,
      409,
      'DUPLICATE_ENTRY',
    );
  }

  if (errorCode === 'P2025') {
    // Record not found
    return new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (errorCode === 'P2003') {
    // Foreign key constraint violation
    return new AppError('Invalid reference', 400, 'INVALID_REFERENCE');
  }

  if (errorCode === 'P1001') {
    // Can't reach database server
    return new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
  }

  if (errorCode === 'P1002') {
    // Database connection timeout
    return new AppError('Database connection timeout', 503, 'DATABASE_TIMEOUT');
  }

  if (errorCode === 'P1008') {
    // Operations timed out
    return new AppError('Database operation timeout', 504, 'DATABASE_OPERATION_TIMEOUT');
  }

  if (errorCode === 'P1017') {
    // Server has closed the connection
    return new AppError('Database connection closed', 503, 'DATABASE_CONNECTION_ERROR');
  }

  // Generic Prisma error
  logger.error('Unhandled Prisma error:', {
    code: errorCode,
    message: error.message,
    meta: error.meta,
    name: error.name,
    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
  });
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let error: AppError;

  // If error is already an AppError, use it
  if (err instanceof AppError) {
    error = err;
  } else {
    // Create a temporary error object to check
    error = { ...err } as AppError;
    error.message = err.message;
    error.isOperational = false;
  }

  // Log the error with context
  logger.error('Error occurred:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    code: err.code,
    name: err.name,
  });

  // Handle Prisma errors first (they have code starting with 'P')
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    error = handlePrismaError(err);
  }
  // Handle database connection errors
  else if (err.message && (
    err.message.includes('connect') ||
    err.message.includes('connection') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ENOTFOUND') ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT'
  )) {
    error = new AppError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR');
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = err.name === 'TokenExpiredError'
      ? new AppError('Token expired', 401, 'TOKEN_EXPIRED')
      : new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  // Handle validation errors
  else if (err.name === 'ValidationError' || err.isJoi) {
    error = new AppError(
      err.details?.map((d: any) => d.message).join(', ') || err.message,
      400,
      'VALIDATION_ERROR',
    );
  }
  // Handle cast errors (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400, 'INVALID_ID');
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    error = new AppError('Invalid JSON format in request body', 400, 'INVALID_JSON');
  }
  // Handle axios errors (from service-to-service calls)
  else if (err.isAxiosError) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message || 'Service request failed';
    error = new AppError(message, status, err.response?.data?.error?.code || 'SERVICE_ERROR');
  }
  // Default error - only create new if not already AppError
  else if (!error.isOperational || !(error instanceof AppError)) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err.message || 'Internal server error');
    error = new AppError(message, 500, 'INTERNAL_ERROR');
  }

  // Ensure response is sent
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
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

