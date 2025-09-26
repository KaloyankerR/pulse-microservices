# Pulse Microservices - Integrated Setup

This document describes how to run the complete Pulse microservices platform with both User Service and Post Service integrated using Docker Compose.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │   Post Service  │
│   (Node.js)     │    │   (Spring Boot) │
│   Port: 8080    │    │   Port: 8082    │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
    ┌────▼────┐              ┌───▼────┐
    │PostgreSQL│              │PostgreSQL│
    │pulse_users│              │pulse_posts│
    │Port: 5432│              │Port: 5433│
    └─────────┘              └─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                ┌────▼────┐
                │  Redis  │
                │Port:6379│
                └─────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 8080, 8082, 5432, 5433, 6379 available

### Start All Services

```bash
# Clone and navigate to the project
cd pulse-microservices

# Start all services with one command
./start-all-services.sh
```

This will:
- Create the Docker network
- Build and start all services
- Wait for all services to be healthy
- Display service URLs and management commands

### Verify Integration

```bash
# Run the integration test
./test-integration.sh
```

## 📋 Service Details

### User Service (Node.js)
- **Port**: 8080
- **Database**: PostgreSQL (pulse_users)
- **Features**: Authentication, user management, OAuth2
- **Health Check**: http://localhost:8080/health

### Post Service (Spring Boot)
- **Port**: 8082
- **Database**: PostgreSQL (pulse_posts_service_db)
- **Features**: Content management, posts, comments, likes
- **Health Check**: http://localhost:8082/actuator/health
- **API Docs**: http://localhost:8082/swagger-ui.html

### Shared Services
- **Redis**: Session storage and caching (Port: 6379)
- **Network**: pulse-network (Docker bridge network)

## 🔧 Management Commands

### View Service Status
```bash
cd user-service
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
docker-compose logs -f post-service
docker-compose logs -f post-service-db
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v
```

### Restart a Service
```bash
docker-compose restart post-service
```

## 🧪 Testing the Integration

### 1. Create a User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123",
    "displayName": "Test User"
  }'
```

### 2. Login and Get JWT Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### 3. Create a Post (using JWT from step 2)
```bash
curl -X POST http://localhost:8082/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from the integrated Pulse platform!",
    "imageUrls": ["https://example.com/image.jpg"]
  }'
```

### 4. Get Posts
```bash
curl -X GET http://localhost:8082/api/posts/author/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🔍 API Documentation

### User Service API
- **Base URL**: http://localhost:8080
- **Authentication**: JWT tokens
- **Endpoints**: `/api/v1/auth/*`, `/api/v1/users/*`

### Post Service API
- **Base URL**: http://localhost:8082
- **Swagger UI**: http://localhost:8082/swagger-ui.html
- **Authentication**: JWT tokens (validated against User Service)
- **Endpoints**: `/api/posts/*`

## 🗄️ Database Access

### User Service Database
```bash
# Connect to user service database
docker exec -it pulse-users-db psql -U pulse_user -d pulse_users
```

### Post Service Database
```bash
# Connect to post service database
docker exec -it pulse-posts-db psql -U pulse_user -d pulse_posts_service_db
```

### Redis
```bash
# Connect to Redis
docker exec -it pulse-users-redis redis-cli
```

## 🔧 Configuration

### Environment Variables

The services are configured via environment variables in `docker-compose.yml`:

#### User Service
- `JWT_SECRET`: Shared secret for JWT tokens
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

#### Post Service
- `JWT_SECRET`: Same as User Service (for token validation)
- `SPRING_DATASOURCE_URL`: PostgreSQL connection string
- `USER_SERVICE_BASE_URL`: URL to reach User Service

### Customizing Configuration

Edit the environment variables in `user-service/docker-compose.yml` to customize:
- Database credentials
- JWT secrets
- Service ports
- Content validation rules

## 🐛 Troubleshooting

### Services Won't Start
1. Check if ports are available: `lsof -i :8080,8082,5432,5433,6379`
2. Check Docker logs: `docker-compose logs [service-name]`
3. Verify Docker is running: `docker info`

### Database Connection Issues
1. Wait for databases to be ready: `docker-compose logs postgres`
2. Check database health: `docker exec pulse-users-db pg_isready`
3. Verify network connectivity: `docker network ls`

### JWT Token Issues
1. Ensure both services use the same `JWT_SECRET`
2. Check token expiration time
3. Verify User Service is accessible from Post Service

### Service Communication Issues
1. Check if services are on the same network: `docker network inspect pulse-network`
2. Verify service URLs in environment variables
3. Check firewall settings

## 📊 Monitoring

### Health Checks
- User Service: http://localhost:8080/health
- Post Service: http://localhost:8082/actuator/health
- Post Service Metrics: http://localhost:8082/actuator/metrics

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f user-service
docker-compose logs -f post-service
```

## 🔄 Development Workflow

### Making Changes
1. Edit source code in respective service directories
2. Restart the specific service: `docker-compose restart [service-name]`
3. Or rebuild: `docker-compose up --build [service-name]`

### Adding New Services
1. Add service definition to `docker-compose.yml`
2. Add to `pulse-network`
3. Update startup and test scripts

## 🚀 Production Considerations

### Security
- Change default passwords and secrets
- Use environment-specific configuration
- Enable HTTPS/TLS
- Configure proper firewall rules

### Performance
- Adjust database connection pools
- Configure Redis memory limits
- Set up monitoring and alerting
- Use external databases for production

### Scaling
- Use Docker Swarm or Kubernetes
- Implement load balancing
- Set up database replication
- Configure service discovery

---

**Built with ❤️ by the Pulse Team**

For more information, visit our [documentation](https://docs.pulse.com) or contact us at team@pulse.com.
