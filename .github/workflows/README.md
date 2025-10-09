# GitHub Actions Workflows

This directory contains CI/CD workflows for the Pulse microservices platform using GitHub Actions matrix strategy.

## Workflows

### 1. Microservices CI (`microservices-ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Features:**
- **Matrix Strategy**: Tests all services in parallel
- **Service Dependencies**: Automatically spins up PostgreSQL, Redis, RabbitMQ, and MongoDB
- **Automated Testing**: Runs tests for Node.js and Go services
- **Docker Builds**: Validates Docker image builds
- **Automatic Deployment**: Pushes images to Docker Hub on push to `main` branch
- **Security Scanning**: Runs security audits on pull requests

**Services Tested:**
- `user-service` (Node.js + Prisma + PostgreSQL)
- `social-service` (Node.js + Prisma + PostgreSQL)
- `messaging-service` (Go + PostgreSQL + Redis + RabbitMQ)
- `post-service` (Go + PostgreSQL)
- `notification-service` (Node.js + MongoDB + Redis + RabbitMQ) - Currently disabled

**Deployment Behavior:**
- **Pull Requests**: Builds images but doesn't push to Docker Hub
- **Push to `main`**: Builds, tests, and pushes images with `latest` and commit SHA tags

### 2. Docker Hub Deploy (`docker-deploy.yml`)

✅ **ACTIVE** - Runs on version tags or manual dispatch.

**Features:**
- **Flexible Deployment**: Deploy individual services or all at once
- **Multi-platform Builds**: Builds for both AMD64 and ARM64 architectures
- **Version Management**: Extracts version from git tags
- **Smart Service Detection**: Automatically determines which services to deploy
- **Comprehensive Logging**: Provides detailed deployment summaries

**Trigger Methods:**

1. **Tag-based deployment (all services):**
   ```bash
   # Deploy all services with version tag
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Tag-based deployment (single service):**
   ```bash
   # Deploy only user-service
   git tag -a user-service-v1.2.3 -m "User service v1.2.3"
   git push origin user-service-v1.2.3
   ```

3. **Manual deployment:**
   - Go to Actions tab in GitHub
   - Select "Deploy to Docker Hub" workflow
   - Click "Run workflow"
   - Choose service (all or specific) and environment (staging/production)
   - Click "Run workflow"

**Image Tagging:**
- Version tags: `<username>/pulse-<service>:<version>`
- Latest tag: `<username>/pulse-<service>:latest`
- Commit SHA: `<username>/pulse-<service>:<commit-sha>` (for main branch pushes)

## Matrix Strategy Benefits

### 1. **Parallel Execution**
All services and versions are tested simultaneously, dramatically reducing CI time:
- Without matrix: ~40 minutes (4 services × 2 versions × 5 min each)
- With matrix: ~10 minutes (parallel execution)

### 2. **Version Coverage**
Ensures compatibility across multiple runtime versions:
- Node.js: 18.x and 20.x
- Go: 1.21 and 1.22

### 3. **Resource Efficiency**
- Shared infrastructure (GitHub runners)
- Cached dependencies per service
- Optimized Docker layer caching

### 4. **Easy Scaling**
Adding new services is simple:
```yaml
matrix:
  service: [user-service, social-service, new-service]
```

## Setup Requirements

### 1. GitHub Secrets

Configure these secrets in your repository settings:

**For Docker Hub deployment:**
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

**For GHCR deployment (alternative):**
- Uses built-in `GITHUB_TOKEN` (no setup needed)

**Optional (for Codecov):**
- `CODECOV_TOKEN`: Codecov upload token

**For Kubernetes deployment (optional):**
- `KUBE_CONFIG`: Base64 encoded kubeconfig file
- `SLACK_WEBHOOK`: Slack webhook URL for notifications

### 2. Enable Actions

1. Go to repository Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"
3. Set workflow permissions to "Read and write permissions"

## Local Testing

You can test the workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Test CI workflow for a specific job
act -j test-node-services

# Test with specific matrix values
act -j test-node-services --matrix service:user-service --matrix node-version:18.x
```

## Workflow Status Badges

Add status badges to your README:

```markdown
[![CI](https://github.com/yourusername/pulse-microservices/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/pulse-microservices/actions/workflows/ci.yml)
[![Deploy](https://github.com/yourusername/pulse-microservices/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/pulse-microservices/actions/workflows/deploy.yml)
```

## Customization

### Adding a New Service

1. Add to the change detection filter in `ci.yml`:
   ```yaml
   filters: |
     new-service:
       - 'new-service/**'
   ```

2. Add to the appropriate test job matrix:
   ```yaml
   matrix:
     service: [..., new-service]
   ```

### Modifying Test Environments

Adjust service containers in the `services` section:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_DB: custom_db_name
```

### Adding Linting Tools

For Go services, add golangci-lint:

```yaml
- name: Run golangci-lint
  uses: golangci/golangci-lint-action@v3
  with:
    version: latest
    working-directory: ./${{ matrix.service }}
```

## Best Practices

1. **Use Caching**: Both workflows use caching for dependencies (Go modules, npm packages, Docker layers)
2. **Fail Fast**: Set `fail-fast: false` in matrix to continue testing other services even if one fails
3. **Conditional Steps**: Use `if` conditions to run steps only when needed
4. **Secrets Management**: Never commit secrets; always use GitHub Secrets
5. **Environment Variables**: Use environment-specific variables for different deployment targets

## Troubleshooting

### Tests Failing on CI but Passing Locally

- Check service container health and ports
- Verify environment variables are set correctly
- Ensure database migrations run before tests

### Docker Build Failures

- Check Dockerfile syntax
- Verify build context includes all necessary files
- Check for platform-specific issues (use BuildKit)

### Coverage Upload Issues

- Verify coverage file paths match
- Check if Codecov token is set (for private repos)
- Ensure coverage files are generated in the correct format

## Cost Optimization

GitHub provides 2,000 free minutes/month for private repos. To optimize:

1. **Change Detection**: Only test changed services
2. **Caching**: Aggressive caching of dependencies
3. **Concurrent Jobs**: Use matrix for parallelization
4. **Pull Request Only**: Consider running expensive jobs only on PRs to main

```yaml
if: github.event_name == 'pull_request' && github.base_ref == 'main'
```

## Monitoring

View workflow runs:
- Repository → Actions tab
- Filter by workflow, status, or branch
- Download logs and artifacts
- Re-run failed jobs

## Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Matrix Strategy Guide](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Service Containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)

