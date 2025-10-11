#!/bin/bash

# Restart Web Client Container
# This script restarts the web-client service in Docker

echo "=== Restarting Web Client Container ==="
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not running"
    exit 1
fi

# Determine which compose file to use
if [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
elif [ -f "docker-compose.dockerhub.yml" ]; then
    COMPOSE_FILE="docker-compose.dockerhub.yml"
else
    echo "❌ No docker-compose file found"
    exit 1
fi

echo "Using compose file: $COMPOSE_FILE"
echo ""

# Check if web-client service exists
if docker-compose -f $COMPOSE_FILE ps | grep -q "web-client"; then
    echo "📦 Stopping web-client container..."
    docker-compose -f $COMPOSE_FILE stop web-client
    
    echo "🗑️  Removing web-client container..."
    docker-compose -f $COMPOSE_FILE rm -f web-client
    
    echo "🚀 Starting web-client container..."
    docker-compose -f $COMPOSE_FILE up -d web-client
    
    echo ""
    echo "✅ Web client container restarted successfully!"
    echo ""
    echo "View logs with:"
    echo "  docker-compose -f $COMPOSE_FILE logs -f web-client"
    echo ""
    echo "Check status with:"
    echo "  docker-compose -f $COMPOSE_FILE ps web-client"
else
    echo "⚠️  web-client service not found in $COMPOSE_FILE"
    echo ""
    echo "Available services:"
    docker-compose -f $COMPOSE_FILE config --services
    exit 1
fi

