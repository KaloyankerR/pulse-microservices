// User types
export interface User {
  id: string;
  email?: string;
  username: string;
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

// Post types
export interface Post {
  id: string;
  author_id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  author?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface CreatePostRequest {
  content: string;
}

// Comment types
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface CreateCommentRequest {
  content: string;
}

// Social types
export interface FollowStats {
  followers_count: number;
  following_count: number;
}

export interface FollowStatus {
  is_following: boolean;
  is_followed_by: boolean;
}

export interface UserWithSocial extends User {
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  createdAt: string;
  read_at?: string;
  sender?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  participants: string[];
  participant_details?: User[];
  last_message?: {
    content: string;
    timestamp: string;
    sender_id: string;
  };
  createdAt: string;
  updatedAt: string;
  name?: string;
}

export interface CreateMessageRequest {
  conversation_id?: string;
  recipient_id?: string;
  content: string;
}

// Notification types
export type NotificationType =
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'MESSAGE'
  | 'SYSTEM'
  | 'POST_MENTION'
  | 'POST_SHARE';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  follow_notifications: boolean;
  like_notifications: boolean;
  comment_notifications: boolean;
  message_notifications: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

