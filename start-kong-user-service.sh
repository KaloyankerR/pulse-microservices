#!/bin/bash

# Startup script for Kong Gateway + User Service
# This script starts the Kong Gateway with the user-service

echo "🚀 Starting Kong Gateway + User Service"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Create the external network if it doesn't exist
print_status "Creating pulse-network if it doesn't exist..."
docker network create pulse-network 2>/dev/null || print_status "Network pulse-network already exists"

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait a moment for services to start
print_status "Waiting for services to initialize..."
sleep 10

# Check if services are running
print_status "Checking service status..."
docker-compose ps

echo ""
print_success "Services started successfully!"
echo ""
print_status "Access Points:"
echo "  • Kong Proxy: http://localhost:8000"
echo "  • Kong Admin: http://localhost:8001"
echo "  • User Service Direct: http://localhost:8080"
echo ""
print_status "To test the integration, run:"
echo "  ./test-kong-user-service.sh"
echo ""
print_status "To view logs:"
echo "  docker-compose logs -f"
echo ""
print_status "To stop services:"
echo "  docker-compose down"
