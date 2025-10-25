# Pulse Platform - AI Service Creation Guide

## Project Overview
**Architecture**: Microservices (Go + Node.js)  
**Target**: 1000 concurrent users, <200ms response, 99.9% uptime  
**Stack**: PostgreSQL, MongoDB, Redis, RabbitMQ, Docker, Kubernetes

---

## Service Directory Structure

### Go Services
```
service-name/
├── cmd/main.go
├── internal/
│   ├── handlers/
│   ├── models/
│   ├── repository/
│   └── service/
├── Dockerfile
├── go.mod
└── README.md
```

### Node.js Services
```
service-name/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/
├── Dockerfile
├── package.json
└── README.md
```

---

## Required Dependencies

### Go
```go
github.com/gin-gonic/gin
github.com/golang-jwt/jwt/v5
gorm.io/gorm
gorm.io/driver/postgres
go.mongodb.org/mongo-driver
github.com/redis/go-redis/v9
github.com/rabbitmq/amqp091-go
github.com/prometheus/client_golang
```

### Node.js
```json
express, mongoose, redis, amqplib, jsonwebtoken, 
bcryptjs, dotenv, winston, prom-client, joi
```

---

## Core Features (All Services)

✅ Environment-based configuration  
✅ Database connection with pooling  
✅ JWT authentication middleware  
✅ RabbitMQ event pub/sub  
✅ Redis caching  
✅ Error handling & structured logging  
✅ Prometheus metrics (/metrics)  
✅ Health checks (/health, /ready)  
✅ Input validation  
✅ Unit & integration tests (80%+ coverage)

---

## Service Specifications

### 1. User Service (Node.js) - Port 8081
**Database**: PostgreSQL

**Endpoints**:
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
GET    /api/users/me
PUT    /api/users/me
DELETE /api/users/me
GET    /api/users/:id
```

**Events Published**: `user.registered`, `user.updated`, `user.deleted`

---

### 2. Post Service (Go) - Port 8082
**Database**: MongoDB

**Endpoints**:
```
POST   /api/posts
GET    /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments
```

**Events Published**: `post.created`, `post.liked`, `comment.created`  
**Events Consumed**: `user.deleted`

---

### 3. Event Service (Go) - Port 8083
**Database**: PostgreSQL

**Endpoints**:
```
POST   /api/events
GET    /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
POST   /api/events/:id/rsvp
GET    /api/events/:id/attendees
```

**Events Published**: `event.created`, `event.rsvp.added`  
**Events Consumed**: `user.deleted`

---

### 4. Messaging Service (Go) - Port 8084
**Database**: Redis + MongoDB

**Endpoints**:
```
POST   /api/messages
GET    /api/messages/conversations
GET    /api/messages/conversations/:id
PUT    /api/messages/:id/read
POST   /api/messages/group
```

**WebSocket**: Real-time messaging, typing indicators, presence  
**Events Published**: `message.sent`, `message.read`, `user.online`

---

### 5. Social Service (Node.js) - Port 8085
**Database**: PostgreSQL

**Endpoints**:
```
POST   /api/social/follow/:userId
DELETE /api/social/follow/:userId
GET    /api/social/followers/:userId
GET    /api/social/following/:userId
POST   /api/social/block/:userId
GET    /api/social/recommendations
```

**Events Published**: `user.followed`, `user.blocked`  
**Events Consumed**: `user.deleted`

---

### 6. Notification Service (Node.js) - Port 8086
**Database**: MongoDB

**Endpoints**:
```
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
GET    /api/notifications/preferences
PUT    /api/notifications/preferences
```

**Events Consumed**: All platform events for notification triggers

---

## Docker Templates

### Go Dockerfile
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

### Node.js Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "src/index.js"]
```

---

## Environment Variables Template
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=servicedb
DB_USER=user
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=your-secret-key
PORT=8080
```

---

## Quality Checklist

- [ ] All endpoints implemented
- [ ] Database integration working
- [ ] RabbitMQ events configured
- [ ] Redis caching implemented
- [ ] JWT auth middleware
- [ ] Input validation
- [ ] Error handling
- [ ] Structured logging
- [ ] Metrics endpoint
- [ ] Health checks
- [ ] Tests (80%+ coverage)
- [ ] Dockerfile optimized
- [ ] README complete

---

## Best Practices

**Security**: Use env vars, validate inputs, hash passwords (bcrypt), JWT expiration  
**Performance**: Database indexes, connection pooling, caching, pagination  
**Code**: Follow style guides, DRY principle, meaningful names, proper error handling