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

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on every push and PR to `main`/`develop`
   - Smart change detection - only tests modified services
   - Matrix testing across multiple versions (Node 18/20, Go 1.21/1.22)
   - Automated linting, testing, and coverage reports
   - Docker image validation

2. **Deploy Workflow** (`.github/workflows/deploy.yml`) - ⚠️ **CURRENTLY DISABLED**
   - Triggered by version tags or manual dispatch
   - Multi-platform Docker builds (AMD64/ARM64)
   - Environment-specific deployments (staging/production)
   - Service-specific or full platform deployment
   - *To enable: Uncomment triggers in deploy.yml*

3. **PR Validation** (`.github/workflows/pr-validation.yml`)
   - Validates PR titles (conventional commits)
   - Checks for merge conflicts and large files
   - Security scanning with Trivy
   - Automated PR size analysis

4. **Code Quality** (`.github/workflows/code-quality.yml`)
   - SonarCloud integration
   - CodeQL security analysis
   - Dependency review
   - Cyclomatic complexity checks

### Quick Start with GitHub Actions

1. **Enable Actions**: Go to repository Settings → Actions and enable workflows

2. **Configure Secrets** (for deployment):
   ```
   DOCKERHUB_USERNAME  # Docker Hub username
   DOCKERHUB_TOKEN     # Docker Hub access token
   SONAR_TOKEN         # SonarCloud token (optional)
   ```

3. **Deploy a Service** (⚠️ deployment currently disabled):
   ```bash
   # Deployment workflow is disabled by default
   # To enable: Edit .github/workflows/deploy.yml
   
   # Once enabled:
   # Deploy all services
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   
   # Deploy specific service
   git tag -a user-service-v1.0.0 -m "User service v1.0.0"
   git push origin user-service-v1.0.0
   ```

4. **View Workflow Status**: Check the Actions tab in GitHub

For detailed documentation, see [.github/workflows/README.md](.github/workflows/README.md)

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
