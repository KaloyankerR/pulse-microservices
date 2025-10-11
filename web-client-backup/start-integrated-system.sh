#!/bin/bash

echo "🚀 Starting Pulse Microservices Integration"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $name to start...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is running!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $name failed to start after $((max_attempts * 2)) seconds${NC}"
    return 1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo "Please stop the service using this port or run: kill -9 \$(lsof -t -i:$port)"
        return 1
    fi
    return 0
}

# Check if required ports are available
echo -e "${BLUE}Checking port availability...${NC}"
check_port 3000 || exit 1
check_port 8000 || exit 1  # Kong Gateway
check_port 8081 || exit 1
check_port 8761 || exit 1

# Check if microservices directory exists
MICROSERVICES_DIR="/Users/kalo/Projects/University/S6/pulse-microservices"
if [ ! -d "$MICROSERVICES_DIR" ]; then
    echo -e "${RED}❌ Microservices directory not found: $MICROSERVICES_DIR${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from example...${NC}"
    cat > .env.local << EOF
# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_JWT_SECRET=your-jwt-secret-here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (MongoDB for Next.js features)
DATABASE_URL=mongodb://localhost:27017/pulse

# Microservices Integration through Kong Gateway
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000
NEXT_PUBLIC_MICROSERVICES_ENABLED=true

# JWT Configuration (must match Spring Boot)
JWT_SECRET=pulseSecretKey123456789012345678901234567890

# Development Settings
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Created .env.local with default values${NC}"
    echo -e "${YELLOW}Please update the values in .env.local as needed${NC}"
fi

# Start Spring Boot microservices
echo -e "${BLUE}Starting Spring Boot microservices...${NC}"
cd "$MICROSERVICES_DIR"

# Start services in background
echo -e "${YELLOW}Starting Eureka Server...${NC}"
cd "$MICROSERVICES_DIR/eureka-server" && mvn spring-boot:run > ../eureka.log 2>&1 &
EUREKA_PID=$!

# Wait for Eureka to start
check_service "http://localhost:8761/actuator/health" "Eureka Server"

echo -e "${YELLOW}Starting User Service...${NC}"
cd "$MICROSERVICES_DIR/user-service" && mvn spring-boot:run > ../user-service.log 2>&1 &
USER_SERVICE_PID=$!

# Wait for User Service to start
check_service "http://localhost:8081/actuator/health" "User Service"

echo -e "${YELLOW}Starting API Gateway...${NC}"
cd "$MICROSERVICES_DIR/gateway-service" && mvn spring-boot:run > ../gateway.log 2>&1 &
GATEWAY_PID=$!

# Wait for Kong Gateway to start
check_service "http://localhost:8000" "Kong Gateway"

# Go back to frontend directory
cd "/Users/kalo/Projects/University/S6/pulse"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install
fi

# Start Next.js frontend
echo -e "${YELLOW}Starting Next.js frontend...${NC}"
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
check_service "http://localhost:3000" "Next.js Frontend"

echo ""
echo -e "${GREEN}🎉 All services are running!${NC}"
echo "=========================================="
echo -e "${BLUE}Service URLs:${NC}"
echo "• Frontend:       http://localhost:3000"
echo "• Kong Gateway:   http://localhost:8000" 
echo "• User Service:   http://localhost:8081"
echo "• Eureka Server:  http://localhost:8761"
echo ""
echo -e "${BLUE}Integration Test URLs:${NC}"
echo "• Main App:       http://localhost:3000"
echo "• Kong Admin:     http://localhost:8001"
echo ""
echo -e "${BLUE}Test Commands:${NC}"
echo "curl http://localhost:8000/api/v1/auth/login"
echo "curl http://localhost:8000/health"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo "kill $EUREKA_PID $USER_SERVICE_PID $GATEWAY_PID $NEXTJS_PID"
echo ""
echo -e "${YELLOW}Or run:${NC}"
echo "pkill -f 'spring-boot:run' && pkill -f 'next-server'"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

# Save PIDs for easy cleanup
echo "$EUREKA_PID $USER_SERVICE_PID $GATEWAY_PID $NEXTJS_PID" > .service_pids

# Wait for user input to keep script running
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services...${NC}"
trap 'echo -e "${YELLOW}Stopping all services...${NC}"; kill $EUREKA_PID $USER_SERVICE_PID $GATEWAY_PID $NEXTJS_PID 2>/dev/null; rm -f .service_pids; exit 0' INT

# Keep script running
while true; do
    sleep 1
done
