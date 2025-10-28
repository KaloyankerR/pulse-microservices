/**
 * Event type definitions for RabbitMQ messages from other microservices
 */

import { NotificationType, ReferenceType, NotificationPriority } from './models';

// User Service Events
export interface UserRegisteredEvent {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
}

export interface UserUpdatedEvent {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
}

export interface UserDeletedEvent {
  user_id: string;
}

// Post Service Events
export interface PostLikedEvent {
  post_id: string;
  author_id: string;
  user_id: string;
  user_username: string;
}

export interface PostCommentedEvent {
  post_id: string;
  author_id: string;
  comment_id: string;
  user_id: string;
  user_username: string;
}

export interface PostSharedEvent {
  post_id: string;
  author_id: string;
  user_id: string;
  user_username: string;
}

export interface PostMentionedEvent {
  post_id: string;
  user_id: string;
  user_username: string;
  mentioned_users: Array<{
    user_id: string;
    username?: string;
  }>;
}

// Event Service Events
export interface EventCreatedEvent {
  event_id: string;
  creator_id: string;
  event_title: string;
}

export interface EventRsvpAddedEvent {
  event_id: string;
  creator_id: string;
  event_title: string;
  user_id: string;
  user_username: string;
  status: string;
}

export interface EventRsvpRemovedEvent {
  event_id: string;
  creator_id: string;
  user_id: string;
}

export interface EventUpdatedEvent {
  event_id: string;
  creator_id: string;
  event_title: string;
}

export interface EventCancelledEvent {
  event_id: string;
  creator_id: string;
  event_title: string;
}

// Social Service Events (wrapped in { type, data, timestamp, service } structure)
export interface UserFollowedEvent {
  follower_id: string;
  following_id: string;
  follower_username: string;
  timestamp?: string;
}

export interface UserUnfollowedEvent {
  follower_id: string;
  following_id: string;
}

export interface UserBlockedEvent {
  blocker_id: string;
  blocked_user_id: string;
  reason?: string;
}

// Messaging Service Events (wrapped in { type, timestamp, data } structure)
export interface MessageSentEvent {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_username?: string;
  recipient_id: string;
  content?: string;
  created_at?: string;
  participants?: string[];
}

export interface MessageReadEvent {
  message_id: string;
  user_id: string;
  read_at?: string;
}

export interface UserOnlineEvent {
  user_id: string;
  status: string;
  timestamp?: string;
}

export interface UserOfflineEvent {
  user_id: string;
  status: string;
  timestamp?: string;
}

// Generic event wrapper (for events that come wrapped)
export interface WrappedEvent<T = Record<string, unknown>> {
  type: string;
  data?: T;
  timestamp?: string;
  service?: string;
}

// Notification Event (published by this service)
export interface NotificationCreatedEvent {
  _id: string;
  recipient_id: string;
  sender_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: ReferenceType;
  is_read: boolean;
  priority: NotificationPriority;
  created_at: string;
  metadata?: Record<string, unknown>;
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string;
  } | null;
}

// Event processing payload
export interface EventProcessingPayload {
  event_type: string;
  data: Record<string, unknown>;
}

// Helper type to extract data from wrapped events
export type ExtractEventData<T> = T extends WrappedEvent<infer D> ? D : T;

