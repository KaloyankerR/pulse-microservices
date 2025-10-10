#!/bin/bash

# SonarQube Token Setup Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SonarQube Authentication Token Setup            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if SonarQube is running
if ! curl -s -f http://localhost:9001/api/system/status > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} SonarQube is not accessible at http://localhost:9001"
    echo "   Start it with: docker-compose up -d sonarqube"
    exit 1
fi

echo -e "${GREEN}✓${NC} SonarQube is running"
echo ""

echo -e "${YELLOW}📋 To generate a SonarQube authentication token:${NC}"
echo ""
echo "1. Open your browser to: ${BLUE}http://localhost:9001${NC}"
echo "2. Login with:"
echo "   Username: ${YELLOW}admin${NC}"
echo "   Password: ${YELLOW}admin${NC}"
echo "3. You may be prompted to change the password (recommended)"
echo "4. Go to: ${BLUE}My Account → Security → Generate Tokens${NC}"
echo "5. Token Name: ${YELLOW}pulse-analysis${NC}"
echo "6. Type: ${YELLOW}Global Analysis Token${NC}"
echo "7. Click ${YELLOW}Generate${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Press Enter after generating the token..."
echo ""
read -p "Paste your SonarQube token here: " token

if [ -z "$token" ]; then
    echo -e "${RED}✗${NC} No token provided. Exiting."
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Updating sonar-project.properties files...${NC}"

# Update user-service
if [ -f "user-service/sonar-project.properties" ]; then
    sed -i '' "s|# sonar.token=.*|sonar.token=$token|g" user-service/sonar-project.properties
    echo -e "${GREEN}✓${NC} Updated user-service/sonar-project.properties"
else
    echo -e "${YELLOW}⚠${NC} user-service/sonar-project.properties not found"
fi

# Update notification-service
if [ -f "notification-service/sonar-project.properties" ]; then
    sed -i '' "s|# sonar.token=.*|sonar.token=$token|g" notification-service/sonar-project.properties
    echo -e "${GREEN}✓${NC} Updated notification-service/sonar-project.properties"
else
    echo -e "${YELLOW}⚠${NC} notification-service/sonar-project.properties not found"
fi

# Update social-service
if [ -f "social-service/sonar-project.properties" ]; then
    if grep -q "sonar.token" social-service/sonar-project.properties; then
        sed -i '' "s|sonar.token=.*|sonar.token=$token|g" social-service/sonar-project.properties
    else
        echo "" >> social-service/sonar-project.properties
        echo "# Authentication token" >> social-service/sonar-project.properties
        echo "sonar.token=$token" >> social-service/sonar-project.properties
    fi
    echo -e "${GREEN}✓${NC} Updated social-service/sonar-project.properties"
else
    echo -e "${YELLOW}⚠${NC} social-service/sonar-project.properties not found"
fi

# Update post-service
if [ -f "post-service/sonar-project.properties" ]; then
    if grep -q "sonar.token" post-service/sonar-project.properties; then
        sed -i '' "s|sonar.token=.*|sonar.token=$token|g" post-service/sonar-project.properties
    else
        echo "" >> post-service/sonar-project.properties
        echo "# Authentication token" >> post-service/sonar-project.properties
        echo "sonar.token=$token" >> post-service/sonar-project.properties
    fi
    echo -e "${GREEN}✓${NC} Updated post-service/sonar-project.properties"
else
    echo -e "${YELLOW}⚠${NC} post-service/sonar-project.properties not found"
fi

# Update messaging-service
if [ -f "messaging-service/sonar-project.properties" ]; then
    if grep -q "sonar.token" messaging-service/sonar-project.properties; then
        sed -i '' "s|sonar.token=.*|sonar.token=$token|g" messaging-service/sonar-project.properties
    else
        echo "" >> messaging-service/sonar-project.properties
        echo "# Authentication token" >> messaging-service/sonar-project.properties
        echo "sonar.token=$token" >> messaging-service/sonar-project.properties
    fi
    echo -e "${GREEN}✓${NC} Updated messaging-service/sonar-project.properties"
else
    echo -e "${YELLOW}⚠${NC} messaging-service/sonar-project.properties not found"
fi

echo ""
echo -e "${GREEN}✅ All configuration files updated!${NC}"
echo ""
echo -e "${BLUE}🚀 You can now run:${NC}"
echo -e "   ${YELLOW}make sonar-all${NC}     - Analyze all services"
echo -e "   ${YELLOW}make sonar-user${NC}    - Analyze user service only"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

