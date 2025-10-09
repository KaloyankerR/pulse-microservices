# Pulse Microservices

[![CI](https://github.com/yourusername/pulse-microservices/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/pulse-microservices/actions/workflows/ci.yml)
[![Deploy](https://github.com/yourusername/pulse-microservices/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/pulse-microservices/actions/workflows/deploy.yml)
[![Code Quality](https://github.com/yourusername/pulse-microservices/actions/workflows/code-quality.yml/badge.svg)](https://github.com/yourusername/pulse-microservices/actions/workflows/code-quality.yml)

Microservices platform with API Gateway, user authentication, post management, and social features.

## Services

- **Kong API Gateway** (port 8000) - Routes all requests
- **User Service** (Node.js) - Authentication & user management
- **Social Service** (Node.js) - Follow relationships & recommendations
- **Messaging Service** (Go) - Real-time messaging & WebSocket support
- **Post Service** (Go) - Posts, likes, and user cache
- **Notification Service** (Node.js) - Push notifications & user preferences
- **Prometheus** (port 9090) - Metrics collection & monitoring
- **Grafana** (port 3001) - Metrics visualization & dashboards


## Prerequisites

- **PostgreSQL** (local installation)
- **Docker & Docker Compose**

## Quick Start

```bash
# 1. Setup databases (first time only)
make db-setup

# 2. Start all services
make up

# 3. Test
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/posts
```

All requests go through Kong Gateway at **http://localhost:8000**

## Common Commands

```bash
make up          # Start all services
make down        # Stop all services
make logs        # View logs
make ps          # List services
make rebuild     # Rebuild and restart
make test        # Health checks
make db-reset    # Reset all databases
```

## API Endpoints

### Authentication
```bash
# Register
POST http://localhost:8000/api/v1/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Login
POST http://localhost:8000/api/v1/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Posts
```bash
# Get all posts
GET http://localhost:8000/api/v1/posts

# Create post (requires auth)
POST http://localhost:8000/api/v1/posts
Authorization: Bearer {token}
{
  "content": "My first post!"
}

# Like post
POST http://localhost:8000/api/v1/posts/{id}/like
Authorization: Bearer {token}
```

Import `POSTMAN_COLLECTION.json` for complete API documentation.


## Architecture

- **Services run in Docker**, databases run locally (PostgreSQL)
- Services connect to local DBs via `host.docker.internal`
- Kong Gateway routes all traffic in DB-less mode
- Database schemas defined in `docs/DATABASE&SCHEMAS.md`

## Project Structure

```
pulse-microservices/
├── docker-compose.yml          # All services
├── Makefile                    # Commands
├── config/kong.yml             # Kong routes
├── user-service/               # Node.js + Prisma
├── post-service/               # Go service
├── docs/DATABASE&SCHEMAS.md    # Schema reference
└── POSTMAN_COLLECTION.json     # API tests
```

## CI/CD with GitHub Actions

This project uses GitHub Actions with a **matrix strategy** for efficient parallel testing and deployment of all microservices.

### Workflows

1. **CI Workflow** (`.github/workflows/microservices-ci.yml`)
   - Runs on every push and PR to `main`/`develop`
   - Automatically builds and pushes Docker images to Docker Hub on `main` branch
   - Matrix testing across multiple versions
   - Automated testing and Docker image validation
   - Multi-service parallel execution

2. **Docker Hub Deploy Workflow** (`.github/workflows/docker-deploy.yml`) - ✅ **ACTIVE**
   - Triggered by version tags or manual dispatch
   - Multi-platform Docker builds (AMD64/ARM64)
   - Flexible deployment options (all services or individual)
   - Semantic versioning support
   - Automatic tagging strategy (latest, version, commit SHA)

### Quick Start with Docker Hub Deployment

#### 1. Setup (One-Time)

Configure GitHub repository secrets:

**Settings → Secrets and variables → Actions**

| Secret Name | Description |
|-------------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token ([create here](https://hub.docker.com/settings/security)) |

#### 2. Automatic Deployment

Every merge to `main` automatically:
- Runs all tests
- Builds Docker images for all services
- Pushes to Docker Hub with `latest` and commit SHA tags

```bash
# Merge PR to main
git checkout main
git pull
git merge feature/new-feature
git push origin main

# Images automatically available:
# <username>/pulse-user-service:latest
# <username>/pulse-user-service:<commit-sha>
```

#### 3. Version Release (Deploy All Services)

Create and push a version tag:

```bash
# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# All services deployed with tags:
# <username>/pulse-user-service:1.0.0
# <username>/pulse-user-service:latest
# (and all other services)
```

#### 4. Deploy Single Service

```bash
# Deploy only user-service with specific version
git tag -a user-service-v1.2.3 -m "User service hotfix v1.2.3"
git push origin user-service-v1.2.3

# Only user-service deployed:
# <username>/pulse-user-service:1.2.3
# <username>/pulse-user-service:latest
```

#### 5. Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select "Deploy to Docker Hub" workflow
3. Click "Run workflow"
4. Choose service and environment
5. Click "Run workflow"

### Using Docker Hub Images

Pull and run the latest images:

```bash
# Pull latest images
docker pull yourusername/pulse-user-service:latest
docker pull yourusername/pulse-messaging-service:latest
docker pull yourusername/pulse-post-service:latest
docker pull yourusername/pulse-social-service:latest
docker pull yourusername/pulse-notification-service:latest

# Run with docker-compose (update image names in docker-compose.yml)
docker-compose pull
docker-compose up -d
```

### Image Tagging Strategy

| Trigger | Tags Created | Example |
|---------|-------------|---------|
| Push to `main` | `latest`, `<commit-sha>` | `latest`, `a1b2c3d` |
| Full version tag (`v1.0.0`) | `<version>`, `latest` | `1.0.0`, `latest` |
| Service tag (`user-service-v1.2.3`) | `<version>`, `latest` | `1.2.3`, `latest` |

For detailed documentation, see [docs/DOCKER_HUB_DEPLOYMENT.md](docs/DOCKER_HUB_DEPLOYMENT.md)

## Monitoring & Observability

The platform includes comprehensive monitoring with Prometheus and Grafana:

### Access Monitoring Tools

- **Prometheus**: http://localhost:9090
  - Metrics collection and time-series database
  - Query metrics with PromQL
  - View scrape targets: http://localhost:9090/targets

- **Grafana**: http://localhost:3001
  - Username: `admin` / Password: `admin`
  - Pre-configured dashboards for all services
  - Customizable alerts and visualizations

### Service Metrics Endpoints

All services expose Prometheus metrics at `/metrics`:

- User Service: http://localhost:8081/metrics
- Post Service: http://localhost:8082/metrics
- Messaging Service: http://localhost:8084/metrics
- Social Service: http://localhost:8085/metrics
- Notification Service: http://localhost:8086/metrics

### Available Dashboards

1. **Pulse Microservices Overview**: Comprehensive dashboard showing:
   - HTTP request rates and response times
   - Service health status
   - CPU and memory usage
   - Error rates by status code
   - Business metrics (users, posts, messages)

### Quick Monitoring Commands

```bash
# View Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query metrics via PromQL
curl 'http://localhost:9090/api/v1/query?query=up'

# Check service metrics
curl http://localhost:8081/metrics
```

For detailed monitoring documentation, see [docs/MONITORING.md](docs/MONITORING.md)

## Troubleshooting

```bash
make logs              # View all logs
make ps                # Check service status
make db-reset          # Reset databases
docker-compose restart # Restart services
```
