# Social Service - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites
```bash
# Ensure you have:
- Node.js 20+
- PostgreSQL 14+
- Redis (optional but recommended)
- RabbitMQ (optional but recommended)
```

### 2. Install Dependencies
```bash
cd social-service
npm install
```

### 3. Setup Environment
```bash
# Copy and configure environment variables
cp env.example .env

# Edit .env with your database credentials
nano .env
```

### 4. Database Setup
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# (Optional) Seed sample data
npm run db:seed
```

### 5. Start the Service
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

### 6. Verify It's Running
```bash
# Health check
curl http://localhost:8085/health

# API documentation
open http://localhost:8085/api-docs
```

## 🐳 Docker Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# From project root
docker-compose up social-service

# Or with all services
docker-compose up
```

### Option 2: Standalone Docker
```bash
cd social-service

# Build image
docker build -t pulse-social-service .

# Run container
docker run -p 8085:8085 \
  -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/pulse_social" \
  -e JWT_SECRET="your-secret-key" \
  pulse-social-service
```

## 🧪 Testing the API

### 1. Get a JWT Token
First, register/login via User Service to get an access token:
```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### 2. Follow a User
```bash
curl -X POST http://localhost:8085/api/v1/social/follow/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Followers
```bash
curl http://localhost:8085/api/v1/social/followers/{userId}
```

### 4. Get Recommendations
```bash
curl http://localhost:8085/api/v1/social/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Social Stats
```bash
curl http://localhost:8085/api/v1/social/stats/{userId}
```

## 📊 Monitor the Service

### Metrics
```bash
curl http://localhost:8085/metrics
```

### Logs
```bash
# Development
tail -f logs/combined.log

# Errors only
tail -f logs/error.log

# Docker
docker logs pulse-social-service -f
```

## 🔧 Common Issues & Solutions

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -h localhost -U pulse_user -d pulse_social

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=8086

# Or stop the process using port 8085
lsof -ti:8085 | xargs kill -9
```

### Prisma Client Not Generated
```bash
# Regenerate Prisma Client
npm run db:generate
```

### Redis/RabbitMQ Connection Issues
These are optional. The service will run without them but with degraded functionality:
- Without Redis: No caching (slower responses)
- Without RabbitMQ: No event publishing (data sync disabled)

## 📖 API Documentation

Interactive API documentation is available at:
- **Local**: http://localhost:8085/api-docs
- **Via Gateway**: http://localhost:8000/api/v1/social (access through Kong)

## 🔍 Development Tips

### Watch Mode
```bash
npm run dev
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

### Format Code
```bash
npm run format
```

### Run Tests
```bash
npm test
npm run test:coverage
```

### Database Operations
```bash
# Create new migration
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset

# View database in Prisma Studio
npx prisma studio
```

## 🌐 Integration with Other Services

### User Service Integration
The social service automatically syncs user data via RabbitMQ events:
- Listens for `user.created`, `user.updated`, `user.deleted`
- Maintains user cache for fast lookups

### API Gateway (Kong)
Routes are configured in `config/kong.yml`:
- Direct: http://localhost:8085/api/v1/social/*
- Gateway: http://localhost:8000/api/v1/social/*

## 📞 Need Help?

1. Check the full README.md for detailed documentation
2. Review IMPLEMENTATION_SUMMARY.md for architecture details
3. View API docs at /api-docs for endpoint details
4. Check logs in logs/ directory for errors

## ✅ Verification Checklist

- [ ] Service starts without errors
- [ ] Health check returns 200
- [ ] Database connection successful
- [ ] Can view Swagger documentation
- [ ] Follow/unfollow operations work
- [ ] Recommendations endpoint returns data
- [ ] Metrics endpoint accessible

---

**Happy Coding! 🎉**

