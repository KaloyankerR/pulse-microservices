#!/bin/bash

# Pulse Microservices Local Development Startup Script
# This script starts services locally (not in Docker) using your local databases

set -e

echo "🚀 Starting Pulse Microservices Platform (Local Development)..."
echo "   This will start services locally using your local PostgreSQL databases"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17+ first."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven 3.6+ first."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   You can also run ./setup-databases.sh to set up the databases."
    exit 1
fi

echo "✅ All prerequisites are met"

# Check if databases exist
echo "🗄️  Checking databases..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw pulse_users; then
    echo "❌ Database 'pulse_users' does not exist."
    echo "   Please run ./setup-databases.sh to create the databases."
    exit 1
fi

if ! psql -lqt | cut -d \| -f 1 | grep -qw pulse_posts_service_db; then
    echo "❌ Database 'pulse_posts_service_db' does not exist."
    echo "   Please run ./setup-databases.sh to create the databases."
    exit 1
fi

echo "✅ Databases are ready"

# Function to wait for service
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local timeout_seconds="${3:-60}"
    local start_time=$(date +%s)
    
    echo -n "      Waiting for $service_name... "
    
    while true; do
        if curl -f "$url" &> /dev/null; then
            echo "✅ Ready"
            return 0
        fi
        
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout_seconds ]; then
            echo "❌ Timeout after ${timeout_seconds}s"
            return 1
        fi
        
        sleep 2
    done
}

# Function to start service in background
start_service() {
    local service_name="$1"
    local start_command="$2"
    local working_dir="$3"
    
    echo "🚀 Starting $service_name..."
    
    # Check if working directory exists
    if [ ! -d "$working_dir" ]; then
        echo "❌ Directory $working_dir does not exist!"
        return 1
    fi
    
    # Change to working directory
    cd "$working_dir" || {
        echo "❌ Failed to change to directory $working_dir"
        return 1
    }
    
    # Start service in background
    nohup $start_command > "../logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../logs/${service_name}.pid"
    echo "   Started with PID: $pid"
    echo "   Logs: logs/${service_name}.log"
    
    # Return to original directory
    cd ..
}

# Function to kill existing services
kill_existing_services() {
    echo "🔍 Checking for existing services..."
    
    # Kill services on ports 8080 and 8082
    local port_8080_pid=$(lsof -ti:8080 2>/dev/null || true)
    local port_8082_pid=$(lsof -ti:8082 2>/dev/null || true)
    
    if [ -n "$port_8080_pid" ]; then
        echo "   Killing existing process on port 8080 (PID: $port_8080_pid)"
        kill $port_8080_pid 2>/dev/null || true
        sleep 2
    fi
    
    if [ -n "$port_8082_pid" ]; then
        echo "   Killing existing process on port 8082 (PID: $port_8082_pid)"
        kill $port_8082_pid 2>/dev/null || true
        sleep 2
    fi
    
    # Clean up any existing PID files
    rm -f logs/*.pid
}

# Create logs directory
mkdir -p logs

# Kill any existing services
kill_existing_services

# Check if .env file exists for user service
if [ ! -f "user-service/.env" ]; then
    echo "📝 Creating .env file for user service..."
    cp user-service/env.example user-service/.env
    echo "   Created user-service/.env from env.example"
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."

if [ ! -d "user-service/node_modules" ]; then
    echo "   Installing Node.js dependencies..."
    cd user-service
    npm install
    cd ..
fi

if [ ! -d "post-service/target" ]; then
    echo "   Building Java dependencies..."
    cd post-service
    mvn clean install -DskipTests
    cd ..
fi

# Initialize user service database
echo "🗄️  Initializing user service database..."
cd user-service
npx prisma generate
npx prisma db push
cd ..

echo ""
echo "🚀 Starting services..."

# Start User Service
if ! start_service "user-service" "npm start" "user-service"; then
    echo "❌ Failed to start user-service"
    exit 1
fi

# Start Post Service
if ! start_service "post-service" "mvn spring-boot:run" "post-service"; then
    echo "❌ Failed to start post-service"
    echo "🛑 Stopping user-service..."
    if [ -f "logs/user-service.pid" ]; then
        kill $(cat logs/user-service.pid) 2>/dev/null || true
        rm -f logs/user-service.pid
    fi
    exit 1
fi

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for services
wait_for_service "http://localhost:8080/health" "User Service" 120
wait_for_service "http://localhost:8082/actuator/health" "Post Service" 120

echo ""
echo "🎉 All services are now running locally!"
echo ""
echo "📋 Service URLs:"
echo "   👤 User Service:        http://localhost:8080"
echo "   📝 Post Service:        http://localhost:8082"
echo "   🏥 User Service Health: http://localhost:8080/health"
echo "   🏥 Post Service Health: http://localhost:8082/actuator/health"
echo ""
echo "🗄️  Database Connections:"
echo "   👤 User Service DB:     postgresql://pulse_user:pulse_user@localhost:5432/pulse_users"
echo "   📝 Post Service DB:     postgresql://pulse_user:pulse_user@localhost:5432/pulse_posts_service_db"
echo ""
echo "📊 Logs:"
echo "   👤 User Service:        logs/user-service.log"
echo "   📝 Post Service:        logs/post-service.log"
echo ""
echo "🔧 Management Commands:"
echo "   🛑 Stop all services:   ./stop-local-services.sh"
echo "   📈 View logs:           tail -f logs/[service-name].log"
echo "   🔄 Restart service:     kill [pid] && ./start-local-services.sh"
echo ""
echo "🧪 Test the integration:"
echo "   1. Register a user:"
echo "      curl -X POST http://localhost:8080/api/v1/auth/register \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"test@example.com\",\"password\":\"Password123!\",\"username\":\"testuser\",\"displayName\":\"Test User\"}'"
echo ""
echo "   2. Login to get JWT token:"
echo "      curl -X POST http://localhost:8080/api/v1/auth/login \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"test@example.com\",\"password\":\"Password123!\"}'"
echo ""
echo "   3. Create a post (replace <token> with actual JWT):"
echo "      curl -X POST http://localhost:8082/api/posts \\"
echo "        -H 'Authorization: Bearer <your-jwt-token>' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"content\": \"Hello from integrated services!\"}'"
echo ""
echo "Press Ctrl+C to stop this script (services will continue running)"
echo "Use ./stop-local-services.sh to stop all services"

# Keep script running and show logs
tail -f logs/user-service.log logs/post-service.log
