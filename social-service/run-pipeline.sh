#!/bin/bash

# Pipeline script for social-service
# Runs all CI/CD jobs locally: build, test, and Docker build
# Exits with error code if any step fails

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

SERVICE="social-service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Track if any step failed
FAILED=0

# ============================================================================
# STAGE 1: BUILD
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STAGE 1: BUILD - $SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_step "Installing Node.js dependencies..."
if npm ci; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    FAILED=1
    exit 1
fi

print_step "Generating Prisma Client..."
if npm run db:generate; then
    print_success "Prisma Client generated"
else
    print_error "Failed to generate Prisma Client"
    FAILED=1
    exit 1
fi

print_step "Building TypeScript..."
if npm run build; then
    print_success "TypeScript build completed"
else
    print_error "TypeScript build failed"
    FAILED=1
    exit 1
fi

echo ""
print_success "Build stage completed successfully"
echo ""

# ============================================================================
# STAGE 2: TEST
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STAGE 2: TEST - $SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Note: Tests require PostgreSQL, Redis, and RabbitMQ"
print_info "Make sure these services are running (e.g., via docker-compose)"
echo ""

# Set test environment variables (matching CI pipeline)
export NODE_ENV=test
export DATABASE_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
export REDIS_URL="${TEST_REDIS_URL:-redis://localhost:6379}"
export RABBITMQ_URL="${TEST_RABBITMQ_URL:-amqp://guest:guest@localhost:5672/}"
export JWT_SECRET="${TEST_JWT_SECRET:-test-secret-key-for-ci}"

print_step "Running tests..."
if npm test; then
    print_success "Tests passed"
else
    print_error "Tests failed"
    FAILED=1
    exit 1
fi

echo ""
print_success "Test stage completed successfully"
echo ""

# ============================================================================
# STAGE 3: DOCKER BUILD
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STAGE 3: DOCKER BUILD - $SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    FAILED=1
    exit 1
fi

# Default image name (can be overridden)
IMAGE_NAME="${DOCKER_IMAGE_NAME:-pulse-social-service}"
IMAGE_TAG="${DOCKER_IMAGE_TAG:-local}"

print_step "Building Docker image: $IMAGE_NAME:$IMAGE_TAG..."
if docker build -t "$IMAGE_NAME:$IMAGE_TAG" .; then
    print_success "Docker image built successfully"
else
    print_error "Docker build failed"
    FAILED=1
    exit 1
fi

print_info "Image: $IMAGE_NAME:$IMAGE_TAG"
print_info "To run: docker run -p 8085:8085 $IMAGE_NAME:$IMAGE_TAG"

echo ""
print_success "Docker build stage completed successfully"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}  ✅ ALL STAGES COMPLETED SUCCESSFULLY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo -e "${RED}  ❌ PIPELINE FAILED${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi

