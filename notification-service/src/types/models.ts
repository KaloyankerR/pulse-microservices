/**
 * Model type definitions for Mongoose schemas
 */

import { Document, Types } from 'mongoose';

// Notification Types
export type NotificationType =
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'EVENT_INVITE'
  | 'EVENT_RSVP'
  | 'POST_MENTION'
  | 'SYSTEM'
  | 'MESSAGE'
  | 'POST_SHARE'
  | 'EVENT_REMINDER'
  | 'FRIEND_REQUEST'
  | 'ACCOUNT_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'SECURITY_ALERT';

export type ReferenceType = 'POST' | 'EVENT' | 'USER' | 'MESSAGE' | 'COMMENT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Notification Document Interface
export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient_id: string;
  sender_id?: string;
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

  // Virtuals
  formatted_created_at: string;
  formatted_read_at: string | null;

  // Instance methods
  markAsRead(): Promise<INotification>;
  markAsUnread(): Promise<INotification>;
  toSafeObject(): Record<string, unknown>;
}

// Notification Preferences
export interface NotificationPreferenceChannels {
  email: boolean;
  push: boolean;
  in_app: boolean;
}

export interface NotificationTypePreferences {
  [key: string]: NotificationPreferenceChannels;
}

export interface QuietHours {
  enabled: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface INotificationPreferences extends Document {
  _id: Types.ObjectId;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  preferences: NotificationTypePreferences;
  quiet_hours: QuietHours;
  created_at: Date;
  updated_at: Date;

  // Instance methods
  getPreferenceForType(notificationType: string, channel: string): boolean;
  setPreferenceForType(notificationType: string, channel: string, enabled: boolean): void;
  isQuietHours(): boolean;
  shouldSendNotification(notificationType: string, channel: string): boolean;
}

// User Cache
export interface IUserCache extends Document {
  _id: Types.ObjectId;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified: boolean;
  last_synced: Date;
  created_at: Date;
  updated_at: Date;

  // Instance methods
  updateFromUserData(userData: Partial<IUserCache>): void;
  toSafeObject(): Record<string, unknown>;
}

// Type-safe user data for cache operations
export interface UserCacheData {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
}

