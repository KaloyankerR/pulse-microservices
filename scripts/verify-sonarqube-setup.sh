#!/bin/bash

# SonarQube Setup Verification Script
# This script verifies that all components for SonarQube integration are in place

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SonarQube Integration - Setup Verification Script   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 - MISSING"
        ((ERRORS++))
        return 1
    fi
}

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 installed"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $2 not found"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check if service is running
check_service() {
    if docker-compose ps | grep -q "$1.*running"; then
        echo -e "${GREEN}✓${NC} $2 is running"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $2 is not running"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check if URL is accessible
check_url() {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200\|302"; then
        echo -e "${GREEN}✓${NC} $2 is accessible"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $2 is not accessible"
        ((WARNINGS++))
        return 1
    fi
}

echo -e "${BLUE}[1/6] Checking SonarQube Project Configuration Files...${NC}"
check_file "user-service/sonar-project.properties" "user-service config"
check_file "notification-service/sonar-project.properties" "notification-service config"
check_file "social-service/sonar-project.properties" "social-service config"
check_file "post-service/sonar-project.properties" "post-service config"
check_file "messaging-service/sonar-project.properties" "messaging-service config"
echo ""

echo -e "${BLUE}[2/6] Checking Documentation Files...${NC}"
check_file "docs/SONARQUBE_SETUP.md" "Full setup guide"
check_file "SONARQUBE_QUICKSTART.md" "Quick start guide"
check_file "SONARQUBE_SETUP_SUMMARY.md" "Setup summary"
echo ""

echo -e "${BLUE}[3/6] Checking Makefile Commands...${NC}"
if grep -q "sonar-all:" Makefile; then
    echo -e "${GREEN}✓${NC} make sonar-all command exists"
else
    echo -e "${RED}✗${NC} make sonar-all command missing"
    ((ERRORS++))
fi

if grep -q "sonar-user:" Makefile; then
    echo -e "${GREEN}✓${NC} make sonar-user command exists"
else
    echo -e "${RED}✗${NC} make sonar-user command missing"
    ((ERRORS++))
fi

if grep -q "sonar-notification:" Makefile; then
    echo -e "${GREEN}✓${NC} make sonar-notification command exists"
else
    echo -e "${RED}✗${NC} make sonar-notification command missing"
    ((ERRORS++))
fi

if grep -q "sonar-social:" Makefile; then
    echo -e "${GREEN}✓${NC} make sonar-social command exists"
else
    echo -e "${RED}✗${NC} make sonar-social command missing"
    ((ERRORS++))
fi

if grep -q "sonar-post:" Makefile; then
    echo -e "${GREEN}✓${NC} make sonar-post command exists"
else
    echo -e "${RED}✗${NC} make sonar-post command missing"
    ((ERRORS++))
fi

if grep -q "sonar-messaging:" Makefile; then
    echo -e "${GREEN}✓${NC} make sonar-messaging command exists"
else
    echo -e "${RED}✗${NC} make sonar-messaging command missing"
    ((ERRORS++))
fi
echo ""

echo -e "${BLUE}[4/6] Checking Required Tools...${NC}"
check_command "docker-compose" "Docker Compose"
check_command "npm" "NPM"
check_command "go" "Go"

if ! check_command "sonar-scanner" "SonarQube Scanner"; then
    echo -e "   ${YELLOW}→${NC} Install with: ${YELLOW}brew install sonar-scanner${NC} (macOS)"
fi
echo ""

echo -e "${BLUE}[5/6] Checking SonarQube Service...${NC}"
check_service "sonarqube" "SonarQube server"

if [ $? -ne 0 ]; then
    echo -e "   ${YELLOW}→${NC} Start with: ${YELLOW}docker-compose up -d sonarqube${NC}"
fi
echo ""

echo -e "${BLUE}[6/6] Checking SonarQube Accessibility...${NC}"
if ! check_url "http://localhost:9001" "SonarQube UI"; then
    echo -e "   ${YELLOW}→${NC} Ensure SonarQube is running and wait for it to be ready"
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    VERIFICATION SUMMARY                ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Perfect! All checks passed.${NC}"
    echo -e "${GREEN}  Your SonarQube integration is fully configured.${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Ensure SonarQube is running: ${YELLOW}docker-compose up -d sonarqube${NC}"
    echo -e "  2. Wait for SonarQube to start (1-2 minutes)"
    echo -e "  3. Run analysis: ${YELLOW}make sonar-all${NC}"
    echo -e "  4. View results: ${YELLOW}http://localhost:9001${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Configuration complete with ${WARNINGS} warning(s).${NC}"
    echo -e "  Review the warnings above and follow the suggestions."
    echo ""
    echo -e "${BLUE}You can proceed with:${NC}"
    echo -e "  ${YELLOW}make sonar-all${NC}"
else
    echo -e "${RED}✗ Configuration incomplete: ${ERRORS} error(s), ${WARNINGS} warning(s).${NC}"
    echo -e "  Please address the errors above before running SonarQube analysis."
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Documentation:${NC}"
echo -e "  • Quick Start:  ${YELLOW}SONARQUBE_QUICKSTART.md${NC}"
echo -e "  • Full Guide:   ${YELLOW}docs/SONARQUBE_SETUP.md${NC}"
echo -e "  • Summary:      ${YELLOW}SONARQUBE_SETUP_SUMMARY.md${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

