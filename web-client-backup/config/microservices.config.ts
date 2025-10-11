// Microservices integration configuration
export const MICROSERVICES_CONFIG = {
  // API Gateway URL (Kong Gateway)
  GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000',
  
  // Next.js API URL (for local development)
  NEXTJS_API_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  
  // Feature flags
  MICROSERVICES_ENABLED: process.env.NEXT_PUBLIC_MICROSERVICES_ENABLED === 'true' || true,
  
  // JWT Configuration (must match backend services)
  JWT_SECRET: process.env.JWT_SECRET || '5b41d6a0c1adfd2804d730d26f7a4fd1',
  
  // Service endpoints (through Kong Gateway)
  ENDPOINTS: {
    // User Service (Node.js - Port 8081)
    AUTH: '/api/v1/auth',
    USERS: '/api/v1/users',
    PROFILE: '/api/v1/users/profile',
    
    // Post Service (Go - Port 8082)
    POSTS: '/api/v1/posts',
    LIKES: '/api/v1/posts',
    COMMENTS: '/api/v1/posts',
    
    // Social Service (Node.js - Port 8085)
    FOLLOW: '/api/v1/social/follow',
    FOLLOWERS: '/api/v1/social/followers',
    FOLLOWING: '/api/v1/social/following',
    
    // Messaging Service (Go - Port 8084)
    MESSAGES: '/api/v1/messages',
    CONVERSATIONS: '/api/v1/conversations',
    CHATS: '/api/v1/conversations',
    
    // Notification Service (Node.js - Port 8086)
    NOTIFICATIONS: '/api/v1/notifications',
    
    // Local Next.js API routes (for features not yet migrated)
    EVENTS: '/api/events',
  },
  
  // Service ports (for reference)
  PORTS: {
    KONG_GATEWAY: 8000,
    KONG_ADMIN: 8001,
    USER_SERVICE: 8081,
    POST_SERVICE: 8082,
    MESSAGING_SERVICE: 8084,
    SOCIAL_SERVICE: 8085,
    NOTIFICATION_SERVICE: 8086,
    WEB_CLIENT: 3000,
  },
  
  // Request timeout settings
  TIMEOUT: {
    MICROSERVICE: 10000, // 10 seconds
    NEXTJS: 5000,        // 5 seconds
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 1000,
  },
};

export default MICROSERVICES_CONFIG;




