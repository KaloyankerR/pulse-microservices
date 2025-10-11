# API Integration Fix Summary

## Issues Fixed

### 1. **Wrong API Gateway Port**
- **Problem**: The frontend was trying to connect to `http://localhost:8080`
- **Solution**: Updated to use `http://localhost:8000` (Kong Gateway port)
- **Files Updated**:
  - `libs/api-client.ts` - Changed default baseUrl
  - `libs/microserviceFetcher.ts` - Changed MICROSERVICE_BASE
  - `docker.env` - Added NEXT_PUBLIC_GATEWAY_URL
  - `test-microservices.js` - Updated test URLs
  - `test-frontend-integration.js` - Updated test URLs
  - `start-integrated-system.sh` - Updated port references

### 2. **Wrong API Endpoints**
- **Problem**: Frontend was using `/api/auth/login` instead of `/api/v1/auth/login`
- **Solution**: Updated all API paths to include `/v1/` prefix
- **Endpoints Updated**:
  - `/api/auth/login` → `/api/v1/auth/login`
  - `/api/auth/register` → `/api/v1/auth/register`
  - `/api/auth/me` → `/api/v1/auth/me`
  - `/api/auth/logout` → `/api/v1/auth/logout`
  - `/api/auth/change-password` → `/api/v1/auth/change-password`
  - `/api/users/*` → `/api/v1/users/*`

### 3. **Updated Response Structure**
- **Problem**: Frontend expected simple token response
- **Solution**: Updated to handle proper microservice response structure:
```typescript
{
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: any;
    expiresIn: string;
  };
}
```

## Architecture

```
┌─────────────────┐
│   Web Client    │
│  (Port 3000)    │
└────────┬────────┘
         │
         ↓ HTTP Requests to http://localhost:8000
┌─────────────────┐
│  Kong Gateway   │
│  (Port 8000)    │
└────────┬────────┘
         │
         ├─→ /api/v1/auth/* → User Service (Port 8081)
         ├─→ /api/v1/users/* → User Service (Port 8081)
         ├─→ /api/v1/posts/* → Post Service (Port 8082)
         ├─→ /api/v1/messages/* → Messaging Service (Port 8084)
         ├─→ /api/v1/social/* → Social Service (Port 8085)
         └─→ /api/notifications/* → Notification Service (Port 8086)
```

## Environment Variables

Make sure these are set in your `.env` or `docker.env`:

```bash
# Kong Gateway URL
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000

# Frontend URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Enable microservices integration
NEXT_PUBLIC_MICROSERVICES_ENABLED=true

# JWT Secret (must match backend services)
JWT_SECRET=5b41d6a0c1adfd2804d730d26f7a4fd1
```

## Testing Authentication

### 1. Start All Services

```bash
# From project root
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### 2. Test Kong Gateway

```bash
# Check Kong is running
curl http://localhost:8000

# Check Kong admin API
curl http://localhost:8001/services
```

### 3. Test User Service Through Kong

```bash
# Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Save the accessToken from the response and use it for authenticated requests

# Get current user (replace TOKEN with your actual token)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### 4. Test Frontend Login

1. Open http://localhost:3000
2. Try to login with:
   - Email: `test@example.com` or default admin account
   - Password: Your password or `admin123` for admin

## Default Admin Account

The user-service creates a default admin account:
- Email: `admin@pulse.com`
- Password: `admin123`

## Troubleshooting

### Connection Refused Error

If you see `ERR_CONNECTION_REFUSED`:
- Check Kong Gateway is running: `docker ps | grep kong`
- Check Kong is on port 8000: `curl http://localhost:8000`
- Check logs: `docker logs kong-gateway`

### 404 Not Found

If you get 404 errors:
- Verify you're using `/api/v1/auth/*` not `/api/auth/*`
- Check Kong routing: `curl http://localhost:8001/routes`

### 500 Internal Server Error

If you get 500 errors:
- Check user-service is running: `docker ps | grep user-service`
- Check database connection
- Check user-service logs: `docker logs pulse-user-service`

### CORS Issues

Kong is configured with CORS headers. If you still have CORS issues:
- Check web-client is running on port 3000
- Verify Kong CORS plugin is enabled: `curl http://localhost:8001/plugins`

## API Clients Usage

### Using api-client.ts

```typescript
import { apiClient } from '@/libs/api-client';

// Login
const response = await apiClient.login({
  usernameOrEmail: 'test@example.com',
  password: 'Test123!@#'
});

// Access token is automatically stored
console.log(response.data.accessToken);
```

### Using microserviceFetcher.ts

```typescript
import { authAPI } from '@/libs/microserviceFetcher';

// Login
const response = await authAPI.login({
  usernameOrEmail: 'test@example.com',
  password: 'Test123!@#'
});
```

## Next Steps

1. ✅ Frontend now correctly connects to backend via Kong Gateway
2. ✅ Authentication endpoints are properly configured
3. 🔄 Test the login flow from the web interface
4. 🔄 Verify token storage and authenticated requests
5. 🔄 Test other features (posts, messages, notifications)

## Service Ports Reference

| Service | Port | Gateway Route |
|---------|------|---------------|
| Web Client | 3000 | - |
| Kong Gateway | 8000 | - |
| Kong Admin | 8001 | - |
| User Service | 8081 | `/api/v1/auth/*`, `/api/v1/users/*` |
| Post Service | 8082 | `/api/v1/posts/*` |
| Messaging Service | 8084 | `/api/v1/messages/*` |
| Social Service | 8085 | `/api/v1/social/*` |
| Notification Service | 8086 | `/api/notifications/*` |

