# 💬 Messaging Service

Real-time messaging microservice for the Pulse platform, built with Go. Supports direct messages, group chats, WebSocket connections, typing indicators, and presence tracking.

## 🚀 Features

- ✅ **Direct & Group Messaging**: One-on-one and group conversations
- ✅ **Real-time WebSocket**: Instant message delivery with WebSocket support
- ✅ **Typing Indicators**: Real-time typing status
- ✅ **User Presence**: Online/offline status tracking
- ✅ **Read Receipts**: Track message read status
- ✅ **Message History**: Paginated message retrieval
- ✅ **Event-Driven**: Publishes events to RabbitMQ
- ✅ **Redis Caching**: Fast presence tracking
- ✅ **Prometheus Metrics**: Monitoring and observability
- ✅ **JWT Authentication**: Secure API access

## 📋 Tech Stack

- **Language**: Go 1.21
- **Web Framework**: Gin
- **Database**: MongoDB
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **WebSocket**: Gorilla WebSocket
- **Logging**: Zap
- **Metrics**: Prometheus

## 🏗️ Architecture

```
messaging-service/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── config/                 # Configuration management
│   │   ├── config.go
│   │   ├── database.go         # MongoDB connection
│   │   ├── redis.go            # Redis connection
│   │   └── rabbitmq.go         # RabbitMQ connection
│   ├── handlers/               # HTTP & WebSocket handlers
│   │   ├── message_handler.go
│   │   ├── conversation_handler.go
│   │   ├── websocket_handler.go
│   │   └── health_handler.go
│   ├── middleware/             # Middleware functions
│   │   ├── auth.go             # JWT authentication
│   │   ├── cors.go             # CORS handling
│   │   └── metrics.go          # Prometheus metrics
│   ├── models/                 # Data models
│   │   ├── message.go
│   │   ├── conversation.go
│   │   ├── user.go
│   │   └── event.go
│   ├── repository/             # Database operations
│   │   ├── message_repository.go
│   │   ├── conversation_repository.go
│   │   ├── user_cache_repository.go
│   │   └── presence_repository.go
│   ├── service/                # Business logic
│   │   ├── message_service.go
│   │   └── conversation_service.go
│   └── utils/                  # Utility functions
│       └── logger.go
├── tests/                      # Tests
├── Dockerfile
├── env.example
├── go.mod
└── README.md
```

## 📡 API Endpoints

### REST API

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Messages

```
POST   /api/messages                           # Send a message
PUT    /api/messages/:id/read                  # Mark message as read
GET    /api/messages/conversations/:id/messages # Get conversation messages
```

#### Conversations

```
GET    /api/messages/conversations             # Get user's conversations
GET    /api/messages/conversations/:id         # Get conversation details
POST   /api/messages/group                     # Create group conversation
```

#### Health & Metrics

```
GET    /health                                 # Health check
GET    /ready                                  # Readiness check
GET    /metrics                                # Prometheus metrics
```

### WebSocket

```
GET    /ws?token=<jwt_token>                   # WebSocket connection
```

#### WebSocket Message Types

**Client → Server:**
```json
{
  "type": "typing",
  "payload": {
    "conversation_id": "...",
    "is_typing": true
  }
}
```

**Server → Client:**
```json
{
  "type": "message",
  "payload": { /* message object */ }
}

{
  "type": "typing",
  "payload": {
    "conversation_id": "...",
    "user_id": "...",
    "is_typing": true
  }
}

{
  "type": "presence",
  "payload": {
    "user_id": "...",
    "status": "online"
  }
}
```

## 🔧 Configuration

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8084` |
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_NAME` | MongoDB database name | `messaging_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://guest:guest@localhost:5672/` |
| `JWT_SECRET` | JWT signing secret | Required |

## 🚀 Getting Started

### Prerequisites

- Go 1.21+
- MongoDB
- Redis
- RabbitMQ

### Installation

1. **Clone and navigate:**
```bash
cd messaging-service
```

2. **Install dependencies:**
```bash
go mod download
```

3. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Run the service:**
```bash
go run cmd/main.go
```

The service will start on port 8084 (or configured port).

### Using Docker

1. **Build image:**
```bash
docker build -t messaging-service .
```

2. **Run container:**
```bash
docker run -p 8084:8084 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e RABBITMQ_URL=amqp://host.docker.internal:5672 \
  -e JWT_SECRET=your-secret \
  messaging-service
```

## 📊 Database Schema

### MongoDB Collections

#### messages
```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: "user-uuid",
  content: "string",
  message_type: "TEXT|SYSTEM",
  mentions: ["user-uuid"],
  created_at: Date,
  delivery_status: {
    read_by: [{ user_id: "uuid", read_at: Date }]
  }
}
```

#### conversations
```javascript
{
  _id: ObjectId,
  type: "DIRECT|GROUP",
  participants: ["user-uuid1", "user-uuid2"],
  name: "string",
  last_message: {
    content: "string",
    sender_id: "user-uuid",
    timestamp: Date
  },
  created_at: Date,
  updated_at: Date
}
```

#### user_cache
```javascript
{
  _id: "user-uuid",
  username: "string",
  display_name: "string",
  avatar_url: "string",
  verified: boolean,
  last_synced: Date
}
```

### Redis Keys

- `presence:<user_id>` - User presence data (hash)
  - `status`: "online" | "offline" | "away"
  - `last_seen`: Unix timestamp
  - `connection_id`: WebSocket connection ID

## 📤 Events Published

The service publishes events to RabbitMQ exchange `messaging_events`:

### message.sent
```json
{
  "type": "message.sent",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "message_id": "...",
    "conversation_id": "...",
    "sender_id": "...",
    "content": "...",
    "participants": ["..."],
    "created_at": "..."
  }
}
```

### message.read
```json
{
  "type": "message.read",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "message_id": "...",
    "user_id": "...",
    "read_at": "..."
  }
}
```

### user.online / user.offline
```json
{
  "type": "user.online",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "user_id": "...",
    "status": "online",
    "timestamp": "..."
  }
}
```

## 🧪 Testing

Run tests:
```bash
go test ./... -v
```

Run tests with coverage:
```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## 📈 Monitoring

### Prometheus Metrics

Available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `websocket_connections_active` - Active WebSocket connections
- `messages_processed_total` - Total messages processed

### Health Checks

- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes MongoDB and Redis status)

## 🔒 Security

- JWT authentication on all API endpoints
- WebSocket authentication via token query parameter
- Input validation on all requests
- CORS configuration
- Secure password handling (delegated to User Service)

## 🎯 Performance

- MongoDB connection pooling (10-50 connections)
- Redis caching for presence tracking
- WebSocket for real-time communication
- Efficient message pagination
- Database indexes on frequently queried fields

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker ps | grep mongo

# Test connection
mongosh mongodb://localhost:27017
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

### WebSocket Connection Issues
- Ensure JWT token is valid
- Check WebSocket URL includes `?token=<jwt>`
- Verify CORS settings
- Check browser console for errors

## 📝 Development

### Code Style
- Follow Go standard formatting (`gofmt`)
- Use meaningful variable names
- Add comments for exported functions
- Write tests for new features

### Adding New Features
1. Update models if needed
2. Add repository methods
3. Implement service logic
4. Create handlers
5. Add routes in main.go
6. Write tests
7. Update documentation

## 📄 License

Part of the Pulse Microservices Platform

## 🤝 Contributing

1. Follow the established code structure
2. Write tests for new features
3. Update documentation
4. Ensure linting passes
5. Test locally before committing

## 📞 Support

For issues and questions, please refer to the main Pulse platform documentation.



