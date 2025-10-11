# Web Client Integration Guide

This document provides comprehensive information about integrating the Pulse Web Client with the microservices backend.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [API Integration](#api-integration)
5. [Authentication Flow](#authentication-flow)
6. [Service Endpoints](#service-endpoints)
7. [Development Workflow](#development-workflow)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

The Pulse Web Client is a Next.js-based frontend application that communicates with a microservices backend through Kong API Gateway. This architecture provides:

- **Scalability**: Each service can scale independently
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Services can be updated without affecting others
- **Performance**: Optimized routing through Kong Gateway

## Architecture

```
┌─────────────────┐
│   Web Client    │
│  (Port 3000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Kong Gateway   │
│  (Port 8000)    │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  User  │ │  Post  │ │ Social │ │Message │ │ Notif  │
│Service │ │Service │ │Service │ │Service │ │Service │
│  8081  │ │  8082  │ │  8085  │ │  8084  │ │  8086  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

## Setup & Configuration

### Prerequisites

- Node.js 20.x or higher
- Docker & Docker Compose
- Backend services running (or accessible)

### Environment Configuration

Create a `docker.env` file in the web-client directory:

```env
# API Gateway
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MICROSERVICES_ENABLED=true

# Security
JWT_SECRET=5b41d6a0c1adfd2804d730d26f7a4fd1

# NextAuth (Optional)
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EVENTS=true
```

### Installation

```bash
# Navigate to web-client directory
cd web-client

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or run with Docker
npm run docker:start
```

## API Integration

### Configuration File

The `config/microservices.config.ts` file centralizes all backend service configurations:

```typescript
export const MICROSERVICES_CONFIG = {
  GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: '/api/v1/auth',
    USERS: '/api/v1/users',
    POSTS: '/api/v1/posts',
    // ... more endpoints
  },
  TIMEOUT: {
    MICROSERVICE: 10000,
    NEXTJS: 5000,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 1000,
  },
};
```

### Making API Calls

Example using Axios with the configuration:

```typescript
import axios from 'axios';
import { MICROSERVICES_CONFIG } from '@/config/microservices.config';

// Create an axios instance
const apiClient = axios.create({
  baseURL: MICROSERVICES_CONFIG.GATEWAY_URL,
  timeout: MICROSERVICES_CONFIG.TIMEOUT.MICROSERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example: Fetch user profile
export const fetchUserProfile = async (userId: string) => {
  const response = await apiClient.get(
    `${MICROSERVICES_CONFIG.ENDPOINTS.USERS}/${userId}`
  );
  return response.data;
};

// Example: Create a post
export const createPost = async (content: string, media?: File[]) => {
  const formData = new FormData();
  formData.append('content', content);
  if (media) {
    media.forEach((file) => formData.append('media', file));
  }

  const response = await apiClient.post(
    MICROSERVICES_CONFIG.ENDPOINTS.POSTS,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};
```

## Authentication Flow

### 1. User Registration/Login

```typescript
// Login request
POST /api/v1/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### 2. Token Management

```typescript
// Store tokens
localStorage.setItem('accessToken', tokens.accessToken);
localStorage.setItem('refreshToken', tokens.refreshToken);

// Include in requests
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### 3. Token Refresh

```typescript
// Refresh token endpoint
POST /api/v1/auth/refresh
Body: {
  "refreshToken": "jwt_refresh_token"
}

// Implement auto-refresh in axios interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const response = await axios.post(
          `${GATEWAY_URL}/api/v1/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem('accessToken', response.data.accessToken);
        // Retry original request
        error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

## Service Endpoints

### User Service (Port 8081)

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/v1/auth/register`         | POST   | Register new user          |
| `/api/v1/auth/login`            | POST   | Login user                 |
| `/api/v1/auth/logout`           | POST   | Logout user                |
| `/api/v1/auth/refresh`          | POST   | Refresh access token       |
| `/api/v1/auth/google`           | GET    | Google OAuth login         |
| `/api/v1/users/profile`         | GET    | Get current user profile   |
| `/api/v1/users/:id`             | GET    | Get user by ID             |
| `/api/v1/users/:id`             | PUT    | Update user profile        |
| `/api/v1/users/search`          | GET    | Search users               |

### Post Service (Port 8082)

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/v1/posts`                 | GET    | Get all posts (feed)       |
| `/api/v1/posts`                 | POST   | Create new post            |
| `/api/v1/posts/:id`             | GET    | Get post by ID             |
| `/api/v1/posts/:id`             | PUT    | Update post                |
| `/api/v1/posts/:id`             | DELETE | Delete post                |
| `/api/v1/posts/:id/like`        | POST   | Like a post                |
| `/api/v1/posts/:id/unlike`      | DELETE | Unlike a post              |
| `/api/v1/posts/:id/comments`    | GET    | Get post comments          |
| `/api/v1/posts/:id/comments`    | POST   | Add comment to post        |

### Social Service (Port 8085)

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/v1/social/follow/:userId` | POST   | Follow a user              |
| `/api/v1/social/unfollow/:userId`| POST  | Unfollow a user            |
| `/api/v1/social/followers/:userId`| GET  | Get user's followers       |
| `/api/v1/social/following/:userId`| GET  | Get users being followed   |
| `/api/v1/social/suggestions`    | GET    | Get follow suggestions     |

### Messaging Service (Port 8084)

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/v1/conversations`         | GET    | Get all conversations      |
| `/api/v1/conversations`         | POST   | Create conversation        |
| `/api/v1/conversations/:id`     | GET    | Get conversation details   |
| `/api/v1/conversations/:id/messages` | GET | Get messages         |
| `/api/v1/messages`              | POST   | Send message               |
| `/api/v1/messages/:id`          | PUT    | Update message             |
| `/api/v1/messages/:id`          | DELETE | Delete message             |

### Notification Service (Port 8086)

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/v1/notifications`         | GET    | Get all notifications      |
| `/api/v1/notifications/:id`     | GET    | Get notification by ID     |
| `/api/v1/notifications/:id/read`| PUT    | Mark notification as read  |
| `/api/v1/notifications/read-all`| PUT    | Mark all as read           |

## Development Workflow

### Local Development

1. **Start Backend Services**
   ```bash
   # From project root
   docker-compose up kong user-service post-service social-service messaging-service notification-service
   ```

2. **Start Web Client**
   ```bash
   cd web-client
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Kong Gateway: http://localhost:8000
   - Kong Admin: http://localhost:8001

### Full Stack Development

```bash
# From project root - starts everything
docker-compose up -d

# View logs for specific service
docker-compose logs -f web-client

# Restart a service
docker-compose restart web-client

# Stop everything
docker-compose down
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run all checks
npm run check-all
```

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

### Docker Deployment

```bash
# Build production image
docker build -t pulse-web-client:latest .

# Run production container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_GATEWAY_URL=https://api.pulse.com \
  -e JWT_SECRET=your-production-secret \
  pulse-web-client:latest
```

### Environment-Specific Configuration

**Development** (`docker.env`):
```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000
```

**Staging** (`.env.staging`):
```env
NEXT_PUBLIC_GATEWAY_URL=https://staging-api.pulse.com
```

**Production** (`.env.production`):
```env
NEXT_PUBLIC_GATEWAY_URL=https://api.pulse.com
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: Browser blocks requests due to CORS policy

**Solution**: Ensure Kong Gateway is configured with proper CORS headers:
```yaml
# config/kong.yml
plugins:
  - name: cors
    config:
      origins:
        - http://localhost:3000
        - https://pulse.com
      credentials: true
```

#### 2. 401 Unauthorized

**Problem**: API returns 401 even with valid token

**Solutions**:
- Check JWT_SECRET matches between frontend and backend
- Verify token is being sent in Authorization header
- Check token expiration
- Ensure token format is `Bearer ${token}`

#### 3. Connection Refused

**Problem**: Cannot connect to backend services

**Solutions**:
- Verify all services are running: `docker-compose ps`
- Check Kong Gateway is healthy: `curl http://localhost:8000`
- Verify network connectivity: `docker network inspect pulse-network`
- Check service logs: `docker-compose logs [service-name]`

#### 4. Environment Variables Not Loading

**Problem**: Configuration values are undefined

**Solutions**:
- Ensure `docker.env` file exists
- Check variable names start with `NEXT_PUBLIC_` for client-side access
- Restart Next.js dev server after changing env vars
- Verify env file is mounted in docker-compose.yml

### Debugging Tips

1. **Enable verbose logging**:
   ```typescript
   // In microservices.config.ts
   export const DEBUG = process.env.NODE_ENV === 'development';
   
   // In API client
   if (DEBUG) {
     console.log('Request:', config);
     console.log('Response:', response);
   }
   ```

2. **Check Kong Gateway routes**:
   ```bash
   curl http://localhost:8001/routes
   ```

3. **Test backend directly** (bypassing Kong):
   ```bash
   # Test user service directly
   curl http://localhost:8081/health
   ```

4. **Inspect Docker networks**:
   ```bash
   docker network inspect pulse-network
   ```

### Getting Help

- Check service logs: `docker-compose logs -f [service-name]`
- Review Kong Gateway configuration: `config/kong.yml`
- Consult backend service documentation in their respective directories
- Check the main project README: `/README.md`

## Best Practices

1. **Error Handling**: Always implement proper error handling for API calls
2. **Loading States**: Show loading indicators during API requests
3. **Token Security**: Never expose tokens in console logs or URLs
4. **Type Safety**: Use TypeScript interfaces for API responses
5. **Caching**: Implement SWR for data fetching with automatic revalidation
6. **Optimistic Updates**: Update UI optimistically for better UX
7. **Error Boundaries**: Use React error boundaries for graceful error handling

## Next Steps

1. Implement authentication hooks using the API endpoints
2. Create service-specific API client modules
3. Set up proper error handling and retry logic
4. Implement real-time features using WebSockets
5. Add comprehensive testing for API integrations
6. Set up monitoring and logging for production

---

For more information, see:
- [Main README](README.md)
- [Microservices Configuration](config/microservices.config.ts)
- [Backend Services Documentation](../docs/)

