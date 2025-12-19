// Runtime config - can be set via window.__APP_CONFIG__ (injected at runtime)
// or fallback to build-time env vars or defaults
// This function is called each time config is needed, ensuring runtime values are always read

type Config = {
  apiUrl: string;
  wsUrl: string;
  jwtSecret: string;
};

let cachedConfig: Config | null = null;
let serverSideCache: Config | null = null;

export const getConfig = (): Config => {
  // On client-side, ALWAYS check window.__APP_CONFIG__ first
  // This can be injected by:
  // 1. Script tag in layout.tsx (might have wrong values due to static rendering)
  // 2. ConfigInjector component fetching from /api/config (most reliable)
  if (typeof window !== 'undefined') {
    const runtimeConfig = (window as any).__APP_CONFIG__;
    
    // If runtime config exists and has required properties, use it
    if (runtimeConfig && runtimeConfig.apiUrl && runtimeConfig.wsUrl) {
      // Always use runtime config on client-side, but log if it's localhost (might be wrong)
      if (runtimeConfig.apiUrl === 'http://localhost:8000') {
        console.warn('[Config] Warning: Using localhost:8000. ConfigInjector should override this.');
      }
      cachedConfig = runtimeConfig as Config;
      return cachedConfig;
    }
    
    // If we're on client but config isn't available, check if script executed
    // Log detailed info for debugging
    console.warn('[Config] Runtime config check:', {
      hasWindow: typeof window !== 'undefined',
      hasConfig: !!runtimeConfig,
      configValue: runtimeConfig,
      scriptExists: !!document.getElementById('__APP_CONFIG__'),
    });
    
    // If runtime config isn't available yet but we have a cached value, clear it
    // to force re-check on next call
    if (!runtimeConfig && cachedConfig) {
      console.warn('[Config] Runtime config not available, clearing cache to force re-check');
      cachedConfig = null;
    }
  }

  // On server-side only: use environment variables or cached server-side config
  // Prioritize API_URL/WS_URL (runtime) over NEXT_PUBLIC_* (build-time)
  if (typeof window === 'undefined') {
    if (!serverSideCache) {
      serverSideCache = {
        apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://134.209.86.116:30080',
        wsUrl: process.env.WS_URL || process.env.NEXT_PUBLIC_WS_URL || 'ws://134.209.86.116:30084',
        jwtSecret: process.env.JWT_SECRET || '5b41d6a0c1adfd2804d730d26f7a4fd1',
      };
    }
    return serverSideCache;
  }
  
  // Client-side fallback (should rarely happen if script tag works)
  const defaultConfig: Config = {
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://134.209.86.116:30080',
    wsUrl: process.env.WS_URL || process.env.NEXT_PUBLIC_WS_URL || 'ws://134.209.86.116:30084',
    jwtSecret: process.env.JWT_SECRET || '5b41d6a0c1adfd2804d730d26f7a4fd1',
  };
  
  return defaultConfig;
};

// Export config as a getter object for backwards compatibility
// Each property access triggers getConfig() to ensure fresh values
export const config = new Proxy({} as Config, {
  get(target, prop: keyof Config) {
    return getConfig()[prop];
  }
});

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    me: '/api/v1/auth/me',
  },
  // User endpoints
  users: {
    profile: '/api/v1/users/profile',
    byId: (id: string) => `/api/v1/users/${id}`,
    search: '/api/v1/users/search',
    updateProfile: '/api/v1/users/profile',
    updateProfileById: (id: string) => `/api/v1/users/${id}`,
    deleteUser: (id: string) => `/api/v1/users/${id}`,
    banUser: (id: string) => `/api/v1/users/${id}/ban`,
    unbanUser: (id: string) => `/api/v1/users/${id}/unban`,
    getAllUsers: '/api/v1/users/all',
  },
  // Post endpoints
  posts: {
    list: '/api/v1/posts',
    create: '/api/v1/posts',
    byId: (id: string) => `/api/v1/posts/${id}`,
    byAuthor: (authorId: string) => `/api/v1/posts/author/${authorId}`,
    like: (id: string) => `/api/v1/posts/${id}/like`,
    comments: (postId: string) => `/api/v1/posts/${postId}/comments`,
    deleteComment: (postId: string, commentId: string) => `/api/v1/posts/${postId}/comments/${commentId}`,
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
    createConversation: '/api/messages/conversations',
    createGroup: '/api/messages/group',
  },
  // Notification endpoints
  notifications: {
    list: '/api/notifications',
    unreadCount: '/api/notifications/unread-count',
    markRead: (id: string) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
    delete: (id: string) => `/api/notifications/${id}`,
    deleteAll: '/api/notifications/all',
    preferences: '/api/notifications/preferences',
  },
  // Event endpoints
  events: {
    list: '/api/events',
    create: '/api/events',
    byId: (id: string) => `/api/events/${id}`,
    update: (id: string) => `/api/events/${id}`,
    delete: (id: string) => `/api/events/${id}`,
    rsvp: (id: string) => `/api/events/${id}/rsvp`,
    attendees: (id: string) => `/api/events/${id}/attendees`,
  },
} as const;

