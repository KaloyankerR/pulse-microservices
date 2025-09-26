# Kong Gateway + User Service Setup

This guide explains how to run Kong API Gateway with the user-service Node.js application, with other services disabled for focused testing and development.

## Architecture

```
Frontend → Kong Gateway (Port 8000) → User Service (Port 8080)
                                    ├── PostgreSQL Database
                                    └── Redis Cache
```

## Quick Start

### 1. Start the Services

```bash
# Make scripts executable (if not already done)
chmod +x start-kong-user-service.sh
chmod +x test-kong-user-service.sh

# Start all services
./start-kong-user-service.sh
```

### 2. Test the Integration

```bash
# Run comprehensive tests
./test-kong-user-service.sh
```

## Manual Setup

If you prefer to start services manually:

### 1. Create Network

```bash
docker network create pulse-network
```

### 2. Start Services

```bash
# Start all services
docker-compose up --build -d

# Check status
docker-compose ps
```

### 3. Verify Services

```bash
# Check Kong health
curl http://localhost:8001/status

# Check User Service health through Kong
curl http://localhost:8000/health
```

## Service Configuration

### Kong Gateway
- **Proxy Port**: 8000 (main entry point)
- **Admin Port**: 8001 (management API)
- **Configuration**: `kong.yml` (declarative config)
- **Database**: Off (stateless mode)

### User Service
- **Port**: 8080
- **Database**: PostgreSQL (port 5432)
- **Cache**: Redis (port 6379)
- **Environment**: Development mode with hot reload

### Database
- **PostgreSQL**: `pulse_users` database
- **Redis**: Session storage and caching

## API Endpoints

All endpoints are accessible through Kong Gateway at `http://localhost:8000`:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/google` - Google OAuth login
- `GET /api/v1/auth/google/callback` - Google OAuth callback

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users` - List users (admin)

### Admin
- `GET /api/v1/admin/users` - Admin user management
- `GET /api/v1/admin/stats` - System statistics

### Health
- `GET /health` - Service health check

## Kong Features Enabled

### 1. CORS Plugin
- **Origins**: `http://localhost:3000`, `http://localhost:3001`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Enabled
- **Headers**: Authorization, Content-Type, etc.

### 2. Rate Limiting
- **Per Minute**: 100 requests
- **Per Hour**: 1000 requests
- **Policy**: Local (in-memory)

### 3. Request Size Limiting
- **Max Size**: 10MB

### 4. Prometheus Metrics
- **Endpoint**: `http://localhost:8001/metrics`
- **Features**: Per-consumer metrics, latency tracking

### 5. Correlation ID
- **Header**: `Kong-Request-ID`
- **Format**: UUID

## Testing

### Basic Health Check
```bash
curl http://localhost:8000/health
```

### User Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### User Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### CORS Test
```bash
curl -X OPTIONS http://localhost:8000/api/v1/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## Google OAuth Configuration

The user-service is configured with Google OAuth2:

- **Client ID**: `324113479892-7cq7ntoptj8cfn5u65ahssm5af55hdmd`
- **Redirect URI**: `http://localhost:8080/api/v1/auth/google/callback`
- **Scope**: profile, email

**Important**: You need to add the redirect URI to your Google Cloud Console OAuth2 client configuration.

## Environment Variables

### User Service
```bash
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://pulse_user:pulse_password@postgres-users:5432/pulse_users
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
GOOGLE_CLIENT_ID=324113479892-7cq7ntoptj8cfn5u65ahssm5af55hdmd
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/v1/auth/google/callback
REDIS_URL=redis://redis:6379
```

## Monitoring

### Kong Admin API
- **URL**: http://localhost:8001
- **Endpoints**:
  - `/status` - Kong health
  - `/config` - Configuration
  - `/services` - Service list
  - `/routes` - Route list
  - `/metrics` - Prometheus metrics

### Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
docker-compose logs -f kong
```

## Troubleshooting

### 1. Services Not Starting
```bash
# Check Docker status
docker info

# Check network
docker network ls | grep pulse-network

# Check logs
docker-compose logs
```

### 2. Kong Configuration Issues
```bash
# Validate Kong config
docker exec kong-gateway kong config db_import /kong/kong.yml

# Check Kong status
curl http://localhost:8001/status
```

### 3. Database Connection Issues
```bash
# Check PostgreSQL
docker exec pulse-users-db pg_isready -U pulse_user -d pulse_users

# Check Redis
docker exec pulse-users-redis redis-cli ping
```

### 4. CORS Issues
- Verify `CORS_ORIGIN` environment variable
- Check Kong CORS plugin configuration
- Ensure frontend is using correct origin

### 5. Google OAuth Issues
- Verify redirect URI in Google Cloud Console
- Check `GOOGLE_CLIENT_SECRET` environment variable
- Ensure callback URL matches exactly

## Production Considerations

### Security
- Change default JWT secrets
- Use HTTPS in production
- Configure proper CORS origins
- Enable Kong security plugins

### Performance
- Use Redis for rate limiting in production
- Configure proper upstream health checks
- Set up load balancing for multiple instances

### Monitoring
- Set up proper logging aggregation
- Configure alerting for service health
- Monitor Kong metrics and performance

## Cleanup

To stop and remove all services:

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Remove network
docker network rm pulse-network
```

## Next Steps

1. **Frontend Integration**: Update your frontend to use `http://localhost:8000` as the API base URL
2. **Google OAuth**: Configure your Google Cloud Console with the correct redirect URI
3. **Environment Variables**: Set up proper environment variables for your use case
4. **Testing**: Run the test script to verify everything works
5. **Production Setup**: Follow production considerations for deployment
