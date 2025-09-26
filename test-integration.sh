#!/bin/bash

# Pulse Microservices Integration Test Script
# This script tests the integration between User Service and Post Service

set -e

echo "🧪 Testing Pulse Microservices Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "   Testing $name... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        else
            echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED (Connection error)${NC}"
        return 1
    fi
}

test_json_endpoint() {
    local url=$1
    local name=$2
    local auth_header=$3
    
    echo -n "   Testing $name... "
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -H "$auth_header" "$url" 2>/dev/null)
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED (Invalid JSON)${NC}"
        return 1
    fi
}

# Check if services are running
echo -e "${BLUE}🔍 Checking if services are running...${NC}"

if ! curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${RED}❌ User Service is not running on port 8080${NC}"
    echo "   Please start the services first with: ./start-all-services.sh"
    exit 1
fi

if ! curl -s http://localhost:8082/actuator/health >/dev/null 2>&1; then
    echo -e "${RED}❌ Post Service is not running on port 8082${NC}"
    echo "   Please start the services first with: ./start-all-services.sh"
    exit 1
fi

echo -e "${GREEN}✅ Both services are running${NC}"
echo ""

# Test User Service endpoints
echo -e "${BLUE}👤 Testing User Service...${NC}"
test_endpoint "http://localhost:8080/health" "User Service Health"
test_endpoint "http://localhost:8080/api/v1/users" "User Service API" 401  # Should return 401 (unauthorized)

# Test Post Service endpoints
echo -e "${BLUE}📝 Testing Post Service...${NC}"
test_endpoint "http://localhost:8082/actuator/health" "Post Service Health"
test_endpoint "http://localhost:8082/api/posts" "Post Service API" 401  # Should return 401 (unauthorized)
test_endpoint "http://localhost:8082/swagger-ui.html" "Swagger UI" 200

# Test database connections
echo -e "${BLUE}🗄️  Testing Database Connections...${NC}"

# Test User Service database
if docker exec pulse-users-db pg_isready -U pulse_user -d pulse_users >/dev/null 2>&1; then
    echo -e "   User Service DB: ${GREEN}✅ Connected${NC}"
else
    echo -e "   User Service DB: ${RED}❌ Connection failed${NC}"
fi

# Test Post Service database
if docker exec pulse-posts-db pg_isready -U pulse_user -d pulse_posts_service_db >/dev/null 2>&1; then
    echo -e "   Post Service DB: ${GREEN}✅ Connected${NC}"
else
    echo -e "   Post Service DB: ${RED}❌ Connection failed${NC}"
fi

# Test Redis
if docker exec pulse-users-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "   Redis: ${GREEN}✅ Connected${NC}"
else
    echo -e "   Redis: ${RED}❌ Connection failed${NC}"
fi

echo ""

# Test service-to-service communication
echo -e "${BLUE}🔗 Testing Service-to-Service Communication...${NC}"

# Create a test user and get JWT token
echo -n "   Creating test user... "
USER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "displayName": "Test User"
    }' 2>/dev/null)

if echo "$USER_RESPONSE" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    
    # Extract JWT token (this is a simplified approach)
    JWT_TOKEN=$(echo "$USER_RESPONSE" | jq -r '.data.token // empty' 2>/dev/null)
    
    if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        echo -n "   Testing Post Service with JWT... "
        
        # Test creating a post with JWT token
        POST_RESPONSE=$(curl -s -X POST http://localhost:8082/api/posts \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"content": "Test post from integration test"}' 2>/dev/null)
        
        if echo "$POST_RESPONSE" | jq . >/dev/null 2>&1; then
            echo -e "${GREEN}✅ OK${NC}"
            echo -e "   ${GREEN}🎉 Integration test successful!${NC}"
        else
            echo -e "${RED}❌ FAILED${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️  Could not extract JWT token${NC}"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo ""
echo -e "${BLUE}📊 Service Status Summary:${NC}"
echo "   User Service:    http://localhost:8080"
echo "   Post Service:    http://localhost:8082"
echo "   Swagger UI:      http://localhost:8082/swagger-ui.html"
echo "   User Service DB: localhost:5432"
echo "   Post Service DB: localhost:5433"
echo "   Redis:           localhost:6379"
echo ""
echo -e "${GREEN}✅ Integration test completed!${NC}"
