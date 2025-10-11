# 🚀 Microservices Integration Guide

## Overview

This guide explains how to integrate your Next.js Pulse social platform with Spring Boot microservices through an API Gateway and Eureka service discovery.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   API Gateway   │    │  Eureka Server  │
│   Frontend      │◄──►│  (Port 8080)    │◄──►│  (Port 8761)    │
│   (Port 3000)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   User Service  │
                       │  (Port 8081)    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   (Port 5432)   │
                       └─────────────────┘
```

## Hybrid Authentication System

### Current Setup
- **Next.js APIs**: Posts, Events, Chat, Notifications (MongoDB)
- **Spring Boot APIs**: Authentication, User Management (PostgreSQL)
- **Routing**: API Gateway routes requests to appropriate services

### API Routes

#### Spring Boot Microservices (via Gateway)
```
http://localhost:8080/api/microservice/auth/*    → User Service Auth
http://localhost:8080/api/microservice/users/*   → User Service Management
```

#### Next.js APIs (via Gateway)
```
http://localhost:8080/api/posts/*         → Next.js Posts API
http://localhost:8080/api/events/*        → Next.js Events API
http://localhost:8080/api/chats/*         → Next.js Chat API
http://localhost:8080/api/notifications/* → Next.js Notifications API
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in your Next.js project:

```env
# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_JWT_SECRET=your-jwt-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (MongoDB for Next.js features)
DATABASE_URL=mongodb://localhost:27017/pulse

# Spring Boot Microservices Integration
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
NEXT_PUBLIC_MICROSERVICES_ENABLED=true

# JWT Configuration (must match Spring Boot)
JWT_SECRET=pulseSecretKey123456789012345678901234567890

# Development Settings
NODE_ENV=development
```

### 2. Start Services in Order

#### Terminal 1: Start Spring Boot Services
```bash
cd /Users/kalo/Projects/University/S6/pulse-microservices
./start-services.sh
```

Wait for all services to start (about 2-3 minutes):
- ✅ Eureka Server: http://localhost:8761
- ✅ User Service: http://localhost:8081  
- ✅ API Gateway: http://localhost:8080

#### Terminal 2: Start Next.js Frontend
```bash
cd /Users/kalo/Projects/University/S6/pulse
npm run dev
```

### 3. Verify Integration

1. **Check Eureka Dashboard**: http://localhost:8761
   - Should show `USER-SERVICE` and `GATEWAY-SERVICE` registered

2. **Test Gateway Routes**:
   ```bash
   # Test Spring Boot auth through gateway
   curl http://localhost:8080/api/microservice/auth/me
   
   # Test Next.js API through gateway  
   curl http://localhost:8080/api/posts
   
   # Test frontend through gateway
   curl http://localhost:8080/
   ```

3. **Test Authentication Flow**:
   - Open: http://localhost:8080 (or http://localhost:3000)
   - Click "Login" - should show "🚀 Using Microservices Authentication"
   - Register/Login should work through Spring Boot services

## Features

### ✅ Implemented
- **Hybrid Authentication**: Routes auth through Spring Boot, other APIs through Next.js
- **API Gateway**: Single entry point with intelligent routing
- **Service Discovery**: Eureka-based service registration
- **Enhanced Fetcher**: Handles both Next.js and microservice APIs
- **Visual Indicators**: Shows which auth system is active

### 🔄 In Progress  
- **JWT Token Management**: Automatic token refresh and validation
- **Error Handling**: Graceful fallbacks between systems
- **Load Balancing**: Multiple service instances

### 📋 Future Enhancements
- **Migrate Posts Service**: Move from Next.js to Spring Boot
- **Migrate Events Service**: Move from Next.js to Spring Boot  
- **Migrate Chat Service**: Move from Next.js to Spring Boot
- **Database Separation**: Split MongoDB and PostgreSQL concerns

## API Usage Examples

### Authentication (Spring Boot)

