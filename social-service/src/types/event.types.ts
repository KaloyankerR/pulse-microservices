export interface BaseEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  service: string;
}

export interface UserFollowedEventData extends Record<string, unknown> {
  follower_id: string;
  following_id: string;
  follower_username: string;
  timestamp: string;
}

export interface UserBlockedEventData extends Record<string, unknown> {
  blockerId: string;
  blockedId: string;
  timestamp: string;
}

export interface UserDeletedEventData extends Record<string, unknown> {
  userId: string;
}

export interface UserSyncData {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
}

export interface UserCreatedEventData extends Record<string, unknown> {
  user: UserSyncData;
}

export interface UserUpdatedEventData extends Record<string, unknown> {
  user: UserSyncData;
}

export interface UserDeletedEvent extends BaseEvent {
  type: 'user.deleted';
  data: UserDeletedEventData;
}

export interface UserCreatedEvent extends BaseEvent {
  type: 'user.created';
  data: UserCreatedEventData;
}

export interface UserUpdatedEvent extends BaseEvent {
  type: 'user.updated';
  data: UserUpdatedEventData;
}

