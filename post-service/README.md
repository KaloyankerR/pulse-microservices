# Post Service

A comprehensive content management microservice for the Pulse social media platform, built with Spring Boot and designed following Google's architectural best practices.

## Overview

The Post Service handles all content creation and management including:
- Create/edit/delete posts
- Manage post metadata (text, images, videos)
- Content validation and processing
- Post search and filtering
- Content moderation
- Comments and likes management

## Technology Stack

- **Java 17** - Modern Java features and performance
- **Spring Boot 3.2.0** - Rapid application development framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Data persistence layer
- **PostgreSQL** - Primary database
- **Spring Cloud OpenFeign** - Service-to-service communication
- **Swagger/OpenAPI 3** - API documentation
- **Docker** - Containerization
- **Maven** - Dependency management

## Architecture

### Service Integration

The Post Service integrates with the User Service using Feign Client for:
- User authentication and authorization
- User profile information retrieval
- User validation and status checking

### Database Design

- **Posts Table**: Core post data with metadata
- **Comments Table**: Nested comment system with replies
- **Likes Table**: Post and comment likes with constraints
- **Optimized Indexes**: For performance on common queries

### Security

- JWT-based authentication
- Role-based access control
- Content validation and sanitization
- CORS configuration for cross-origin requests

## API Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts/{id}` | Get post by ID |
| GET | `/api/posts/author/{authorId}` | Get posts by author |
| GET | `/api/posts/feed` | Get feed posts (following users) |
| GET | `/api/posts/search` | Search posts by content |
| GET | `/api/posts/trending` | Get trending posts |
| PUT | `/api/posts/{id}` | Update post content |
| DELETE | `/api/posts/{id}` | Delete post |

### Authentication

All API endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

## Configuration

### Application Properties

```yaml
server:
  port: 8082

spring:
  application:
    name: post-service
  
  datasource:
    url: jdbc:postgresql://localhost:5432/pulse_posts_service_db
    username: pulse_user
    password: pulse_password

# JWT Configuration
jwt:
  secret: mySecretKey123456789012345678901234567890
  expiration: 86400000 # 24 hours

# User Service Integration
user-service:
  base-url: http://localhost:3000
  timeout: 5000
  retry-attempts: 3

# Content Validation
content:
  max-post-length: 2000
  max-comment-length: 500
  max-image-size-mb: 10
  max-video-size-mb: 100
  allowed-image-types: jpg,jpeg,png,gif,webp
  allowed-video-types: mp4,webm,mov
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- PostgreSQL 13 or higher
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd post-service
   ```

2. **Set up the database**
   ```bash
   # Create database
   createdb pulse_posts_service_db
   
   # Run initialization script
   psql -d pulse_posts_service_db -f init.sql
   ```

3. **Configure environment**
   ```bash
   # Copy and modify application properties
   cp src/main/resources/application.yml.example src/main/resources/application.yml
   ```

4. **Build and run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t pulse-post-service .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the service**
   - API: http://localhost:8082
   - Swagger UI: http://localhost:8082/swagger-ui.html
   - Health Check: http://localhost:8082/actuator/health

## Database Schema

### Posts Table
```sql
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[],
    video_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id),
    author_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES comments(id),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Likes Table
```sql
CREATE TABLE likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);
```

## Content Validation

The service includes comprehensive content validation:

- **Length Limits**: Posts (2000 chars), Comments (500 chars)
- **Media Validation**: Image/video URL validation and type checking
- **Security**: HTML escaping and XSS prevention
- **Moderation**: Inappropriate content detection
- **Hashtags/Mentions**: Automatic extraction and processing

## Performance Optimizations

- **Database Indexes**: Optimized for common query patterns
- **Caching**: User information caching with Spring Cache
- **Pagination**: Efficient pagination for large datasets
- **Async Operations**: Non-blocking user service calls
- **Connection Pooling**: Optimized database connections

## Monitoring and Observability

- **Health Checks**: Spring Actuator endpoints
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logging with SLF4J
- **Tracing**: Request tracing capabilities

## Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Run with test coverage
mvn jacoco:report
```

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8082/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8082/v3/api-docs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the Pulse Team at team@pulse.com
- Check the documentation at https://docs.pulse.com

---

**Built with ❤️ by the Pulse Team**
