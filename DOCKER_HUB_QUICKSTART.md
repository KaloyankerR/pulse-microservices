# Docker Hub Quick Start Guide

This guide helps you quickly deploy the Pulse microservices platform using pre-built Docker Hub images.

## Prerequisites

- Docker and Docker Compose installed
- Local PostgreSQL running (or update connection strings)
- Docker Hub account (to pull public images)

## Step 1: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.dockerhub.example .env

# Edit the file with your settings
nano .env
```

Minimum required settings:

```env
# JWT Secret (IMPORTANT: Change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Docker Hub Username (replace with your username)
DOCKERHUB_USERNAME=yourusername

# Database credentials (if not using defaults)
POSTGRES_USER=pulse_user
POSTGRES_PASSWORD=pulse_user
```

## Step 2: Update Docker Compose File

Edit `docker-compose.dockerhub.yml` and replace `yourusername` with your Docker Hub username:

```bash
# Quick find and replace (macOS/Linux)
sed -i 's/yourusername/YOUR_DOCKERHUB_USERNAME/g' docker-compose.dockerhub.yml

# Or manually edit the file
nano docker-compose.dockerhub.yml
```

## Step 3: Setup Databases

If using local PostgreSQL, create the required databases:

```bash
# Connect to PostgreSQL
psql -U postgres

# Run these SQL commands:
CREATE DATABASE pulse_users;
CREATE DATABASE pulse_posts;
CREATE DATABASE pulse_messaging;
CREATE DATABASE pulse_social;

CREATE USER pulse_user WITH PASSWORD 'pulse_user';

GRANT ALL PRIVILEGES ON DATABASE pulse_users TO pulse_user;
GRANT ALL PRIVILEGES ON DATABASE pulse_posts TO pulse_user;
GRANT ALL PRIVILEGES ON DATABASE pulse_messaging TO pulse_user;
GRANT ALL PRIVILEGES ON DATABASE pulse_social TO pulse_user;

# Exit psql
\q
```

## Step 4: Pull Docker Images

Pull all service images from Docker Hub:

```bash
docker-compose -f docker-compose.dockerhub.yml pull
```

This will download:
- `yourusername/pulse-user-service:latest`
- `yourusername/pulse-social-service:latest`
- `yourusername/pulse-messaging-service:latest`
- `yourusername/pulse-post-service:latest`
- `yourusername/pulse-notification-service:latest`

## Step 5: Start Services

Start all services:

```bash
docker-compose -f docker-compose.dockerhub.yml up -d
```

Check service status:

```bash
docker-compose -f docker-compose.dockerhub.yml ps
```

## Step 6: Verify Services

Test the API Gateway:

```bash
# Health check
curl http://localhost:8000/health

# Service endpoints
curl http://localhost:8000/api/v1/users/health
curl http://localhost:8000/api/v1/posts/health
curl http://localhost:8000/api/v1/messages/health
curl http://localhost:8000/api/v1/social/health
curl http://localhost:8000/api/v1/notifications/health
```

## Step 7: Access Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **RabbitMQ**: http://localhost:15672 (guest/guest)

## Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.dockerhub.yml logs -f

# Specific service
docker-compose -f docker-compose.dockerhub.yml logs -f user-service
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.dockerhub.yml restart

# Restart specific service
docker-compose -f docker-compose.dockerhub.yml restart user-service
```

### Update to Latest Images

```bash
# Pull latest images
docker-compose -f docker-compose.dockerhub.yml pull

# Recreate containers with new images
docker-compose -f docker-compose.dockerhub.yml up -d
```

### Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.dockerhub.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dockerhub.yml down -v
```

## Using Specific Versions

To use a specific version instead of `latest`, edit `docker-compose.dockerhub.yml`:

```yaml
services:
  user-service:
    image: yourusername/pulse-user-service:1.0.0  # Specify version
    # ... rest of config
