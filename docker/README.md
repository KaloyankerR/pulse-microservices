# Unified Docker Configuration Files

This directory contains unified Docker configuration files used across all microservices in the Pulse platform.

## Purpose

Instead of maintaining separate Docker configuration files in each service directory, we use unified templates here to ensure consistency and reduce duplication.

## Files

### Dockerignore Templates

- **`nodejs.dockerignore`** - Used by all Node.js/TypeScript services (auth-service, user-service, social-service, notification-service)
- **`go.dockerignore`** - Used by all Go services (messaging-service, post-service, event-service)

### Dockerfile Templates

- **`nodejs-service.Dockerfile`** - Shared multi-stage Dockerfile for auth-service and user-service (identical builds)

## Usage

### .dockerignore Files

Each service directory contains a `.dockerignore` file that is a **symlink** to the appropriate unified template from this directory. This ensures:
- Single source of truth for ignore patterns
- Automatic updates when templates change
- No manual copying required

**Node.js Services** (symlinks to `../docker/nodejs.dockerignore`):
- `auth-service/.dockerignore`
- `user-service/.dockerignore`
- `social-service/.dockerignore`
- `notification-service/.dockerignore`

**Go Services** (symlinks to `../docker/go.dockerignore`):
- `messaging-service/.dockerignore`
- `post-service/.dockerignore`
- `event-service/.dockerignore`

**Note**: `frontend/.dockerignore` is kept separate as it has Next.js-specific requirements.

### Dockerfiles

The `nodejs-service.Dockerfile` is shared by `auth-service` and `user-service` since they have identical build requirements. The docker-compose.yml file references this shared Dockerfile with appropriate build contexts and arguments.

## Maintenance

### Updating .dockerignore Patterns

When updating ignore patterns:

1. **Update the unified file** in this `docker/` directory
2. **Changes are automatically applied** - no copying needed since services use symlinks
3. **Test builds** to ensure everything still works correctly

### Updating Shared Dockerfile

When updating the shared `nodejs-service.Dockerfile`:

1. **Update the file** in this `docker/` directory
2. **Changes apply to both** auth-service and user-service automatically
3. **Test builds** for both services: `docker-compose build auth-service user-service`

## Requirements

- Symlink support is required (standard on Unix-like systems including macOS and Linux)
- Windows users may need to enable Developer Mode or use Git Bash/WSL for symlink support
