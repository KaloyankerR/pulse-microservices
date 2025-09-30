# Pulse Microservices

Microservices platform with API Gateway, user authentication, and post management.

## Services

- **Kong API Gateway** (port 8000) - Routes all requests
- **User Service** (Node.js) - Authentication & user management
- **Post Service** (Go) - Posts, likes, and user cache


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

## Troubleshooting

```bash
make logs              # View all logs
make ps                # Check service status
make db-reset          # Reset databases
docker-compose restart # Restart services
```
