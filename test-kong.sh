#!/bin/bash

# Kong API Gateway Test Script for Pulse Microservices
# This script tests all the configured services through Kong Gateway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KONG_PROXY="http://localhost:8000"
KONG_ADMIN="http://localhost:8001"
# Kong Manager not available in OSS version

echo -e "${BLUE}🚀 Kong API Gateway Test Script for Pulse Microservices${NC}"
echo "=================================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "URL: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$response" -eq "$expected_status" ]; then
        print_result 0 "$description (Status: $response)"
    else
        print_result 1 "$description (Expected: $expected_status, Got: $response)"
    fi
}

# Function to test POST endpoint
test_post_endpoint() {
    local url=$1
    local data=$2
    local description=$3
    local expected_status=${4:-200}
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "URL: $url"
    echo "Data: $data"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url")
    
    if [ "$response" -eq "$expected_status" ] || [ "$response" -eq "201" ]; then
        print_result 0 "$description (Status: $response)"
    else
        print_result 1 "$description (Expected: $expected_status or 201, Got: $response)"
    fi
}

# Wait for services to be ready
echo -e "\n${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Test 1: Kong Admin API
echo -e "\n${BLUE}📋 Testing Kong Admin API${NC}"
test_endpoint "$KONG_ADMIN/status" "Kong Admin API Status"

# Test 2: Kong Configuration
echo -e "\n${BLUE}📋 Testing Kong Configuration${NC}"
test_endpoint "$KONG_ADMIN/config" "Kong Configuration"

# Test 3: User Service Health (through Kong)
echo -e "\n${BLUE}📋 Testing User Service Health${NC}"
test_endpoint "$KONG_PROXY/health" "User Service Health Check"

# Test 4: User Service Root (through Kong)
echo -e "\n${BLUE}📋 Testing User Service Root${NC}"
test_endpoint "$KONG_PROXY/" "User Service Root Endpoint"

# Test 5: CORS Preflight Request
echo -e "\n${BLUE}📋 Testing CORS Configuration${NC}"
echo -e "\n${YELLOW}Testing: CORS Preflight Request${NC}"
cors_response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "$KONG_PROXY/api/v1/auth/login")

if [ "$cors_response" -eq "200" ] || [ "$cors_response" -eq "204" ]; then
    print_result 0 "CORS Preflight Request (Status: $cors_response)"
else
    print_result 1 "CORS Preflight Request (Expected: 200 or 204, Got: $cors_response)"
fi

# Test 6: User Service Auth Registration
echo -e "\n${BLUE}📋 Testing User Service Auth${NC}"
test_post_endpoint "$KONG_PROXY/api/v1/auth/register" \
    '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}' \
    "User Service Registration"

# Test 7: User Service Auth Login
echo -e "\n${BLUE}📋 Testing User Service Login${NC}"
test_post_endpoint "$KONG_PROXY/api/v1/auth/login" \
    '{"email":"test@example.com","password":"password123"}' \
    "User Service Login"

# Test 8: Auth Service Registration
echo -e "\n${BLUE}📋 Testing Auth Service${NC}"
test_post_endpoint "$KONG_PROXY/api/auth/register" \
    '{"username":"testuser","email":"test@example.com","password":"password123"}' \
    "Auth Service Registration"

# Test 9: Auth Service Login
echo -e "\n${BLUE}📋 Testing Auth Service Login${NC}"
test_post_endpoint "$KONG_PROXY/api/auth/login" \
    '{"username":"testuser","password":"password123"}' \
    "Auth Service Login"

# Test 10: Tweet Service (without auth - should return 401)
echo -e "\n${BLUE}📋 Testing Tweet Service${NC}"
echo -e "\n${YELLOW}Testing: Tweet Service (without auth)${NC}"
tweet_response=$(curl -s -o /dev/null -w "%{http_code}" "$KONG_PROXY/api/tweets")
if [ "$tweet_response" -eq "401" ]; then
    print_result 0 "Tweet Service JWT Protection (Status: $tweet_response)"
else
    print_result 1 "Tweet Service JWT Protection (Expected: 401, Got: $tweet_response)"
fi

# Test 11: Rate Limiting
echo -e "\n${BLUE}📋 Testing Rate Limiting${NC}"
echo -e "\n${YELLOW}Testing: Rate Limiting (making 5 quick requests)${NC}"
rate_limit_triggered=false
for i in {1..5}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$KONG_PROXY/health")
    if [ "$response" -eq "429" ]; then
        rate_limit_triggered=true
        break
    fi
    sleep 0.1
done

if [ "$rate_limit_triggered" = true ]; then
    print_result 0 "Rate Limiting Working (Status: 429)"
else
    print_result 1 "Rate Limiting Not Triggered (may need more requests)"
fi

# Test 12: Kong Metrics
echo -e "\n${BLUE}📋 Testing Kong Metrics${NC}"
test_endpoint "$KONG_ADMIN/metrics" "Kong Prometheus Metrics"

# Test 13: Kong Services
echo -e "\n${BLUE}📋 Testing Kong Services${NC}"
test_endpoint "$KONG_ADMIN/services" "Kong Services List"

# Test 14: Kong Routes
echo -e "\n${BLUE}📋 Testing Kong Routes${NC}"
test_endpoint "$KONG_ADMIN/routes" "Kong Routes List"

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "=================="
echo -e "Kong Proxy: $KONG_PROXY"
echo -e "Kong Admin: $KONG_ADMIN"
echo -e "Kong Manager: Not available in OSS version"
echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo "1. Check Kong Admin API at: $KONG_ADMIN"
echo "2. Update your frontend to use: $KONG_PROXY"
echo "3. Monitor Kong metrics at: $KONG_ADMIN/metrics"
echo "4. Check service logs if any tests failed"

echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
echo "View Kong logs: docker logs kong-gateway"
echo "View User Service logs: docker logs pulse-user-service"
echo "View Auth Service logs: docker logs auth-service"
echo "View Tweet Service logs: docker logs tweet-service"
echo "Restart Kong: docker restart kong-gateway"
