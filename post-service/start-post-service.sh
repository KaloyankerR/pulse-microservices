#!/bin/bash

# Post Service Startup Script
# This script helps start the Post Service with proper configuration

set -e

echo "🚀 Starting Pulse Post Service..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Java 17 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven 3.6 or higher."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL first."
    echo "   You can start it with: brew services start postgresql (macOS)"
    echo "   Or: sudo systemctl start postgresql (Linux)"
    exit 1
fi

# Check if database exists
if ! psql -h localhost -U pulse_user -d pulse_posts_service_db -c "SELECT 1;" &> /dev/null; then
    echo "📊 Setting up database..."
    
    # Create database if it doesn't exist
    createdb -h localhost -U pulse_user pulse_posts_service_db 2>/dev/null || true
    
    # Run initialization script
    if [ -f "init.sql" ]; then
        psql -h localhost -U pulse_user -d pulse_posts_service_db -f init.sql
        echo "✅ Database initialized successfully"
    fi
fi

# Check if User Service is running
if ! curl -s http://localhost:3000/actuator/health &> /dev/null; then
    echo "⚠️  User Service is not running on port 3000."
    echo "   Please start the User Service first."
    echo "   You can start it with: cd ../user-service && npm start"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Build the application
echo "🔨 Building Post Service..."
mvn clean compile -q

# Start the application
echo "🎯 Starting Post Service on port 8082..."
echo "📚 API Documentation: http://localhost:8082/swagger-ui.html"
echo "🏥 Health Check: http://localhost:8082/actuator/health"
echo "📊 Metrics: http://localhost:8082/actuator/metrics"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

# Start with development profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
