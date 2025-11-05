// API Constants and Endpoints
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// API Endpoints
export const ENDPOINTS = {
  // Auth Service
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
    LOGOUT: '/api/v1/auth/logout',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
  },
  // User Service
  USER: {
    PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    GET_BY_ID: (id) => `/api/v1/users/${id}`,
    SEARCH: '/api/v1/users/search',
    FOLLOW: (id) => `/api/v1/users/${id}/follow`,
    UNFOLLOW: (id) => `/api/v1/users/${id}/follow`,
    FOLLOWERS: (id) => `/api/v1/users/${id}/followers`,
    FOLLOWING: (id) => `/api/v1/users/${id}/following`,
    FOLLOW_STATUS: (id) => `/api/v1/users/${id}/follow-status`,
  },
  // Post Service
  POST: {
    LIST: '/api/v1/posts',
    CREATE: '/api/v1/posts',
    GET_BY_ID: (id) => `/api/v1/posts/${id}`,
    BY_AUTHOR: (authorId) => `/api/v1/posts/author/${authorId}`,
    DELETE: (id) => `/api/v1/posts/${id}`,
    LIKE: (id) => `/api/v1/posts/${id}/like`,
    UNLIKE: (id) => `/api/v1/posts/${id}/like`,
    COMMENTS: (postId) => `/api/v1/posts/${postId}/comments`,
    CREATE_COMMENT: (postId) => `/api/v1/posts/${postId}/comments`,
  },
  // Messaging Service
  MESSAGING: {
    CONVERSATIONS: '/api/messages/conversations',
    CONVERSATION_BY_ID: (id) => `/api/messages/conversations/${id}`,
    MESSAGES: (conversationId) => `/api/messages/conversations/${conversationId}/messages`,
    SEND_MESSAGE: '/api/messages',
    MARK_READ: (messageId) => `/api/messages/${messageId}/read`,
    CREATE_GROUP: '/api/messages/group',
  },
  // Notification Service
  NOTIFICATION: {
    LIST: '/api/notifications',
    CREATE: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    STATS: '/api/notifications/stats',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (id) => `/api/notifications/${id}`,
    PREFERENCES: '/api/notifications/preferences',
    UPDATE_PREFERENCES: '/api/notifications/preferences',
  },
  // Social Service
  SOCIAL: {
    FOLLOW: (userId) => `/api/v1/social/follow/${userId}`,
    UNFOLLOW: (userId) => `/api/v1/social/follow/${userId}`,
    FOLLOWERS: (userId) => `/api/v1/social/followers/${userId}`,
    FOLLOWING: (userId) => `/api/v1/social/following/${userId}`,
    BLOCK: (userId) => `/api/v1/social/block/${userId}`,
    UNBLOCK: (userId) => `/api/v1/social/block/${userId}`,
    RECOMMENDATIONS: '/api/v1/social/recommendations',
    STATS: (userId) => `/api/v1/social/stats/${userId}`,
    STATUS: (userId) => `/api/v1/social/status/${userId}`,
  },
  // Event Service
  EVENT: {
    LIST: '/api/events',
    CREATE: '/api/events',
    GET_BY_ID: (id) => `/api/events/${id}`,
    UPDATE: (id) => `/api/events/${id}`,
    DELETE: (id) => `/api/events/${id}`,
    RSVP: (id) => `/api/events/${id}/rsvp`,
    ATTENDEES: (id) => `/api/events/${id}/attendees`,
  },
  // Health
  HEALTH: '/health',
};

// Test Credentials (for load testing - use test accounts)
export const TEST_CREDENTIALS = {
  email: __ENV.TEST_EMAIL || 'loadtest@pulse.com',
  password: __ENV.TEST_PASSWORD || 'LoadTest123!',
  username: __ENV.TEST_USERNAME || 'loadtester',
};

// Headers
export const HEADERS = {
  JSON: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};






