# Pulse Microservices

A multi-service monorepo containing microservices for the Pulse application.

## Services

### Auth Service
Authentication and authorization microservice that handles user registration, login, and JWT token management.

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- PostgreSQL 12 or higher
- Docker (optional, for containerized PostgreSQL)

## Quick Start

### 1. Database Setup

#### Option A: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database and user:
```sql
CREATE DATABASE pulse_auth;
CREATE USER pulse_user WITH PASSWORD 'pulse_password';
GRANT ALL PRIVILEGES ON DATABASE pulse_auth TO pulse_user;
```

#### Option B: Docker PostgreSQL
```bash
docker run --name pulse-postgres \
  -e POSTGRES_DB=pulse_auth \
  -e POSTGRES_USER=pulse_user \
  -e POSTGRES_PASSWORD=pulse_password \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Build and Run

```bash
# Build the entire project
mvn clean install

# Run the auth service
cd auth-service
mvn spring-boot:run
```

The auth service will be available at `http://localhost:8080`

### 3. API Documentation

Once the service is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

## API Endpoints

### Authentication Endpoints

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

#### Health Check
```http
GET /api/auth/health
```

## Configuration

### Environment Variables

You can override the default configuration using environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pulse_auth
export SPRING_DATASOURCE_USERNAME=pulse_user
export SPRING_DATASOURCE_PASSWORD=pulse_password
export JWT_SECRET=your-secret-key-here
export JWT_EXPIRATION=86400000
```

### Application Properties

The main configuration is in `auth-service/src/main/resources/application.yml`:

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

## Security

- **Password Hashing**: Uses BCrypt for secure password storage
- **JWT Authentication**: Stateless authentication with configurable expiration
- **CORS**: Configured to allow cross-origin requests
- **Input Validation**: All endpoints validate input data

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
└── README.md
```

### Adding New Services

To add a new microservice to this monorepo:

1. Create a new module directory
2. Add the module to the parent `pom.xml`
3. Create a `pom.xml` for the new service
4. Follow the same package structure as the auth service

### Testing

```bash
# Run tests for all services
mvn test

# Run tests for specific service
cd auth-service
mvn test
```

## Docker Support

### Build Docker Image
```bash
cd auth-service
docker build -t pulse-auth-service .
```

### Run with Docker Compose
Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pulse_auth
      POSTGRES_USER: pulse_user
      POSTGRES_PASSWORD: pulse_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  auth-service:
    build: ./auth-service
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/pulse_auth
      SPRING_DATASOURCE_USERNAME: pulse_user
      SPRING_DATASOURCE_PASSWORD: pulse_password
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `application.yml`
   - Verify database and user exist

2. **Port Already in Use**
   - Change the port in `application.yml` or stop the conflicting service

3. **JWT Token Issues**
   - Ensure JWT secret is at least 32 characters long
   - Check token expiration settings

### Logs

Enable debug logging by adding to `application.yml`:
```yaml
logging:
  level:
    com.pulse.auth: DEBUG
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
