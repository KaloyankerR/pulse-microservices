/**
 * API request/response type definitions
 */

import { Request } from 'express';
import { NotificationType, NotificationPriority, ReferenceType } from './models';

// JWT Claims (from user-service)
export interface JWTClaims {
  id: string;
  userId: string;
  email: string;
  username: string;
  role: string;
  iss: string;
  sub: string;
  iat: number;
  exp: number;
}

// Extended Express Request with user
export interface AuthenticatedRequest extends Request {
  user?: JWTClaims | null;
  requestId?: string;
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    debug: (message: string, meta?: Record<string, unknown>) => void;
  };
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>;
    stack?: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

// Notification Creation Request
export interface CreateNotificationRequest {
  recipient_id?: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: ReferenceType;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

// Get Notifications Query Parameters
export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  type?: NotificationType;
  unread_only?: boolean;
  sort?: 'asc' | 'desc';
}

// Notification Options for service methods
export interface NotificationOptions {
  page?: number;
  limit?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
  sort?: -1 | 1;
}

// Notification Response with Pagination
export interface NotificationListResponse {
  notifications: Array<NotificationWithSender>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Notification with sender information (enriched)
export interface NotificationWithSender {
  _id: string;
  recipient_id: string;
  sender_id?: string;
  sender?: {
    user_id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    verified: boolean;
  } | null;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: ReferenceType;
  is_read: boolean;
  read_at?: Date | null;
  priority: NotificationPriority;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Notification Statistics
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  typeBreakdown: Record<string, {
    unread: number;
    read: number;
  }>;
}

// Notification Preferences Update Request
export interface UpdatePreferencesRequest {
  email_notifications?: boolean;
  push_notifications?: boolean;
  in_app_notifications?: boolean;
  quiet_hours?: {
    enabled?: boolean;
    start_time?: string;
    end_time?: string;
    timezone?: string;
  };
  preferences?: Record<string, {
    email?: boolean;
    push?: boolean;
    in_app?: boolean;
  }>;
}

// Cleanup Query Parameters
export interface CleanupQuery {
  days_old?: number;
}

