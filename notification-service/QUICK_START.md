# Notification Service - Quick Start Guide

Get the Pulse Notification Service up and running in minutes!

## 🚀 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **MongoDB 5.0+** running
- **Redis 6.0+** running  
- **RabbitMQ 3.8+** running

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd notification-service
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
```

Edit `.env` file with your settings:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/pulse_notifications

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Start the Service
```bash
npm run dev
```

Service will start on `http://localhost:8086` 🎉

## 🔍 Verify Installation

### Health Check
```bash
curl http://localhost:8086/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "pulse-notification-service",
    "version": "1.0.0"
  }
}
```

### API Documentation
Visit `http://localhost:8086/api-docs` for interactive API documentation.

## 🧪 Test the API

### 1. Get a JWT Token
You'll need a valid JWT token from the User Service for authentication.

### 2. Create a Test Notification
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "user123",
    "type": "SYSTEM",
    "title": "Welcome!",
    "message": "Welcome to Pulse!"
  }' \
  http://localhost:8086/api/notifications
```

### 3. Get Notifications
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8086/api/notifications
```

## 🐳 Docker Quick Start

### Build and Run
```bash
# Build image
docker build -t pulse-notification-service .

# Run container
docker run -p 8086:8086 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/pulse_notifications \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e RABBITMQ_URL=amqp://host.docker.internal:5672 \
  pulse-notification-service
```

## 🔧 Common Issues

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/pulse_notifications
```

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Should return "PONG"
```

### RabbitMQ Connection Failed
```bash
# Check if RabbitMQ is running
curl http://localhost:15672

# Default credentials: guest/guest
```

### Port Already in Use
```bash
# Change port in .env
PORT=8087

# Or kill process using port 8086
lsof -ti:8086 | xargs kill -9
```

## 📊 Monitor the Service

### Health Endpoints
- **Health Check**: `GET /health`
- **Readiness**: `GET /ready`
- **Metrics**: `GET /metrics`

### Logs
```bash
# View logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

## 🧪 Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🔗 Integration

### With Other Services

The notification service integrates with:

- **User Service**: User authentication and profile data
- **Post Service**: Post-related notifications (likes, comments)
- **Event Service**: Event-related notifications (RSVPs, invites)
- **Social Service**: Social notifications (follows, blocks)
- **Messaging Service**: Message notifications

### Event Consumption

The service automatically consumes events from RabbitMQ:

- `user.followed` → Creates follow notification
- `post.liked` → Creates like notification  
- `comment.created` → Creates comment notification
- `message.sent` → Creates message notification
- And many more...

## 📚 Next Steps

1. **Read the full documentation**: [README.md](README.md)
2. **Explore the API**: Visit `/api-docs`
3. **Set up monitoring**: Configure Prometheus metrics
4. **Customize preferences**: Implement notification preferences
5. **Scale up**: Deploy with Docker/Kubernetes

## 🆘 Need Help?

- **Documentation**: [README.md](README.md)
- **API Docs**: `http://localhost:8086/api-docs`
- **Issues**: Create a GitHub issue
- **Support**: Contact the development team

---

**Happy coding! 🚀**
