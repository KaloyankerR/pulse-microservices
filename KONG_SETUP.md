# Kong API Gateway Setup for Pulse Microservices

This guide explains how to set up Kong API Gateway as the entry point for your Pulse microservices architecture.

## Architecture Overview

```
Frontend (Next.js) → Kong Gateway (Port 8000) → Microservices
                                    ├── User Service (Node.js) - Port 8080
                                    ├── Auth Service (Java) - Port 8080  
                                    └── Tweet Service (Java) - Port 8081
```

## Quick Start

### 1. Start the Services

First, create the external network:
```bash
docker network create pulse-network
```

Start the main services (including Kong):
```bash
cd /Users/kalo/pulse-microservices
docker-compose up -d
```

Start the user service:
```bash
cd user-service
docker-compose up -d
```

### 2. Verify Kong is Running

Check Kong health:
```bash
curl -i http://localhost:8001/status
```

Check Kong configuration:
```bash
curl -i http://localhost:8001/config
```

### 3. Access Points

- **Kong Proxy**: http://localhost:8000 (Main entry point)
- **Kong Admin API**: http://localhost:8001 (Management)

## Service Endpoints Through Kong

### User Service (Node.js)
- **Auth Routes**: `http://localhost:8000/api/v1/auth/*`
- **User Routes**: `http://localhost:8000/api/v1/users/*`
- **Admin Routes**: `http://localhost:8000/api/v1/admin/*`
- **Health Check**: `http://localhost:8000/health`

### Auth Service (Java)
- **Auth Routes**: `http://localhost:8000/api/auth/*`

### Tweet Service (Java)
- **Tweet Routes**: `http://localhost:8000/api/tweets/*`

## Test Commands

### 1. Test Kong Health
```bash
curl -i http://localhost:8001/status
```

### 2. Test User Service Health (through Kong)
```bash
curl -i http://localhost:8000/health
```

### 3. Test User Service Auth (through Kong)
```bash
# Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Test Auth Service (through Kong)
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 5. Test Tweet Service (through Kong)
```bash
# Create a tweet (requires JWT token)
curl -X POST http://localhost:8000/api/tweets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hello from Kong Gateway!"
  }'

# Get tweets
curl -X GET http://localhost:8000/api/tweets
```

### 6. Test CORS
```bash
curl -X OPTIONS http://localhost:8000/api/v1/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

### 7. Test Rate Limiting
```bash
# Make multiple requests quickly to test rate limiting
for i in {1..10}; do
  curl -i http://localhost:8000/health
  echo "Request $i"
done
```

## Kong Configuration Details

### Plugins Enabled

1. **CORS Plugin**: Handles cross-origin requests
   - Origins: `http://localhost:3000`, `http://localhost:3001`
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Credentials: Enabled

2. **Rate Limiting Plugin**: Prevents abuse
   - 100 requests per minute
   - 1000 requests per hour
   - Policy: local (in-memory)

3. **Request Size Limiting**: Prevents large payloads
   - Max size: 10MB

4. **JWT Plugin**: Authentication for tweet service
   - Algorithm: HS256
   - Secret: `mySecretKey123456789012345678901234567890`

5. **Prometheus Plugin**: Metrics collection
   - Per-consumer metrics
   - Status code metrics
   - Latency metrics

6. **Correlation ID Plugin**: Request tracing
   - Header: `Kong-Request-ID`
   - Generator: UUID

### JWT Consumer Setup

A consumer named `pulse-frontend` is configured with:
- Username: `pulse-frontend`
- Custom ID: `frontend-app`
- JWT Secret: `pulse-jwt-key`
- Algorithm: `HS256`

## Troubleshooting

### 1. Kong Not Starting
```bash
# Check Kong logs
docker logs kong-gateway

# Check if kong.yml is valid
docker exec kong-gateway kong config db_import /kong/kong.yml
```

### 2. Services Not Reachable
```bash
# Check if services are running
docker ps

# Check network connectivity
docker exec kong-gateway ping auth-service
docker exec kong-gateway ping tweet-service
docker exec kong-gateway ping pulse-user-service
```

### 3. CORS Issues
- Verify the `CORS_ORIGIN` environment variable in your frontend
- Check that your frontend domain is listed in the Kong CORS configuration

### 4. JWT Authentication Issues
- Ensure the JWT secret matches between Kong and your services
- Verify the JWT token format and claims

## Monitoring

### Kong Metrics
Access Prometheus metrics at:
```bash
curl http://localhost:8001/metrics
```

### Kong Admin API
Access the management API at: http://localhost:8001

### Health Checks
- Kong: `http://localhost:8001/status`
- User Service: `http://localhost:8000/health`

## Production Considerations

1. **Security**:
   - Change default JWT secrets
   - Use HTTPS in production
   - Configure proper CORS origins
   - Enable Kong's security plugins

2. **Performance**:
   - Use Redis for rate limiting in production
   - Configure proper upstream health checks
   - Set up load balancing for multiple service instances

3. **Monitoring**:
   - Set up proper logging aggregation
   - Configure alerting for service health
   - Monitor Kong metrics and performance

4. **Scaling**:
   - Use Kong's database mode for multi-instance deployments
   - Configure proper load balancing
   - Set up service discovery

## Next Steps

1. **Frontend Integration**: Update your Next.js app to use `http://localhost:8000` as the API base URL
2. **Service Discovery**: Consider implementing service discovery for dynamic service registration
3. **API Versioning**: Implement proper API versioning strategy
4. **Documentation**: Set up API documentation aggregation through Kong
5. **Testing**: Create comprehensive integration tests for the gateway setup
