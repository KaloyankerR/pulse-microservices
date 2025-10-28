
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  pagination: PaginationMeta;
  items: T[];
}

export interface FollowInfo {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  verified: boolean;
  followedAt: Date;
}

export interface FollowersResponse {
  followers: FollowInfo[];
  pagination: PaginationMeta;
}

export interface FollowingResponse {
  following: FollowInfo[];
  pagination: PaginationMeta;
}

export interface RecommendationUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  followers_count: number;
  following_count: number;
  mutualFollowersCount: number;
}

export interface RecommendationsResponse {
  recommendations: RecommendationUser[];
}

export interface SocialStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface FollowStatus {
  is_following: boolean;
  is_followed_by: boolean;
  is_blocked: boolean;
}

export interface FollowResult {
  message: string;
  isFollowing: boolean;
}

export interface BlockResult {
  message: string;
  isBlocked: boolean;
}

export interface SyncUsersResult {
  syncedCount: number;
  totalUsers: number;
  timestamp: string;
}

