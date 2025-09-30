# Pulse Social Service

Social graph microservice for the Pulse social media platform. Manages follows, blocks, and friend recommendations.

## Features

- ✅ Follow/Unfollow users
- ✅ Block/Unblock users
- ✅ Get followers and following lists
- ✅ Friend recommendations algorithm
- ✅ Social statistics tracking
- ✅ JWT authentication
- ✅ Redis caching for performance
- ✅ RabbitMQ event publishing
- ✅ PostgreSQL with Prisma ORM
- ✅ Prometheus metrics
- ✅ Swagger API documentation
- ✅ Health checks and readiness probes
- ✅ Structured logging with Winston
- ✅ Rate limiting
- ✅ Input validation

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Monitoring**: Prometheus

## API Endpoints

### Social Operations

- `POST /api/v1/social/follow/:userId` - Follow a user
- `DELETE /api/v1/social/follow/:userId` - Unfollow a user
- `GET /api/v1/social/followers/:userId` - Get user's followers
- `GET /api/v1/social/following/:userId` - Get users being followed
- `POST /api/v1/social/block/:userId` - Block a user
- `DELETE /api/v1/social/block/:userId` - Unblock a user
- `GET /api/v1/social/recommendations` - Get friend recommendations
- `GET /api/v1/social/stats/:userId` - Get social statistics
- `GET /api/v1/social/status/:userId` - Get follow status with a user

### System Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `GET /api-docs` - Swagger documentation

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis (optional but recommended)
- RabbitMQ (optional but recommended)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `8085` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Optional |
| `RABBITMQ_URL` | RabbitMQ connection string | Optional |
| `JWT_SECRET` | JWT signing secret | Required |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

## Database Schema

### Tables

- **user_cache**: Lightweight user info synced from User Service
- **follows**: Follow relationships (follower_id, following_id)
- **blocks**: Block relationships (blocker_id, blocked_id)
- **user_social_stats**: Denormalized social statistics

### Indexes

- `follows`: Indexed on follower_id and following_id
- `blocks`: Indexed on blocker_id and blocked_id

## Events

### Published Events

- `user.followed` - When a user follows another user
- `user.blocked` - When a user blocks another user

### Consumed Events

- `user.deleted` - Clean up relationships when user is deleted
- `user.created` - Sync user cache when user is created
- `user.updated` - Sync user cache when user is updated

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t pulse-social-service .

# Run container
docker run -p 8085:8085 --env-file .env pulse-social-service
```

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

### API Testing

Access Swagger documentation at `http://localhost:8085/api-docs` for interactive API testing.

## Architecture

### Caching Strategy

- Followers/following lists: 5 minutes TTL
- Social statistics: 5 minutes TTL
- Recommendations: 10 minutes TTL

### Performance Optimizations

- Denormalized follower/following counts
- Redis caching for frequently accessed data
- Database indexes on relationship tables
- Pagination for list endpoints

### Recommendation Algorithm

Uses "friends of friends" approach:
1. Find users followed by people you follow
2. Rank by mutual connections
3. Filter out blocked users and existing follows

## Monitoring

- **Metrics**: Available at `/metrics` endpoint
- **Health**: Available at `/health` endpoint
- **Readiness**: Available at `/ready` endpoint
- **Logs**: JSON structured logs in `logs/` directory

### Custom Metrics

- `follow_operations_total` - Count of follow/unfollow operations
- `block_operations_total` - Count of block/unblock operations
- `http_request_duration_seconds` - HTTP request latency
- `http_requests_total` - Total HTTP requests

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  },
  "meta": {
    "timestamp": "2025-09-30T12:00:00.000Z",
    "version": "v1"
  }
}
```

## Security

- JWT token authentication
- Rate limiting on all endpoints
- CORS configuration
- Helmet.js security headers
- Input validation with express-validator
- SQL injection protection via Prisma

## License

MIT

