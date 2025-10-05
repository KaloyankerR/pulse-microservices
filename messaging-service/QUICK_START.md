# Quick Start Guide - Messaging Service

## 🚀 Run in 3 Steps

### 1. Set Up Environment
```bash
cd messaging-service
cp env.example .env
```

Edit `.env` if needed (defaults work for local development).

### 2. Start Dependencies
```bash
# Using Docker Compose (easiest)
docker-compose up -d mongodb redis rabbitmq

# OR install locally:
# - MongoDB 7.0+
# - Redis 7.0+
# - RabbitMQ 3.12+
```

### 3. Run Service
```bash
# Option A: Direct Go
go run cmd/main.go

# Option B: Using Make
make run

# Option C: Docker
docker build -t messaging-service .
docker run -p 8084:8084 --env-file .env messaging-service
```

**Service is ready!** → http://localhost:8084/health

## 📝 Quick Test

### Get JWT Token
First, get a JWT token from the user-service (port 8081):
```bash
# Register a user
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

# Login to get token
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Save the JWT token from the response.

### Test Messaging API
```bash
TOKEN="your-jwt-token-here"

# 1. Get your conversations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8084/api/messages/conversations

# 2. Create a group conversation
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","participants":["user-id-1","user-id-2"]}' \
  http://localhost:8084/api/messages/group

# 3. Send a message (use conversation ID from step 2)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"<CONVERSATION_ID>","content":"Hello World!"}' \
  http://localhost:8084/api/messages

# 4. Get messages in conversation
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8084/api/messages/conversations/<CONVERSATION_ID>/messages
```

### Test WebSocket
```javascript
// In browser console or Node.js
const ws = new WebSocket('ws://localhost:8084/ws?token=' + TOKEN);

ws.onopen = () => console.log('Connected!');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Received:', msg.type, msg.payload);
};

// Send typing indicator
ws.send(JSON.stringify({
  type: 'typing',
  payload: {
    conversation_id: 'conversation-id-here',
    is_typing: true
  }
}));
```

## 🔍 Verify Everything Works

### Check Health
```bash
curl http://localhost:8084/health
# Should return: {"status":"healthy","service":"messaging-service",...}
```

### Check Dependencies
```bash
curl http://localhost:8084/ready
# Should show mongodb and redis status
```

### View Metrics
```bash
curl http://localhost:8084/metrics
# Prometheus metrics
```

### Run Tests
```bash
make test
# or
go test ./tests -v
```

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change port in .env
echo "PORT=8085" >> .env
```

**MongoDB connection failed?**
```bash
# Check MongoDB is running
docker ps | grep mongo
# or
mongosh mongodb://localhost:27017
```

**Redis connection failed?**
```bash
# Check Redis is running
docker ps | grep redis
# or
redis-cli ping
```

**RabbitMQ connection failed?**
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq
# Management UI: http://localhost:15672 (guest/guest)
```

## 📚 Next Steps

- Read [README.md](README.md) for complete documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture details

## 🎯 Key Commands

```bash
make help           # Show all available commands
make build          # Build binary
make run            # Run service
make test           # Run tests
make test-coverage  # Generate coverage report
make docker-build   # Build Docker image
make clean          # Clean build artifacts
```

## 💡 Tips

1. **Development:** Use `go run cmd/main.go` for quick iteration
2. **Testing:** Run `go test ./tests -v -run TestName` for specific tests
3. **Debugging:** Set `ENVIRONMENT=development` in `.env` for pretty logs
4. **Monitoring:** Check `/metrics` endpoint for Prometheus metrics
5. **WebSocket:** Use browser DevTools → Network → WS to debug connections

## 🌐 Integration with Other Services

This service needs:
- **User Service** (port 8081) for JWT token generation
- **MongoDB** for message storage
- **Redis** for presence tracking
- **RabbitMQ** for event publishing

Events published:
- `message.sent` → Notification Service
- `message.read` → Analytics
- `user.online/offline` → Presence tracking

Happy messaging! 💬