```typescript
import { authAPI } from '@/libs/microserviceFetcher';

// Login
const result = await authAPI.login({
  usernameOrEmail: 'john@example.com',
  password: 'password123'
});

// Register  
const user = await authAPI.register({
  username: 'johndoe',
  email: 'john@example.com', 
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
});

// Get current user
const currentUser = await authAPI.getCurrentUser();
```

### Posts/Events/Chat (Next.js)

```typescript
import { nextjsAPI } from '@/libs/microserviceFetcher';

// Get posts
const posts = await nextjsAPI.getPosts();

// Create post
const newPost = await nextjsAPI.createPost({
  content: 'Hello World!',
  userId: currentUser.id
});

// Get events
const events = await nextjsAPI.getEvents();
```

### Using the Hybrid Hook

```typescript
import { useHybridAuth } from '@/hooks/useHybridAuth';

function MyComponent() {
  const { 
    isAuthenticated, 
    currentUser, 
    authMethod,
    login, 
    logout,
    microservicesEnabled 
  } = useHybridAuth();
  
  return (
    <div>
      <p>Auth Method: {authMethod}</p>
      <p>Microservices: {microservicesEnabled ? 'Enabled' : 'Disabled'}</p>
      {isAuthenticated && <p>Welcome, {currentUser.username}!</p>}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Services not starting**:
   ```bash
   # Check if ports are available
   lsof -i :8080 :8081 :8761 :3000
   
   # Kill processes if needed
   pkill -f "spring-boot:run"
   ```

2. **CORS issues**:
   - Gateway is configured to allow all origins in development
   - Check browser console for CORS errors

3. **Authentication not working**:
   - Verify `NEXT_PUBLIC_MICROSERVICES_ENABLED=true` in .env.local
   - Check JWT secrets match between Next.js and Spring Boot
   - Inspect Network tab for failed requests

4. **Service discovery issues**:
   - Check Eureka dashboard: http://localhost:8761
   - Verify services are registered
   - Wait 30-60 seconds for registration to complete

### Debug Commands

```bash
# Check service health
curl http://localhost:8080/actuator/health  # Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8761/actuator/health  # Eureka

# Check gateway routes  
curl http://localhost:8080/actuator/gateway/routes

# Test authentication
curl -X POST http://localhost:8080/api/microservice/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"test","password":"test"}'
```

## Migration Strategy

### Phase 1: Hybrid (Current)
- ✅ Authentication via Spring Boot
- ✅ Posts/Events/Chat via Next.js  
- ✅ Single frontend entry point

### Phase 2: Gradual Migration
- Move Posts service to Spring Boot
- Move Events service to Spring Boot
- Move Chat service to Spring Boot
- Keep frontend as single entry point

### Phase 3: Full Microservices
- All APIs in Spring Boot
- Database per service
- Independent deployments
- Container orchestration

## Performance Considerations

- **Gateway Latency**: ~10-20ms additional latency
- **Service Discovery**: ~30-60s startup time
- **JWT Validation**: Cached for performance
- **Database Connections**: Pooled per service

## Security

- **JWT Tokens**: Secure, stateless authentication
- **CORS**: Configured for development, restrict in production
- **Rate Limiting**: Implemented in gateway
- **Input Validation**: Both frontend and backend validation

## Monitoring

- **Eureka Dashboard**: Service health and registration
- **Actuator Endpoints**: Health, metrics, info per service
- **Gateway Routes**: Real-time route configuration
- **Application Logs**: Structured logging per service

## Next Steps

1. **Test the integration** with the provided commands
2. **Customize the configuration** for your specific needs  
3. **Add more microservices** following the same pattern
4. **Implement monitoring** and logging solutions
5. **Prepare for production deployment** with Docker/Kubernetes

---

**Need Help?** 
- Check the troubleshooting section above
- Review service logs in the terminal
- Test individual components before integration
- Verify environment variables are set correctly




