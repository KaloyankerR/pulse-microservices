import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';
import { AuthenticatedRequest } from '../types';

export const validate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : err.msg,
      message: err.msg,
    }));
    
    throw new AppError(
      `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }
  
  next();
};

