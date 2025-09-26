#!/bin/bash

# Quick test script for Swagger documentation access through Kong Gateway

echo "🔍 Testing Swagger Documentation Access"
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

# Test 1: Check if Kong is running
print_status "Checking Kong Gateway status..."
if curl -s -f "http://localhost:8001/status" > /dev/null; then
    print_success "Kong Gateway is running"
else
    print_error "Kong Gateway is not running. Please start services first."
    exit 1
fi

# Test 2: Test Swagger access without trailing slash
print_status "Testing Swagger access at /api-docs..."
response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api-docs")
if [ "$response_code" = "301" ]; then
    print_success "Swagger redirect working (HTTP $response_code)"
    print_status "Redirecting to /api-docs/ as expected"
elif [ "$response_code" = "200" ]; then
    print_success "Swagger accessible directly (HTTP $response_code)"
else
    print_error "Unexpected response code: $response_code"
fi

# Test 3: Test Swagger access with trailing slash
print_status "Testing Swagger access at /api-docs/..."
response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api-docs/")
if [ "$response_code" = "200" ]; then
    print_success "Swagger UI accessible (HTTP $response_code)"
else
    print_error "Swagger UI not accessible (HTTP $response_code)"
    exit 1
fi

# Test 4: Check if Swagger UI content is loading
print_status "Checking Swagger UI content..."
if curl -s "http://localhost:8000/api-docs/" | grep -q "Pulse User Service API"; then
    print_success "Swagger UI content is loading correctly"
else
    print_error "Swagger UI content not loading properly"
fi

# Test 5: Check Swagger UI title
print_status "Checking Swagger UI title..."
title=$(curl -s "http://localhost:8000/api-docs/" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
if [ "$title" = "Pulse User Service API" ]; then
    print_success "Swagger UI title is correct: $title"
else
    print_warning "Swagger UI title: $title"
fi

echo ""
echo "======================================="
print_success "Swagger Documentation Test Complete!"
echo ""
print_status "Access URLs:"
echo "  • http://localhost:8000/api-docs (redirects to /api-docs/)"
echo "  • http://localhost:8000/api-docs/ (direct access)"
echo ""
print_status "You can now:"
echo "  1. Open http://localhost:8000/api-docs/ in your browser"
echo "  2. Explore the API documentation"
echo "  3. Test API endpoints directly from Swagger UI"
echo "  4. Use the 'Try it out' feature for each endpoint"

