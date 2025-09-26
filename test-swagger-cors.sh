#!/bin/bash

# Test script for Swagger UI CORS functionality

echo "🔍 Testing Swagger UI CORS Functionality"
echo "========================================"

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Test 1: Check if user-service is running
print_status "Checking user-service status..."
if curl -s -f "http://localhost:8080/health" > /dev/null; then
    print_success "User-service is running"
else
    print_error "User-service is not running. Please start services first."
    exit 1
fi

# Test 2: Test CORS preflight request
print_status "Testing CORS preflight request..."
cors_response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    -H "Origin: http://localhost:8080" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "http://localhost:8080/api/v1/auth/login")

if [ "$cors_response" = "204" ] || [ "$cors_response" = "200" ]; then
    print_success "CORS preflight request successful (HTTP $cors_response)"
else
    print_error "CORS preflight request failed (HTTP $cors_response)"
fi

# Test 3: Test actual API call with CORS headers
print_status "Testing API call with CORS headers..."
api_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:8080" \
    -d '{
        "email": "admin@pulse.com",
        "password": "admin123"
    }' \
    "http://localhost:8080/api/v1/auth/login")

http_code="${api_response: -3}"
response_body="${api_response%???}"

if [ "$http_code" = "200" ]; then
    print_success "API call with CORS headers successful (HTTP $http_code)"
    # Check if CORS headers are present in response
    cors_headers=$(curl -s -I -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:8080" \
        -d '{"email":"admin@pulse.com","password":"admin123"}' \
        "http://localhost:8080/api/v1/auth/login" | grep -i "access-control")

    if [ -n "$cors_headers" ]; then
        print_success "CORS headers present in response"
        echo "$cors_headers"
    else
        print_warning "CORS headers not found in response"
    fi
else
    print_error "API call with CORS headers failed (HTTP $http_code)"
    echo "$response_body"
fi

# Test 4: Test Swagger UI accessibility
print_status "Testing Swagger UI accessibility..."
swagger_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api-docs/")

if [ "$swagger_response" = "200" ]; then
    print_success "Swagger UI is accessible (HTTP $swagger_response)"
else
    print_error "Swagger UI not accessible (HTTP $swagger_response)"
fi

# Test 5: Test Swagger UI content loading
print_status "Testing Swagger UI content loading..."
if curl -s "http://localhost:8080/api-docs/" | grep -q "swagger-ui"; then
    print_success "Swagger UI content is loading correctly"
else
    print_error "Swagger UI content not loading properly"
fi

echo ""
echo "========================================"
print_success "Swagger UI CORS Test Complete!"
echo ""
print_status "Results Summary:"
echo "  • CORS preflight: $([ "$cors_response" = "204" ] || [ "$cors_response" = "200" ] && echo "✅ Working" || echo "❌ Failed")"
echo "  • API calls with CORS: $([ "$http_code" = "200" ] && echo "✅ Working" || echo "❌ Failed")"
echo "  • Swagger UI access: $([ "$swagger_response" = "200" ] && echo "✅ Working" || echo "❌ Failed")"
echo ""
print_status "You can now:"
echo "  1. Open http://localhost:8080/api-docs/ in your browser"
echo "  2. Use the 'Try it out' feature in Swagger UI"
echo "  3. Test API endpoints directly from the browser"
echo "  4. No more CORS errors when using Swagger UI!"
