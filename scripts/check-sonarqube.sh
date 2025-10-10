#!/bin/bash

# SonarQube Health Check Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Checking SonarQube status..."
echo ""

# Check if SonarQube container is running
if docker-compose ps sonarqube | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} SonarQube container is running"
else
    echo -e "${RED}✗${NC} SonarQube container is not running"
    echo "   Start it with: docker-compose up -d sonarqube"
    exit 1
fi

# Check if SonarQube is responding
echo ""
echo "🌐 Checking SonarQube API..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f http://localhost:9001/api/system/status > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} SonarQube API is responding"
        
        # Get status
        status=$(curl -s http://localhost:9001/api/system/status | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo ""
        echo "📊 SonarQube Status: $status"
        
        if [ "$status" == "UP" ]; then
            echo -e "${GREEN}✓${NC} SonarQube is ready!"
            echo ""
            echo "🚀 You can now run: make sonar-all"
            echo "🌐 Dashboard: http://localhost:9001"
            echo "   Login: admin / admin"
            exit 0
        elif [ "$status" == "STARTING" ] || [ "$status" == "DB_MIGRATION_RUNNING" ]; then
            echo -e "${YELLOW}⏳${NC} SonarQube is starting up... (attempt $((attempt+1))/$max_attempts)"
            sleep 2
            attempt=$((attempt+1))
        else
            echo -e "${YELLOW}⚠${NC} SonarQube status: $status"
            sleep 2
            attempt=$((attempt+1))
        fi
    else
        echo -e "${YELLOW}⏳${NC} Waiting for SonarQube to respond... (attempt $((attempt+1))/$max_attempts)"
        sleep 2
        attempt=$((attempt+1))
    fi
done

echo ""
echo -e "${RED}✗${NC} SonarQube is not ready after $max_attempts attempts"
echo "   Check logs with: docker-compose logs sonarqube"
echo "   Try restarting: docker-compose restart sonarqube"
exit 1

