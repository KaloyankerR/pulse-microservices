#!/bin/bash
# Rebuild and restart social service in Docker

set -e

echo "🐳 Rebuilding Social Service Docker container..."

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker-compose stop social-service || true
docker-compose rm -f social-service || true

# Remove old image
echo "🗑️  Removing old image..."
docker rmi pulse-microservices-social-service || true

# Rebuild
echo "🔨 Building new image..."
docker-compose build social-service

# Start service
echo "🚀 Starting service..."
docker-compose up -d social-service

# Show logs
echo "📋 Showing logs (Ctrl+C to exit)..."
docker-compose logs -f social-service

