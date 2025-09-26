#!/bin/bash

# Simple Pulse Microservices Stop Script

echo "🛑 Stopping Pulse Microservices..."

# Stop services by PID if files exist
if [ -f "logs/user-service.pid" ]; then
    USER_PID=$(cat logs/user-service.pid)
    if ps -p $USER_PID > /dev/null 2>&1; then
        echo "   Stopping User Service (PID: $USER_PID)..."
        kill $USER_PID
        sleep 2
        kill -9 $USER_PID 2>/dev/null || true
    fi
    rm -f logs/user-service.pid
fi

if [ -f "logs/post-service.pid" ]; then
    POST_PID=$(cat logs/post-service.pid)
    if ps -p $POST_PID > /dev/null 2>&1; then
        echo "   Stopping Post Service (PID: $POST_PID)..."
        kill $POST_PID
        sleep 2
        kill -9 $POST_PID 2>/dev/null || true
    fi
    rm -f logs/post-service.pid
fi

# Also kill any processes on our ports
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped!"
echo ""
echo "💡 To start services again: ./start-services.sh"
