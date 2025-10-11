#!/bin/bash

# Restart All Microservices
# This script restarts all services in Docker

echo "=== Restarting All Services ==="
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

# List services
echo "Services to restart:"
docker-compose -f $COMPOSE_FILE config --services
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

echo "🔄 Restarting all services..."
docker-compose -f $COMPOSE_FILE restart

echo ""
echo "✅ All services restarted successfully!"
echo ""
echo "View logs with:"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "Check status with:"
echo "  docker-compose -f $COMPOSE_FILE ps"

