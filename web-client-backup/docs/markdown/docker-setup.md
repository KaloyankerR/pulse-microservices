# Docker Setup Guide

This guide explains how to run the Pulse application using Docker with your hosted MongoDB.

## Prerequisites

- Docker installed on your system
- Docker Compose
- Access to a hosted MongoDB database

## Quick Start

### 1. Environment Setup

Edit `docker.env` with your actual values:

- `DATABASE_URL`: Your hosted MongoDB connection string
- `NEXTAUTH_SECRET`: A secure random string for NextAuth (min 32 chars)
- `NEXTAUTH_JWT_SECRET`: A secure random string for JWT (min 32 chars)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: If using Google OAuth

### 2. Start the Application

```bash
# Start the application
npm run docker:start

# View logs (optional)
npm run docker:logs

# Stop the application
npm run docker:stop
```

## Available Scripts

| Script           | Description                       |
| ---------------- | --------------------------------- |
| `docker:build`   | Build the Docker image            |
| `docker:start`   | Start the application             |
| `docker:stop`    | Stop the application              |
| `docker:logs`    | View application logs             |
| `docker:restart` | Restart the application           |
| `docker:clean`   | Clean up Docker system and images |
| `validate:env`   | Validate environment variables    |

## Docker Image Features

### Multi-stage Build

- **deps**: Installs only production dependencies
- **builder**: Installs all dependencies, generates Prisma client, and builds the app
- **runner**: Final production image with minimal footprint
- **Base Image**: Node.js 20 Alpine for compatibility with all dependencies

### Security Features

- Runs as non-root user (`nextjs`)
- Proper file permissions
- Minimal Alpine Linux base image
- Health checks included

### Native Module Support

- Includes build tools (python3, make, g++) for compiling native modules
- Automatically rebuilds bcrypt and other native modules for Alpine Linux
- Properly includes native modules in the standalone output

### Performance Optimizations

- Leverages Next.js standalone output
- Optimized layer caching
- Minimal production dependencies
- Proper static file handling

## Environment Variables

### Required

- `DATABASE_URL`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth sessions
- `NEXTAUTH_JWT_SECRET`: Secret for JWT tokens

### Optional

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NEXTAUTH_URL`: Base URL for the application (default: http://localhost:3000)

## Health Checks

The Docker image includes health checks that:

- Check the `/api/current` endpoint every 30 seconds
- Wait 40 seconds before starting checks
- Retry up to 3 times on failure
- Timeout after 10 seconds per check

## Troubleshooting

### Build Issues

1. Ensure you have the latest Docker version
2. Check that all required files are present
3. Verify environment variables are properly set
4. If you encounter linting errors during build, they are automatically skipped in Docker builds using `SKIP_LINT=true`
5. The Docker image uses Node.js 20 to ensure compatibility with all dependencies
6. Native modules like bcrypt are automatically rebuilt for the Alpine Linux platform

### Runtime Issues

1. Check container logs: `docker logs <container_id>`
2. Verify database connectivity
3. Ensure environment variables are correctly set

### Performance Issues

1. Use production build: `npm run docker:build:prod`
2. Enable health checks monitoring
3. Check resource usage: `docker stats`

## Production Deployment

For production deployment:

1. Use the production environment file
2. Build with production target: `npm run docker:build:prod`
3. Use docker-compose for orchestration
4. Set up proper reverse proxy (nginx/traefik)
5. Configure proper logging and monitoring
6. Set up database backups
7. Use container orchestration (Docker Swarm/Kubernetes)

## File Structure

```
├── Dockerfile                 # Multi-stage production Dockerfile
├── docker-compose.yml        # Production docker-compose
├── docker-compose.dev.yml    # Development docker-compose
├── docker.env.production     # Production environment template
├── docker.env.example        # Development environment template
├── .dockerignore             # Files to exclude from build context
└── DOCKER_SETUP.md          # This documentation
```
