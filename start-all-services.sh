#!/bin/bash

# Pulse Microservices Startup Script
# This script starts all services (User Service + Post Service) using Docker Compose

set -e

echo "🚀 Starting Pulse Microservices Platform..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Use docker-compose or docker compose based on what's available
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

echo "✅ Using: $COMPOSE_CMD"

# Create the pulse-network if it doesn't exist
echo "🌐 Creating network..."
docker network create pulse-network 2>/dev/null || echo "Network already exists"

# Navigate to user-service directory
cd user-service

echo "🔨 Building and starting all services..."
echo "   This may take a few minutes on first run..."

# Build and start all services
$COMPOSE_CMD up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for services to be healthy
echo "   - Waiting for User Service database..."
timeout 60 bash -c 'until docker exec pulse-users-db pg_isready -U pulse_user -d pulse_users; do sleep 2; done'

echo "   - Waiting for Post Service database..."
timeout 60 bash -c 'until docker exec pulse-posts-db pg_isready -U pulse_user -d pulse_posts_service_db; do sleep 2; done'

echo "   - Waiting for Redis..."
timeout 60 bash -c 'until docker exec pulse-users-redis redis-cli ping; do sleep 2; done'

echo "   - Waiting for User Service..."
timeout 120 bash -c 'until curl -f http://localhost:8080/health &> /dev/null; do sleep 5; done'

echo "   - Waiting for Post Service..."
timeout 120 bash -c 'until curl -f http://localhost:8082/actuator/health &> /dev/null; do sleep 5; done'

echo ""
echo "🎉 All services are now running!"
echo ""
echo "📋 Service URLs:"
echo "   👤 User Service:        http://localhost:8080"
echo "   📝 Post Service:        http://localhost:8082"
echo "   📚 Post Service API:    http://localhost:8082/swagger-ui.html"
echo "   🏥 User Service Health: http://localhost:8080/health"
echo "   🏥 Post Service Health: http://localhost:8082/actuator/health"
echo ""
echo "🗄️  Database Connections:"
echo "   👤 User Service DB:     localhost:5432 (pulse_users)"
echo "   📝 Post Service DB:     localhost:5433 (pulse_posts_service_db)"
echo "   🔴 Redis:               localhost:6379"
echo ""
echo "🔧 Management Commands:"
echo "   📊 View logs:           $COMPOSE_CMD logs -f [service-name]"
echo "   🛑 Stop all services:   $COMPOSE_CMD down"
echo "   🔄 Restart service:     $COMPOSE_CMD restart [service-name]"
echo "   📈 Service status:      $COMPOSE_CMD ps"
echo ""
echo "🧪 Test the integration:"
echo "   1. Get a JWT token from User Service"
echo "   2. Use it to create a post:"
echo "      curl -X POST http://localhost:8082/api/posts \\"
echo "        -H 'Authorization: Bearer <your-jwt-token>' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"content\": \"Hello from integrated services!\"}'"
echo ""
echo "Press Ctrl+C to stop all services"

# Show logs from all services
$COMPOSE_CMD logs -f