```

Or use an environment variable:

```yaml
services:
  user-service:
    image: yourusername/pulse-user-service:${USER_SERVICE_VERSION:-latest}
    # ... rest of config
```

Then set in `.env`:

```env
USER_SERVICE_VERSION=1.0.0
```

## Deployment Scenarios

### Development Environment

Use `latest` tag for cutting-edge features:

```bash
docker-compose -f docker-compose.dockerhub.yml pull
docker-compose -f docker-compose.dockerhub.yml up -d
```

### Staging Environment

Use specific versions for stability:

```yaml
# docker-compose.staging.yml
services:
  user-service:
    image: yourusername/pulse-user-service:1.0.0
  messaging-service:
    image: yourusername/pulse-messaging-service:1.0.0
  # ... other services
```

### Production Environment

Pin to specific versions and use environment-specific configs:

```bash
# docker-compose.production.yml
docker-compose -f docker-compose.production.yml up -d
```

## Troubleshooting

### Issue: Cannot Pull Images

**Error**: `Error response from daemon: pull access denied`

**Solution**:
1. Verify Docker Hub username is correct
2. Ensure repositories are public or you're logged in:
   ```bash
   docker login
   ```
3. Check repository names match exactly

### Issue: Service Won't Start

**Error**: Service exits immediately

**Solution**:
1. Check logs:
   ```bash
   docker-compose -f docker-compose.dockerhub.yml logs user-service
   ```
2. Verify environment variables are set correctly
3. Ensure database is accessible
4. Check JWT_SECRET is set

### Issue: Database Connection Failed

**Error**: `ECONNREFUSED` or similar

**Solution**:
1. Verify PostgreSQL is running locally
2. Check connection strings in docker-compose file
3. Use `host.docker.internal` for local databases on Mac/Windows
4. Use `172.17.0.1` or host IP for Linux

### Issue: Kong Gateway Not Routing

**Error**: 502 Bad Gateway

**Solution**:
1. Check all services are healthy:
   ```bash
   docker-compose -f docker-compose.dockerhub.yml ps
   ```
2. Verify Kong configuration:
   ```bash
   curl http://localhost:8001/services
   ```
3. Check service URLs in `config/kong.yml`

## Health Checks

Check individual service health:

```bash
# User Service
curl http://localhost:8081/health

# Post Service
curl http://localhost:8082/health

# Messaging Service
curl http://localhost:8084/health

# Social Service
curl http://localhost:8085/health

# Notification Service
curl http://localhost:8086/health
```

## Performance Tips

### 1. Use Volume Mounts for Development

For faster iterations during development:

```yaml
services:
  user-service:
    image: yourusername/pulse-user-service:latest
    volumes:
      - ./user-service/src:/app/src  # Mount source code
```

### 2. Resource Limits

Add resource limits for production:

```yaml
services:
  user-service:
    image: yourusername/pulse-user-service:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 3. Caching

Enable Docker build cache to speed up pulls:

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Pull with caching
docker-compose -f docker-compose.dockerhub.yml pull --parallel
```

## Next Steps

1. **Configure OAuth**: Set up Google OAuth in user-service (see `docs/SERVICE_GUIDE.md`)
2. **Setup Monitoring**: Configure Grafana dashboards (see `docs/MONITORING.md`)
3. **Load Testing**: Test with realistic loads using `scripts/testing/load-test.sh`
4. **Production Deployment**: See `docs/DEPLOYMENT&INFRASTRUCTURE.md` for Kubernetes/cloud deployment

## Related Documentation

- [Docker Hub Deployment Guide](docs/DOCKER_HUB_DEPLOYMENT.md) - Complete CI/CD documentation
- [Main README](README.md) - Project overview
- [Service Guide](docs/SERVICE_GUIDE.md) - Individual service documentation
- [Monitoring Guide](docs/MONITORING.md) - Observability setup

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review logs with `docker-compose logs`
3. Open an issue on GitHub
4. Check Docker Hub image page for updates

