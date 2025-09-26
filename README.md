# Pulse Microservices

A multi-service monorepo containing microservices for the Pulse application.

## Services

### Auth Service (Port 8080)
Authentication and authorization microservice that handles user registration, login, and JWT token management.

### Tweet Service (Port 8081)
Tweet management microservice that handles tweets, comments, and likes with full CRUD operations.

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- PostgreSQL 12 or higher
- Docker (optional, for containerized services)

## Quick Start

### 1. Database Setup

#### Option A: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create databases and users:
```sql
-- For Auth Service
CREATE DATABASE pulse_auth;
CREATE USER pulse_user WITH PASSWORD 'pulse_password';
GRANT ALL PRIVILEGES ON DATABASE pulse_auth TO pulse_user;

-- For Tweet Service
CREATE DATABASE pulse_tweets;
GRANT ALL PRIVILEGES ON DATABASE pulse_tweets TO pulse_user;
```

#### Option B: Docker PostgreSQL
```bash
# Start all services with Docker Compose
docker-compose up
```

### 2. Build and Run

```bash
# Build the entire project
mvn clean install

# Run auth service
cd auth-service
mvn spring-boot:run

# Run tweet service (in another terminal)
cd tweet-service
mvn spring-boot:run
```

Services will be available at:
- Auth Service: `http://localhost:8080`
- Tweet Service: `http://localhost:8081`

### 3. API Documentation

Access interactive API documentation:
- Auth Service Swagger UI: `http://localhost:8080/swagger-ui.html`
- Tweet Service Swagger UI: `http://localhost:8081/swagger-ui.html`

## API Endpoints

### Authentication Endpoints (Auth Service)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

### Tweet Endpoints (Tweet Service)

#### Create Tweet
```http
POST /api/tweets
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Hello, world! This is my first tweet."
}
```

#### Get All Tweets
```http
GET /api/tweets?page=0&size=10&sortBy=createdAt&sortDir=desc
```

#### Get Tweet by ID
```http
GET /api/tweets/1
```

#### Get Tweet with Details (Comments & Likes)
```http
GET /api/tweets/1/details
```

#### Update Tweet
```http
PUT /api/tweets/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Updated tweet content"
}
```

#### Delete Tweet
```http
DELETE /api/tweets/1
Authorization: Bearer <JWT_TOKEN>
```

#### Search Tweets
```http
GET /api/tweets/search?keyword=hello&page=0&size=10
```

#### Get Tweets by Author
```http
GET /api/tweets/author/john_doe?page=0&size=10
```

### Comment Endpoints (Tweet Service)

#### Add Comment to Tweet
```http
POST /api/tweets/1/comments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Great tweet!"
}
```

#### Get Comments for Tweet
```http
GET /api/tweets/1/comments
```

#### Delete Comment
```http
DELETE /api/tweets/comments/1
Authorization: Bearer <JWT_TOKEN>
```

### Like Endpoints (Tweet Service)

#### Like a Tweet
```http
POST /api/tweets/1/like
Authorization: Bearer <JWT_TOKEN>
```

#### Unlike a Tweet
```http
DELETE /api/tweets/1/like
Authorization: Bearer <JWT_TOKEN>
```

#### Get Likes for Tweet
```http
GET /api/tweets/1/likes
```

### Health Check Endpoints

```http
GET /api/auth/health
GET /api/tweets/health
```

## Configuration

### Environment Variables

You can override the default configuration using environment variables:

```bash
# Auth Service
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pulse_auth
export SPRING_DATASOURCE_USERNAME=pulse_user
export SPRING_DATASOURCE_PASSWORD=pulse_password
export JWT_SECRET=your-secret-key-here
export JWT_EXPIRATION=86400000

# Tweet Service
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pulse_tweets
export SPRING_DATASOURCE_USERNAME=pulse_user
export SPRING_DATASOURCE_PASSWORD=pulse_password
export JWT_SECRET=your-secret-key-here
export JWT_EXPIRATION=86400000
```

### Application Properties

#### Auth Service (`auth-service/src/main/resources/application.yml`)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pulse_auth
    username: pulse_user
    password: pulse_password

jwt:
  secret: mySecretKey123456789012345678901234567890
  expiration: 86400000 # 24 hours
```

#### Tweet Service (`tweet-service/src/main/resources/application.yml`)
```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pulse_tweets
    username: pulse_user
    password: pulse_password

jwt:
  secret: mySecretKey123456789012345678901234567890
  expiration: 86400000 # 24 hours
```

## Security

- **JWT Authentication**: Both services use JWT tokens for authentication
- **Password Hashing**: BCrypt for secure password storage
- **CORS**: Configured to allow cross-origin requests
- **Input Validation**: All endpoints validate input data
- **Authorization**: Users can only modify their own tweets and comments

## Database Schema

### Auth Service Database (`pulse_auth`)
- **users**: User accounts with username, email, and hashed password

### Tweet Service Database (`pulse_tweets`)
- **tweets**: Tweet content, author, and timestamps
- **comments**: Comments on tweets with author and tweet reference
- **likes**: Tweet likes with user and tweet reference

## Development

### Project Structure
```
pulse-microservices/
├── pom.xml                    # Parent POM
├── auth-service/              # Authentication service
│   ├── pom.xml
│   └── src/main/java/com/pulse/auth/
│       ├── AuthServiceApplication.java
│       ├── config/            # Configuration classes
│       ├── controller/        # REST controllers
│       ├── dto/              # Data Transfer Objects
│       ├── entity/           # JPA entities
│       ├── repository/       # Data repositories
│       ├── service/          # Business logic
│       └── util/             # Utility classes
├── tweet-service/             # Tweet management service
│   ├── pom.xml
│   └── src/main/java/com/pulse/tweet/
│       ├── TweetServiceApplication.java
│       ├── config/            # Configuration classes
│       ├── controller/        # REST controllers
│       ├── dto/              # Data Transfer Objects
│       ├── entity/           # JPA entities
│       ├── repository/       # Data repositories
│       ├── service/          # Business logic
│       └── util/             # Utility classes
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
# Run tests for all services
mvn test

# Run tests for specific service
cd auth-service
mvn test

cd tweet-service
mvn test
```

## Docker Support

### Build and Run with Docker Compose
```bash
# Build and start all services
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
# Build auth service
cd auth-service
docker build -t pulse-auth-service .

# Build tweet service
cd tweet-service
docker build -t pulse-tweet-service .
```

## Usage Examples

### Complete Workflow

1. **Register a user:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"password123"}'
```

2. **Login to get JWT token:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}'
```

3. **Create a tweet:**
```bash
curl -X POST http://localhost:8081/api/tweets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"content":"Hello, world! This is my first tweet."}'
```

4. **Add a comment:**
```bash
curl -X POST http://localhost:8081/api/tweets/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"content":"Great tweet!"}'
```

5. **Like a tweet:**
```bash
curl -X POST http://localhost:8081/api/tweets/1/like \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `application.yml`
   - Verify databases and users exist

2. **Port Already in Use**
   - Change the port in `application.yml` or stop the conflicting service

3. **JWT Token Issues**
   - Ensure JWT secret is at least 32 characters long
   - Check token expiration settings
   - Verify JWT secret matches between services

4. **Service Communication**
   - Ensure both services are running
   - Check that JWT secrets are identical
   - Verify CORS configuration

### Logs

Enable debug logging by adding to `application.yml`:
```yaml
logging:
  level:
    com.pulse.auth: DEBUG
    com.pulse.tweet: DEBUG
    org.springframework.security: DEBUG
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


