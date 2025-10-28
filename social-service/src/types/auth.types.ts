import { Request } from 'express';

export interface JwtPayload {
  id?: string;
  userId?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

