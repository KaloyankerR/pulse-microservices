# Messaging Service - Deployment Guide

## 🚀 Quick Start

### Local Development

1. **Prerequisites:**
   - Go 1.21+
   - MongoDB running on `localhost:27017`
   - Redis running on `localhost:6379`
   - RabbitMQ running on `localhost:5672`

2. **Setup:**
```bash
cd messaging-service
cp env.example .env
# Edit .env with your configuration
go mod download
go run cmd/main.go
```

3. **Verify:**
```bash
curl http://localhost:8084/health
```

### Docker Development

1. **Build and run:**
```bash
docker build -t messaging-service .
docker run -p 8084:8084 --env-file .env messaging-service
```

### Docker Compose (Recommended)

1. **Add to your main docker-compose.yml:**
```yaml
services:
  messaging-service:
    build: ./messaging-service
    ports:
      - "8084:8084"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
      - rabbitmq
```

2. **Run:**
```bash
docker-compose up -d messaging-service
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Server
PORT=8084
ENVIRONMENT=production

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_NAME=messaging_db

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# JWT
JWT_SECRET=your-super-secret-key-change-me
```

## 🧪 Testing

### Run all tests:
```bash
make test
```

### With coverage:
```bash
make test-coverage
```

### Run specific test:
```bash
go test ./tests -run TestMessageService_CreateMessage -v
```

## 📊 Monitoring

### Health Checks
- Basic: `GET /health`
- Detailed: `GET /ready` (checks MongoDB, Redis)

### Metrics
- Prometheus metrics: `GET /metrics`
- WebSocket connections: `websocket_connections_active`
- Messages processed: `messages_processed_total`
- HTTP metrics: `http_requests_total`, `http_request_duration_seconds`

### Logging
- Production: JSON format
- Development: Pretty console format
- Levels: DEBUG, INFO, WARN, ERROR

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] MongoDB authentication enabled
- [ ] Redis protected with password
- [ ] RabbitMQ secured with proper credentials
- [ ] CORS configured for production domains
- [ ] HTTPS/TLS enabled in production
- [ ] Rate limiting configured
- [ ] WebSocket connection limits set

## 🌐 API Testing

### Using curl:

```bash
# Get JWT token from user-service first
TOKEN="your-jwt-token"

# Get conversations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8084/api/messages/conversations

# Send a message
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"...","content":"Hello!"}' \
  http://localhost:8084/api/messages

# Get messages in conversation
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8084/api/messages/conversations/{id}/messages
```

### WebSocket Connection:

```javascript
const ws = new WebSocket('ws://localhost:8084/ws?token=' + jwtToken);

ws.onopen = () => {
  console.log('Connected');
  
  // Send typing indicator
  ws.send(JSON.stringify({
    type: 'typing',
    payload: {
      conversation_id: 'conv-id',
      is_typing: true
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data.payload);
};
```

## 🐛 Troubleshooting

### Service won't start

**Check logs:**
```bash
docker logs messaging-service
```

**Common issues:**
- MongoDB not accessible → Check `MONGODB_URL`
- Redis connection failed → Verify Redis is running
- RabbitMQ unavailable → Check `RABBITMQ_URL`
- Port already in use → Change `PORT` env var

### WebSocket not connecting

- Verify JWT token is valid
- Check token is passed in query: `?token=xxx`
- Ensure CORS allows WebSocket upgrade
- Check firewall/proxy allows WebSocket

### Messages not being delivered

- Check RabbitMQ is running and accessible
- Verify exchange `messaging_events` exists
- Check service logs for publish errors
- Verify Redis is working for presence

### High memory usage

- Check active WebSocket connections
- Review MongoDB query performance
- Monitor goroutine count
- Check for connection leaks

## 📈 Performance Tuning

### MongoDB Optimization
- Indexes created automatically on startup
- Connection pool: 10-50 connections
- Query timeout: 10 seconds

### Redis Optimization
- Connection pool: 50 connections
- Presence TTL: 5 minutes
- Used for fast lookups only

### WebSocket Optimization
- Connection limit: Set in reverse proxy
- Message buffer: 256 per connection
- Ping interval: 30 seconds
- Write deadline: 10 seconds

## 🔄 Scaling

### Horizontal Scaling
- Service is stateless (except WebSocket connections)
- Use sticky sessions for WebSocket (or Redis pub/sub)
- MongoDB replica set for high availability
- Redis Sentinel for failover

### Load Balancing
```nginx
upstream messaging {
  ip_hash; # Sticky sessions for WebSocket
  server messaging-1:8084;
  server messaging-2:8084;
  server messaging-3:8084;
}
```

## 🔐 Production Checklist

- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Log aggregation configured
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting enabled
- [ ] Health checks configured in load balancer
- [ ] Auto-scaling rules defined
- [ ] Disaster recovery plan documented

## 📦 CI/CD Pipeline

### GitHub Actions Example:

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - run: go test ./... -v
      - run: go build ./cmd/main.go
```

## 🆘 Support

For issues:
1. Check logs: `docker logs messaging-service`
2. Verify health: `curl localhost:8084/health`
3. Check dependencies: MongoDB, Redis, RabbitMQ
4. Review configuration in `.env`
5. Consult main platform documentation



