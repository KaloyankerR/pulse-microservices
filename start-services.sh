#!/bin/bash

# Simple Pulse Microservices Startup Script
# This script starts both services with minimal complexity

set -e

echo "🚀 Starting Pulse Microservices..."

# Kill any existing services on our ports
echo "🔍 Cleaning up existing services..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
sleep 2

# Create logs directory
mkdir -p logs

# Check if .env exists
if [ ! -f "user-service/.env" ]; then
    echo "📝 Creating .env file..."
    cp user-service/env.example user-service/.env
fi

# Start User Service
echo "🚀 Starting User Service..."
cd user-service
npm start > ../logs/user-service.log 2>&1 &
USER_PID=$!
echo $USER_PID > ../logs/user-service.pid
cd ..
echo "   User Service started with PID: $USER_PID"

# Start Post Service
echo "🚀 Starting Post Service..."
cd post-service
mvn spring-boot:run > ../logs/post-service.log 2>&1 &
POST_PID=$!
echo $POST_PID > ../logs/post-service.pid
cd ..
echo "   Post Service started with PID: $POST_PID"

echo ""
echo "⏳ Waiting for services to start..."

# Wait for services to be ready
for i in {1..30}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ User Service is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ User Service failed to start"
        exit 1
    fi
    sleep 2
done

for i in {1..30}; do
    if curl -s http://localhost:8082/actuator/health > /dev/null 2>&1; then
        echo "✅ Post Service is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Post Service failed to start"
        exit 1
    fi
    sleep 2
done

echo ""
echo "🎉 All services are running!"
echo ""
echo "📋 Service URLs:"
echo "   👤 User Service:        http://localhost:8080"
echo "   📝 Post Service:        http://localhost:8082"
echo "   📚 User Service API:    http://localhost:8080/api-docs"
echo "   📚 Post Service API:    http://localhost:8082/swagger-ui.html"
echo ""
echo "📊 Logs:"
echo "   👤 User Service:        tail -f logs/user-service.log"
echo "   📝 Post Service:        tail -f logs/post-service.log"
echo ""
echo "🛑 To stop services:"
echo "   ./stop-services.sh"
echo ""
echo "🧪 Test login API:"
echo "   curl -X POST http://localhost:8080/api/v1/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"password\":\"Password123!\"}'"
