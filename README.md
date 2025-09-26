# Pulse Microservices

A multi-service monorepo containing microservices for the Pulse application.

## Services

### User Service (Port 8080)
Node.js microservice that handles user authentication, registration, login, and user management with OAuth2 support.

### Post Service (Port 8082)
Spring Boot microservice that handles posts, comments, and likes with full CRUD operations.


## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Java 17+ (for local development)
- Maven 3.6+ (for local development)
- PostgreSQL (for local development)

## Quick Start

### Option 1: Local Development (Recommended)

For development with your local PostgreSQL databases:

```bash
# 1. Set up databases (first time only)
./setup-databases.sh

# 2. Start services locally (simple version)
./start-services.sh

# 3. Stop services when done
./stop-services.sh
```

**Alternative (advanced)**: Use `./start-local-services.sh` for more detailed logging and error handling.

### Option 2: Docker Development

For development with Docker containers:

```bash
# Start all services with Docker Compose
./start-all-services.sh
```

This will start:
- User Service (Node.js) on port 8080
- Post Service (Spring Boot) on port 8082
- PostgreSQL databases in Docker
- Redis cache in Docker

### Access Points

- **User Service**: http://localhost:8080
- **Post Service**: http://localhost:8082

### API Documentation

Access interactive API documentation:
- User Service API Docs: `http://localhost:8080/api-docs`
- Post Service Swagger UI: `http://localhost:8082/swagger-ui.html`

## API Endpoints

### User Service Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Post Service Endpoints

#### Create Post
```http
POST /api/posts
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Hello, world! This is my first post."
}
```

#### Get All Posts
```http
GET /api/posts?page=0&size=10&sortBy=createdAt&sortDir=desc
```

#### Get Post by ID
```http
GET /api/posts/1
```

#### Update Post
```http
PUT /api/posts/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Updated post content"
}
```

#### Delete Post
```http
DELETE /api/posts/1
Authorization: Bearer <JWT_TOKEN>
```

#### Get Posts by Author
```http
GET /api/posts/author/{userId}?page=0&size=10
```

### Comment Endpoints (Post Service)

#### Add Comment to Post
```http
POST /api/posts/1/comments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Great post!"
}
```

#### Get Comments for Post
```http
GET /api/posts/1/comments
```

#### Delete Comment
```http
DELETE /api/posts/comments/1
Authorization: Bearer <JWT_TOKEN>
```

### Like Endpoints (Post Service)

#### Like a Post
```http
POST /api/posts/1/like
Authorization: Bearer <JWT_TOKEN>
```

#### Unlike a Post
```http
DELETE /api/posts/1/like
Authorization: Bearer <JWT_TOKEN>
```

#### Get Likes for Post
```http
GET /api/posts/1/likes
```

### Health Check Endpoints

```http
GET /health                    # User Service health
GET /actuator/health          # Post Service health
```

## Configuration

### Database Setup

For local development, you need to set up PostgreSQL databases. Use the provided setup script:

```bash
# Run the database setup script
./setup-databases.sh
```

For detailed database configuration, see [database-config.md](./database-config.md).

### Environment Variables

The services are configured via environment variables in `docker-compose.yml`:

#### User Service
- `JWT_SECRET`: Shared secret for JWT tokens
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `GOOGLE_CLIENT_ID`: Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth2 client secret

#### Post Service
- `JWT_SECRET`: Same as User Service (for token validation)
- `SPRING_DATASOURCE_URL`: PostgreSQL connection string
- `USER_SERVICE_BASE_URL`: URL to reach User Service

### Docker Compose Configuration

The services are orchestrated using Docker Compose with the following configuration:
- **User Service**: Node.js application with PostgreSQL and Redis
- **Post Service**: Spring Boot application with PostgreSQL
- **Databases**: Separate PostgreSQL instances for each service
- **Cache**: Redis for session management and caching

## Security

- **JWT Authentication**: Both services use JWT tokens for authentication
- **Password Hashing**: BCrypt for secure password storage
- **CORS**: Configured to allow cross-origin requests
- **Input Validation**: All endpoints validate input data
- **Authorization**: Users can only modify their own tweets and comments

## Database Schema

### User Service Database (`pulse_users`)
- **users**: User accounts with email, password, and profile information
- **sessions**: User session management
- **oauth_accounts**: OAuth provider accounts

### Post Service Database (`pulse_posts_service_db`)
- **posts**: Post content, author, and timestamps
- **comments**: Comments on posts with author and post reference
- **likes**: Post likes with user and post reference

## Development

### Project Structure
```
pulse-microservices/
├── docker-compose.yml         # Main Docker Compose configuration
├── start-all-services.sh      # Startup script
├── user-service/              # Node.js user service
│   ├── src/                   # Source code
│   ├── docker/                # Docker configuration
│   ├── prisma/                # Database schema
│   ├── package.json           # Node.js dependencies
│   └── Dockerfile             # Docker image
├── post-service/              # Spring Boot post service
│   ├── src/main/java/com/pulse/post/
│   ├── pom.xml                # Maven dependencies
│   └── Dockerfile             # Docker image
└── README.md
```

### Adding New Services

To add a new microservice to this monorepo:

1. Create a new module directory
2. Add the module to the parent `pom.xml`
3. Create a `pom.xml` for the new service
4. Follow the same package structure as existing services

### Testing

```bash
# Start all services
./start-all-services.sh

# Test the integration
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Test post creation (after getting JWT token)
curl -X POST http://localhost:8082/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from the integrated platform!"}'
```

## Docker Support

### Build and Run with Docker Compose
```bash
# Build and start all services
./start-all-services.sh

# Or manually:
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Individual Service Docker Commands
```bash
# Build user service
cd user-service
docker build -t pulse-user-service .

# Build post service
cd post-service
docker build -t pulse-post-service .
```

## Usage Examples

### Complete Workflow

1. **Register a user:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

2. **Login to get JWT token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

3. **Create a post:**
```bash
curl -X POST http://localhost:8082/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"content":"Hello, world! This is my first post."}'
```

4. **Add a comment:**
```bash
curl -X POST http://localhost:8082/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"content":"Great post!"}'
```

5. **Like a post:**
```bash
curl -X POST http://localhost:8082/api/posts/1/like \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Troubleshooting

### Common Issues

1. **Services Won't Start**
   - Check if ports are available: `lsof -i :8080,8082,5432,5433,6379`
   - Check Docker logs: `docker-compose logs [service-name]`
   - Verify Docker is running: `docker info`

2. **Database Connection Issues**
   - Wait for databases to be ready: `docker-compose logs postgres`
   - Check database health: `docker exec pulse-users-db pg_isready`
   - Verify network connectivity: `docker network ls`

3. **JWT Token Issues**
   - Ensure both services use the same `JWT_SECRET`
   - Check token expiration time
   - Verify User Service is accessible from Post Service

4. **Service Communication Issues**
   - Check if services are on the same network: `docker network inspect pulse-network`
   - Verify service URLs in environment variables
   - Check firewall settings

### Logs

View service logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
docker-compose logs -f post-service
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


