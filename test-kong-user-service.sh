#!/bin/bash

# Test script for Kong Gateway + User Service integration
# This script tests the Kong Gateway setup with the user-service

echo "🚀 Testing Kong Gateway + User Service Integration"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for services to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Test 1: Check Kong Gateway health
echo ""
print_status "Test 1: Checking Kong Gateway health..."
if curl -s -f "http://localhost:8001/status" > /dev/null; then
    print_success "Kong Gateway is healthy"
    curl -s "http://localhost:8001/status" | jq '.' 2>/dev/null || echo "Kong status response received"
else
    print_error "Kong Gateway is not responding"
    exit 1
fi

# Test 2: Check Kong configuration
echo ""
print_status "Test 2: Checking Kong configuration..."
if curl -s -f "http://localhost:8001/config" > /dev/null; then
    print_success "Kong configuration loaded successfully"
else
    print_error "Kong configuration failed to load"
    exit 1
fi

# Test 3: Check User Service health through Kong
echo ""
print_status "Test 3: Checking User Service health through Kong..."
if wait_for_service "http://localhost:8000/health" "User Service (via Kong)"; then
    print_success "User Service is accessible through Kong Gateway"
    curl -s "http://localhost:8000/health" | jq '.' 2>/dev/null || echo "User service health response received"
else
    print_error "User Service is not accessible through Kong Gateway"
    exit 1
fi

# Test 4: Test CORS preflight request
echo ""
print_status "Test 4: Testing CORS preflight request..."
cors_response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "http://localhost:8000/api/v1/auth/login")

if [ "$cors_response" = "200" ] || [ "$cors_response" = "204" ]; then
    print_success "CORS preflight request successful (HTTP $cors_response)"
else
    print_warning "CORS preflight request returned HTTP $cors_response"
fi

# Test 5: Test user login with seeded admin user
echo ""
print_status "Test 5: Testing user login with seeded admin user..."
login_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:3000" \
    -d '{
        "email": "admin@pulse.com",
        "password": "admin123"
    }' \
    "http://localhost:8000/api/v1/auth/login")

http_code="${login_response: -3}"
response_body="${login_response%???}"

if [ "$http_code" = "200" ]; then
    print_success "Admin user login successful (HTTP $http_code)"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    
    # Extract token for further tests
    token=$(echo "$response_body" | jq -r '.data.accessToken // empty' 2>/dev/null)
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        print_success "JWT token received: ${token:0:20}..."
    fi
else
    print_error "Admin user login failed (HTTP $http_code)"
    echo "$response_body"
fi

# Test 6: Test user registration through Kong
echo ""
print_status "Test 6: Testing user registration through Kong..."
registration_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:3000" \
    -d '{
        "email": "kong-test@example.com",
        "password": "Password123!",
        "username": "kongtest",
        "displayName": "Kong Test User"
    }' \
    "http://localhost:8000/api/v1/auth/register")

http_code="${registration_response: -3}"
response_body="${registration_response%???}"

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    print_success "User registration successful (HTTP $http_code)"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
elif [ "$http_code" = "409" ]; then
    print_warning "User already exists (HTTP $http_code) - this is expected if test was run before"
else
    print_error "User registration failed (HTTP $http_code)"
    echo "$response_body"
fi

# Test 7: Test rate limiting
echo ""
print_status "Test 7: Testing rate limiting..."
print_status "Making 5 rapid requests to test rate limiting..."

rate_limit_hit=false
for i in {1..5}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/health")
    if [ "$response" = "429" ]; then
        rate_limit_hit=true
        break
    fi
    sleep 0.1
done

if [ "$rate_limit_hit" = true ]; then
    print_success "Rate limiting is working (received 429 response)"
else
    print_warning "Rate limiting may not be active (no 429 responses received)"
fi

# Test 8: Test Swagger documentation access through Kong
echo ""
print_status "Test 8: Testing Swagger documentation access through Kong..."
swagger_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api-docs")
swagger_slash_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api-docs/")

if [ "$swagger_response" = "200" ] || [ "$swagger_slash_response" = "200" ]; then
    print_success "Swagger documentation is accessible through Kong"
    print_status "Swagger UI available at: http://localhost:8000/api-docs (redirects to /api-docs/)"
    print_status "Direct access: http://localhost:8000/api-docs/"
else
    print_error "Swagger documentation not accessible through Kong"
    print_status "Response codes: /api-docs=$swagger_response, /api-docs/=$swagger_slash_response"
fi

# Test 9: Test Kong metrics
echo ""
print_status "Test 9: Checking Kong metrics..."
if curl -s -f "http://localhost:8001/metrics" > /dev/null; then
    print_success "Kong metrics endpoint is accessible"
    metrics_count=$(curl -s "http://localhost:8001/metrics" | wc -l)
    print_status "Metrics endpoint returned $metrics_count lines"
else
    print_warning "Kong metrics endpoint is not accessible"
fi

# Summary
echo ""
echo "=================================================="
print_success "Kong Gateway + User Service Integration Test Complete!"
echo ""
print_status "Access Points:"
echo "  • Kong Proxy: http://localhost:8000"
echo "  • Kong Admin: http://localhost:8001"
echo "  • User Service Direct: http://localhost:8080"
echo ""
print_status "Available Endpoints through Kong:"
echo "  • Health: http://localhost:8000/health"
echo "  • Swagger UI: http://localhost:8000/api-docs"
echo "  • Auth: http://localhost:8000/api/v1/auth/*"
echo "  • Users: http://localhost:8000/api/v1/users/*"
echo "  • Admin: http://localhost:8000/api/v1/admin/*"
echo ""
print_status "Next Steps:"
echo "  1. Update your frontend to use http://localhost:8000 as the API base URL"
echo "  2. Configure your Google OAuth client with the correct redirect URI"
echo "  3. Set up proper environment variables for production"
echo ""
