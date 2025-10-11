export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8084',
  jwtSecret: process.env.JWT_SECRET || '5b41d6a0c1adfd2804d730d26f7a4fd1',
} as const;

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    me: '/api/v1/users/profile',
  },
  // User endpoints
  users: {
    profile: '/api/v1/users/profile',
    byId: (id: string) => `/api/v1/users/${id}`,
    search: '/api/v1/users/search',
    updateProfile: '/api/v1/users/profile',
  },
  // Post endpoints
  posts: {
    list: '/api/v1/posts',
    create: '/api/v1/posts',
    byId: (id: string) => `/api/v1/posts/${id}`,
    byAuthor: (authorId: string) => `/api/v1/posts/author/${authorId}`,
    like: (id: string) => `/api/v1/posts/${id}/like`,
  },
  // Social endpoints
  social: {
    follow: (userId: string) => `/api/v1/social/follow/${userId}`,
    followers: (userId: string) => `/api/v1/social/followers/${userId}`,
    following: (userId: string) => `/api/v1/social/following/${userId}`,
    stats: (userId: string) => `/api/v1/social/stats/${userId}`,
    status: (userId: string) => `/api/v1/social/status/${userId}`,
    recommendations: '/api/v1/social/recommendations',
  },
  // Messaging endpoints
  messages: {
    send: '/api/messages',
    conversations: '/api/messages/conversations',
    conversationById: (id: string) => `/api/messages/conversations/${id}`,
    conversationMessages: (id: string) => `/api/messages/conversations/${id}/messages`,
    markRead: (id: string) => `/api/messages/${id}/read`,
    createGroup: '/api/messages/group',
  },
  // Notification endpoints
  notifications: {
    list: '/api/notifications',
    unreadCount: '/api/notifications/unread-count',
    markRead: (id: string) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/mark-all-read',
    preferences: '/api/notifications/preferences',
  },
} as const;

