# Pulse User Service

A comprehensive Node.js microservice for user management in the Pulse social media platform. This service handles user authentication, profile management, and social relationships (following/followers) as part of a larger microservices architecture.

## 🚀 Features

- **User Authentication**: JWT-based authentication with email/password login
- **User Management**: Complete CRUD operations for user profiles
- **Social Features**: Follow/unfollow functionality with relationship tracking
- **Admin Panel**: Administrative endpoints for user management
- **Security**: Password hashing, rate limiting, input validation
- **Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Testing**: Full test coverage with Jest and Supertest
- **Docker Support**: Containerized deployment with Docker Compose
- **Database**: PostgreSQL with Prisma ORM

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd user-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=8080
   DATABASE_URL="postgresql://username:password@localhost:5432/pulse_user_service_db"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=http://localhost:3000
   ADMIN_EMAIL=admin@pulse.com
   ADMIN_PASSWORD=admin123
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:push
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   # Start all services (PostgreSQL + User Service)
   docker-compose up -d
   
   # For development with hot reload
   docker-compose --profile dev up -d
   ```

2. **Manual Docker build**
   ```bash
   # Build the image
   docker build -t pulse-user-service .
   
   # Run the container
   docker run -p 8080:8080 --env-file .env pulse-user-service
   ```

## 📚 API Documentation

Once the service is running, you can access the interactive API documentation at:
- **Swagger UI**: http://localhost:8080/api-docs
- **Health Check**: http://localhost:8080/health

### Base URL
```
http://localhost:8080/api/v1
```

## 🔐 Authentication

The service uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. **Register** a new user
2. **Login** to get access and refresh tokens
3. **Use access token** for authenticated requests
4. **Refresh token** when access token expires

## 📖 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh JWT token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/change-password` | Change password | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/{id}` | Get user by ID | Optional |
| PUT | `/users/{id}` | Update user profile | Yes (own profile) |
| DELETE | `/users/{id}` | Delete user account | Yes (own account) |
| GET | `/users/search` | Search users | Optional |
| GET | `/users/{id}/followers` | Get user's followers | No |
| GET | `/users/{id}/following` | Get users being followed | No |

### Social Relationship Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/{id}/follow` | Follow a user | Yes |
| DELETE | `/users/{id}/follow` | Unfollow a user | Yes |
| GET | `/users/{id}/follow-status` | Check follow status | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/users` | List all users (paginated) | Yes (Admin) |
| PUT | `/admin/users/{id}/status` | Update user status | Yes (Admin) |

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
The test suite includes:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Authentication flow tests
- Database operation tests

## 🏗️ Project Structure

```
user-service/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── services/             # Business logic
│   │   ├── authService.js
│   │   └── userService.js
│   ├── middleware/           # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── admin.js
│   ├── utils/               # Utility functions
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   └── logger.js
│   ├── config/              # Configuration
│   │   ├── database.js
│   │   └── swagger.js
│   └── app.js              # Express application
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js             # Database seeding
├── tests/                  # Test files
├── docker/                 # Docker configuration
├── docs/                   # Documentation
└── package.json
```

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id          String     @id @default(uuid())
  email       String     @unique
  username    String     @unique
  password    String     // Hashed password
  displayName String?
  bio         String?
  avatarUrl   String?
  verified    Boolean    @default(false)
  status      UserStatus @default(ACTIVE)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Social relationships
  following   UserFollow[] @relation("UserFollowing")
  followers   UserFollow[] @relation("UserFollowers")
}
```

### UserFollow Model
```prisma
model UserFollow {
  id          String @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  
  follower  User @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Access token expiration | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |
| `ADMIN_EMAIL` | Admin user email | `admin@pulse.com` |
| `ADMIN_PASSWORD` | Admin user password | `admin123` |

## 🚀 Deployment

### Production Deployment

1. **Set production environment variables**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/pulse_user_service_db
   JWT_SECRET=your-production-secret-key
   ```

2. **Build and run with Docker**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Or deploy to cloud platforms**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - Heroku with Docker

### Health Checks

The service includes health check endpoints:
- **Health Check**: `GET /health`
- **Docker Health Check**: Built into the Dockerfile

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable cross-origin policies
- **Helmet**: Security headers middleware
- **SQL Injection Prevention**: Prisma ORM protection

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple levels
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error handling and logging
- **Health Monitoring**: Built-in health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the test files for usage examples

## 🔄 Version History

- **v1.0.0** - Initial release with core user management features
  - User authentication and registration
  - Profile management
  - Social relationships (follow/unfollow)
  - Admin endpoints
  - Comprehensive testing
  - Docker support
  - API documentation

## 📚 Additional Resources

- [API Documentation](http://localhost:8080/api-docs)
- [Postman Collection](docs/postman-collection.json)

---

**Built with ❤️ for the Pulse Social Media Platform**
