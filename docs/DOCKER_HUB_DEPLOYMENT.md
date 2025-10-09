# Docker Hub Deployment Guide

This guide explains how the Pulse microservices platform automatically builds and deploys Docker images to Docker Hub using GitHub Actions.

## Table of Contents

- [Overview](#overview)
- [Setup Requirements](#setup-requirements)
- [Deployment Workflows](#deployment-workflows)
- [Image Tagging Strategy](#image-tagging-strategy)
- [Deployment Scenarios](#deployment-scenarios)
- [Pulling and Running Images](#pulling-and-running-images)
- [Troubleshooting](#troubleshooting)

## Overview

The platform uses two GitHub Actions workflows for Docker Hub deployment:

1. **CI Workflow** (`microservices-ci.yml`) - Automatically pushes images on every merge to `main`
2. **Deploy Workflow** (`docker-deploy.yml`) - Manual or tag-based deployments with version control

All images are multi-platform builds supporting both **AMD64** and **ARM64** architectures.

## Setup Requirements

### 1. Docker Hub Account

1. Create a [Docker Hub account](https://hub.docker.com/) if you don't have one
2. Create a repository for each service (or enable auto-create):
   - `<username>/pulse-user-service`
   - `<username>/pulse-social-service`
   - `<username>/pulse-messaging-service`
   - `<username>/pulse-post-service`
   - `<username>/pulse-notification-service`

### 2. Docker Hub Access Token

1. Go to Docker Hub → Account Settings → [Security](https://hub.docker.com/settings/security)
2. Click "New Access Token"
3. Name: `github-actions-pulse-microservices`
4. Access permissions: **Read, Write, Delete**
5. Copy the generated token (you won't see it again!)

### 3. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `johndoe` |
| `DOCKERHUB_TOKEN` | Docker Hub access token (from step 2) | `dckr_pat_xxx...` |

### 4. Enable GitHub Actions

1. Go to repository **Settings → Actions → General**
2. Enable "Allow all actions and reusable workflows"
3. Set workflow permissions to "Read and write permissions"
4. Save changes

## Deployment Workflows

### Automatic Deployment (CI Workflow)

**Trigger**: Push to `main` branch

**What it does**:
- Runs tests for all services
- Builds Docker images for all services
- Pushes images to Docker Hub with `latest` and commit SHA tags
- Only deploys if tests pass

**Tags created**:
- `<username>/pulse-<service>:latest`
- `<username>/pulse-<service>:<commit-sha>`

**Example**:
```bash
# After merging PR to main, images are automatically available:
docker pull johndoe/pulse-user-service:latest
docker pull johndoe/pulse-messaging-service:latest
```

### Manual/Tag-Based Deployment (Deploy Workflow)

**Triggers**:
1. Git version tags (e.g., `v1.0.0`, `user-service-v1.2.3`)
2. Manual workflow dispatch via GitHub UI

**What it does**:
- Builds and pushes specified service(s)
- Creates semantic version tags
- Supports multi-platform builds (AMD64/ARM64)
- Provides detailed deployment summary

## Image Tagging Strategy

### On Push to Main Branch

```
<username>/pulse-user-service:latest
<username>/pulse-user-service:<commit-sha>
```

Example:
```bash
johndoe/pulse-user-service:latest
johndoe/pulse-user-service:a1b2c3d
```

### On Full Version Tag (e.g., `v1.0.0`)

Deploys **all services** with version tag:

```
<username>/pulse-user-service:1.0.0
<username>/pulse-user-service:latest
<username>/pulse-social-service:1.0.0
<username>/pulse-social-service:latest
# ... (all services)
```

### On Service-Specific Tag (e.g., `user-service-v1.2.3`)

Deploys **only that service**:

```
<username>/pulse-user-service:1.2.3
<username>/pulse-user-service:latest
```

## Deployment Scenarios

### Scenario 1: Deploy All Services (Version Release)

Create and push a version tag:

```bash
# Create a new version for all services
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**Result**: All 5 services are built and pushed with version `1.0.0` and `latest` tags.

### Scenario 2: Deploy Single Service

Create and push a service-specific tag:

```bash
# Deploy only user-service
git tag -a user-service-v1.2.3 -m "User service hotfix v1.2.3"
git push origin user-service-v1.2.3
```

**Result**: Only `user-service` is built and pushed with version `1.2.3` and `latest` tags.

### Scenario 3: Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select "Deploy to Docker Hub" workflow
3. Click "Run workflow"
4. Choose:
   - **Service**: Select specific service or "all"
   - **Environment**: staging or production
5. Click "Run workflow"

**Result**: Selected service(s) are built and deployed.

### Scenario 4: Continuous Deployment on Main

```bash
# Merge PR to main
git checkout main
git pull
git merge feature/new-feature
git push origin main
```

**Result**: CI runs, tests pass, all services automatically deployed with `latest` tag.

## Pulling and Running Images

### Pull Latest Images

```bash
# Pull all services
docker pull johndoe/pulse-user-service:latest
docker pull johndoe/pulse-social-service:latest
docker pull johndoe/pulse-messaging-service:latest
docker pull johndoe/pulse-post-service:latest
docker pull johndoe/pulse-notification-service:latest
```

### Pull Specific Versions

```bash
# Pull specific version
docker pull johndoe/pulse-user-service:1.0.0

# Pull by commit SHA
docker pull johndoe/pulse-user-service:a1b2c3d
```

### Update docker-compose.yml to Use Docker Hub Images

Replace build contexts with published images:

```yaml
version: '3.8'

services:
  user-service:
    image: johndoe/pulse-user-service:latest
    # Remove 'build:' section
    ports:
      - "8081:8080"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/users
    # ... rest of config

  messaging-service:
    image: johndoe/pulse-messaging-service:latest
    ports:
      - "8084:8084"
    # ... rest of config

  # ... other services
```

### Run with Docker Compose

```bash
# Pull latest images and start
docker-compose pull
docker-compose up -d

# Or in one command
docker-compose up -d --pull always
```

### Run Individual Service

```bash
# Run user-service
docker run -d \
  --name pulse-user-service \
  -p 8081:8080 \
  -e DATABASE_URL=postgresql://user:pass@localhost:5432/users \
  -e JWT_SECRET=your-secret-key \
  johndoe/pulse-user-service:latest

# Check logs
docker logs -f pulse-user-service
```

## Monitoring Deployments

### View Workflow Status

1. Go to **Actions** tab in GitHub repository
2. Select the workflow run
3. View build logs and deployment status
4. Check deployment summary for image URLs

### Check Deployed Images

Visit Docker Hub repositories:
- https://hub.docker.com/r/johndoe/pulse-user-service
- https://hub.docker.com/r/johndoe/pulse-social-service
- https://hub.docker.com/r/johndoe/pulse-messaging-service
- https://hub.docker.com/r/johndoe/pulse-post-service
- https://hub.docker.com/r/johndoe/pulse-notification-service

### Verify Image Locally

```bash
# Inspect image metadata
docker inspect johndoe/pulse-user-service:latest

# Check image labels
docker inspect johndoe/pulse-user-service:latest | jq '.[0].Config.Labels'

# Verify platform support
docker manifest inspect johndoe/pulse-user-service:latest
```

## Rollback Strategy

### Roll Back to Previous Version

```bash
# Find previous version
docker image ls johndoe/pulse-user-service

# Roll back in docker-compose
docker-compose down
docker-compose pull johndoe/pulse-user-service:1.0.0
docker-compose up -d
```

### Roll Back Using Commit SHA

```bash
# Use specific commit
docker pull johndoe/pulse-user-service:a1b2c3d
docker tag johndoe/pulse-user-service:a1b2c3d johndoe/pulse-user-service:latest
```

## Troubleshooting

### Issue: Docker Hub Login Failed

**Error**: `Error: Cannot perform an interactive login from a non TTY device`

**Solution**:
1. Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are set correctly
2. Regenerate Docker Hub access token if needed
3. Ensure token has "Read, Write, Delete" permissions

### Issue: Image Push Permission Denied

**Error**: `denied: requested access to the resource is denied`

**Solution**:
1. Verify repository name matches `<username>/pulse-<service>`
2. Check Docker Hub username is correct in secrets
3. Ensure repositories exist on Docker Hub (or enable auto-create)
4. Verify access token permissions

### Issue: Build Failed on ARM64

**Error**: Build fails for `linux/arm64` platform

**Solution**:
1. Check Dockerfile compatibility with ARM64
2. Ensure base images support ARM64
3. Use QEMU for cross-platform builds (already configured)

### Issue: Out of Docker Hub Storage

**Error**: `quota exceeded`

**Solution**:
1. Delete old/unused images from Docker Hub
2. Implement image retention policy
3. Consider upgrading Docker Hub plan

### Issue: Workflow Not Triggering

**Problem**: Workflow doesn't run on push to main

**Solution**:
1. Check GitHub Actions are enabled for repository
2. Verify workflow file syntax with `yamllint`
3. Check branch protection rules aren't blocking
4. Ensure `main` is the correct branch name

### Check Workflow Logs

```bash
# Download workflow logs using GitHub CLI
gh run list --workflow=docker-deploy.yml
gh run view <run-id> --log
```

## Best Practices

### 1. Semantic Versioning

Use semantic versioning for production releases:

```bash
# Major release (breaking changes)
git tag -a v2.0.0 -m "Version 2.0.0 - Breaking changes"

# Minor release (new features)
git tag -a v1.1.0 -m "Version 1.1.0 - New features"

# Patch release (bug fixes)
git tag -a v1.0.1 -m "Version 1.0.1 - Bug fixes"
```

### 2. Always Test Before Tagging

```bash
# Merge to main first (triggers CI and deployment)
git checkout main
git merge develop
git push origin main

# After CI passes and images are tested, tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 3. Use Environment-Specific Tags

```bash
# Staging deployment
git tag -a v1.0.0-staging -m "Staging release"

# Production deployment
git tag -a v1.0.0 -m "Production release"
```

### 4. Monitor Image Sizes

```bash
# Check image size
docker images johndoe/pulse-user-service

# Optimize Dockerfiles if images are too large
# - Use multi-stage builds
# - Minimize layers
# - Use alpine base images
```

### 5. Regular Cleanup

```bash
# Clean old local images
docker image prune -a

# Remove unused images from Docker Hub regularly
```

## Security Considerations

### 1. Secrets Management

- **Never** commit Docker Hub credentials to repository
- Rotate access tokens regularly
- Use repository secrets, not environment variables
- Enable 2FA on Docker Hub account

### 2. Image Scanning

Consider adding Trivy or similar scanners:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: johndoe/pulse-user-service:latest
    format: 'sarif'
    output: 'trivy-results.sarif'
```

### 3. Image Signing

For production, consider signing images with Docker Content Trust or Cosign.

### 4. Private Repositories

For sensitive applications:
1. Use private Docker Hub repositories
2. Restrict access tokens to minimum required permissions
3. Implement IP allowlisting if available

## Cost Optimization

### Docker Hub Free Tier Limits

- **Pulls**: 200 pulls per 6 hours for anonymous users
- **Storage**: 1 repository, unlimited public repositories
- **Builds**: Not included in free tier

### Recommendations

1. **Use GitHub Actions cache** - Already configured in workflows
2. **Tag strategically** - Don't create too many tags
3. **Clean old images** - Keep only last N versions
4. **Consider alternatives** - GitHub Container Registry (GHCR) is free for public repos

## Advanced Configuration

### Deploy to Alternative Registries

To deploy to GitHub Container Registry instead:

```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push to GHCR
  uses: docker/build-push-action@v5
  with:
    context: ./${{ matrix.service }}
    push: true
    tags: ghcr.io/${{ github.repository_owner }}/pulse-${{ matrix.service }}:latest
```

### Add Slack Notifications

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to Docker Hub ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Support and Resources

- **Docker Hub Documentation**: https://docs.docker.com/docker-hub/
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Docker Build Push Action**: https://github.com/docker/build-push-action
- **Project Issues**: https://github.com/yourusername/pulse-microservices/issues

## Related Documentation

- [Main README](../README.md)
- [Deployment & Infrastructure](./DEPLOYMENT&INFRASTRUCTURE.md)
- [Service Guide](./SERVICE_GUIDE.md)
- [Database & Schemas](./DATABASE&SCHEMAS.md)

