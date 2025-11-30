# Unified Docker Configuration Files

This directory contains unified `.dockerignore` files used across all microservices in the Pulse platform.

## Purpose

Instead of maintaining separate `.dockerignore` files in each service directory, we use unified templates here to ensure consistency and reduce duplication.

## Files

- **`nodejs.dockerignore`** - Used by all Node.js/TypeScript services (auth-service, user-service, social-service, notification-service)
- **`go.dockerignore`** - Used by all Go services (messaging-service, post-service, event-service)

## Usage

Each service directory contains a `.dockerignore` file that is a copy of the appropriate unified template from this directory.

### Node.js Services

The following services use `docker/nodejs.dockerignore`:
- `auth-service/.dockerignore`
- `user-service/.dockerignore`
- `social-service/.dockerignore`
- `notification-service/.dockerignore`

**Note**: `frontend/.dockerignore` is kept separate as it has Next.js-specific requirements.

### Go Services

The following services use `docker/go.dockerignore`:
- `messaging-service/.dockerignore`
- `post-service/.dockerignore`
- `event-service/.dockerignore`

## Maintenance

When updating ignore patterns:

1. **Update the unified file** in this `docker/` directory
2. **Copy to all relevant service directories**:
   ```bash
   # For Node.js services
   cp docker/nodejs.dockerignore auth-service/.dockerignore
   cp docker/nodejs.dockerignore user-service/.dockerignore
   cp docker/nodejs.dockerignore social-service/.dockerignore
   cp docker/nodejs.dockerignore notification-service/.dockerignore
   
   # For Go services
   cp docker/go.dockerignore messaging-service/.dockerignore
   cp docker/go.dockerignore post-service/.dockerignore
   cp docker/go.dockerignore event-service/.dockerignore
   ```

3. **Test builds** to ensure everything still works correctly

## Future Improvements

Consider creating a script to automate syncing these files to all services in the future.

