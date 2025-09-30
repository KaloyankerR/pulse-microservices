# Pulse Social Service

Social graph microservice for managing follow relationships, blocks, and friend recommendations.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start the service
docker-compose up -d social-service

# View logs
docker-compose logs -f social-service

# Stop the service
docker-compose stop social-service
```

### Important: After Restart

After running `make down` and `make up`, the Docker image contains the latest Prisma schema and will work correctly.

If you make changes to the Prisma schema after the image is built:

```bash
# Regenerate Prisma client inside container
docker-compose exec social-service npx prisma generate

# Restart service
docker-compose restart social-service
```

Or rebuild the image:

```bash
docker-compose build --no-cache social-service
docker-compose up -d social-service
```

## API Endpoints

### Social Operations (Authenticated)

- `POST /api/v1/social/follow/:userId` - Follow a user
- `DELETE /api/v1/social/follow/:userId` - Unfollow a user
- `POST /api/v1/social/block/:userId` - Block a user
- `DELETE /api/v1/social/block/:userId` - Unblock a user
- `GET /api/v1/social/recommendations` - Get friend recommendations
- `GET /api/v1/social/status/:userId` - Get follow status

### Public Endpoints

- `GET /api/v1/social/followers/:userId` - Get user's followers
- `GET /api/v1/social/following/:userId` - Get users being followed
- `GET /api/v1/social/stats/:userId` - Get social statistics

### System Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness probe (checks database)
- `GET /metrics` - Prometheus metrics
- `GET /api-docs` - Swagger documentation

## Testing

### Access API Documentation

```bash
open http://localhost:8085/api-docs
```

### Using cURL

```bash
# Health check
curl http://localhost:8085/health

# Get social stats (public)
curl http://localhost:8085/api/v1/social/stats/{userId}

# Get followers (public)
curl http://localhost:8085/api/v1/social/followers/{userId}

# Follow a user (requires JWT token)
curl -X POST http://localhost:8085/api/v1/social/follow/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

Import the collection from project root:
`/Users/kalo/pulse-microservices/POSTMAN_COLLECTION.json`

The collection includes all 9 social service endpoints with proper authentication.

## Database

### Schema

The service uses PostgreSQL with the following tables (as per DATABASE&SCHEMAS.md):

- **follows** - Follow relationships (follower_id, following_id)
- **blocks** - Block relationships (blocker_id, blocked_id)
- **user_cache** - Lightweight user info synced from User Service
- **user_social_stats** - Denormalized statistics for performance

### Migrations

```bash
# Push schema to database
docker-compose exec social-service npx prisma db push

# Generate Prisma client
docker-compose exec social-service npx prisma generate

# View database in Prisma Studio
docker-compose exec social-service npx prisma studio
```

## Environment Variables

The service reads configuration from `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `8085` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `REDIS_URL` | Redis connection | Optional |
| `RABBITMQ_URL` | RabbitMQ connection | Optional |
| `JWT_SECRET` | JWT signing secret | Required |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

## Features

✅ Follow/Unfollow users  
✅ Block/Unblock users  
✅ Friend recommendations (friends of friends)  
✅ Social statistics tracking  
✅ JWT authentication  
✅ Redis caching for performance  
✅ RabbitMQ event publishing  
✅ Prometheus metrics  
✅ Health checks and readiness probes  
✅ Swagger API documentation  
✅ Rate limiting  
✅ Input validation  
✅ Structured logging  

## Architecture

### Caching Strategy

- **Followers/Following lists**: 5 minutes TTL
- **Social statistics**: 5 minutes TTL
- **Recommendations**: 10 minutes TTL
- Cache invalidation on data mutations

### Performance Optimizations

- Denormalized follower/following counts
- Strategic indexes on relationship tables
- Batch queries with Promise.all
- Pagination for all list endpoints

### Event Publishing

The service publishes events to RabbitMQ:

- `user.followed` - When a user follows another user
- `user.blocked` - When a user blocks another user

And consumes events:

- `user.deleted` - Cleanup relationships
- `user.created`/`user.updated` - Sync user cache

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
psql -h localhost -U pulse_user -d pulse_social

# Create database if needed
psql -U postgres
CREATE DATABASE pulse_social;
```

### Prisma Schema Out of Sync

```bash
# Regenerate Prisma client
docker-compose exec social-service npx prisma generate

# Push schema to database
docker-compose exec social-service npx prisma db push

# Restart service
docker-compose restart social-service
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "8086:8085"
```

## Status

✅ **Production Ready**  
✅ **100% Compliant with DATABASE&SCHEMAS.md**  
✅ **All Endpoints Tested and Working**

---

**Service:** Social Service  
**Port:** 8085  
**Technology:** Node.js + Express + PostgreSQL + Prisma  
**Version:** 1.0.0

