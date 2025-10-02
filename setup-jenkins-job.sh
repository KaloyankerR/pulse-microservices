#!/bin/bash

# Jenkins Job Setup Script for User Service
# This script helps you quickly set up Jenkins jobs for the user-service

set -e

echo "🚀 Jenkins Job Setup for User Service"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Jenkins is running
echo "1. Checking Jenkins status..."
if curl -s http://localhost:8090/login > /dev/null 2>&1; then
    print_success "Jenkins is running at http://localhost:8090"
else
    print_error "Jenkins is not running. Please start it first:"
    echo "   make jenkins-up"
    exit 1
fi

echo ""
echo "2. Jenkins Job Configuration Options:"
echo "====================================="
echo ""
echo "You have two main options for setting up your Jenkins job:"
echo ""
echo "📁 Option A: Local File System Job (Recommended for Development)"
echo "   - Works with your local files"
echo "   - No GitHub repository needed"
echo "   - Quick setup for testing"
echo ""
echo "🌐 Option B: GitHub Integration (Recommended for Production)"
echo "   - Connects to GitHub repository"
echo "   - Automated builds on code changes"
echo "   - Better for team collaboration"
echo ""

read -p "Choose option (A/B): " choice

case $choice in
    [Aa]* )
        print_info "Setting up Local File System Job..."
        echo ""
        echo "📋 Local Job Setup Instructions:"
        echo "================================"
        echo ""
        echo "1. Go to Jenkins: http://localhost:8090"
        echo "   Username: admin"
        echo "   Password: admin"
        echo ""
        echo "2. Click 'New Item'"
        echo "3. Enter name: user-service-local"
        echo "4. Select 'Pipeline' and click OK"
        echo ""
        echo "5. In Pipeline section:"
        echo "   - Definition: 'Pipeline script'"
        echo "   - Copy the content from user-service/Jenkinsfile.local"
        echo ""
        echo "6. In Build Environment section:"
        echo "   - Check 'Use custom workspace'"
        echo "   - Enter: /var/jenkins_home/workspace/user-service-local"
        echo ""
        echo "7. Save and click 'Build Now'"
        echo ""
        echo "📁 Workspace Setup:"
        echo "==================="
        echo "To make your local user-service available to Jenkins:"
        echo ""
        echo "1. Copy your user-service to Jenkins workspace:"
        echo "   docker exec -it pulse-jenkins mkdir -p /var/jenkins_home/workspace/user-service-local"
        echo "   docker cp user-service pulse-jenkins:/var/jenkins_home/workspace/user-service-local/"
        echo ""
        echo "2. Or use volume mounting (add to docker-compose.yml):"
        echo "   volumes:"
        echo "     - ./user-service:/var/jenkins_home/workspace/user-service-local:ro"
        echo ""
        ;;
    [Bb]* )
        print_info "Setting up GitHub Integration Job..."
        echo ""
        echo "📋 GitHub Integration Setup Instructions:"
        echo "========================================"
        echo ""
        echo "Prerequisites:"
        echo "1. GitHub repository with your code"
        echo "2. GitHub Personal Access Token"
        echo ""
        echo "Step 1: Create GitHub Credentials"
        echo "================================="
        echo "1. Go to Jenkins: http://localhost:8090"
        echo "2. Manage Jenkins → Manage Credentials"
        echo "3. System → Global credentials → Add Credentials"
        echo "4. Configure:"
        echo "   - Kind: Username with password"
        echo "   - Username: your-github-username"
        echo "   - Password: your-github-personal-access-token"
        echo "   - ID: github-credentials"
        echo ""
        echo "Step 2: Create GitHub Personal Access Token"
        echo "==========================================="
        echo "1. Go to GitHub → Settings → Developer settings"
        echo "2. Personal access tokens → Tokens (classic)"
        echo "3. Generate new token"
        echo "4. Select scopes: repo, admin:repo_hook"
        echo "5. Copy the token"
        echo ""
        echo "Step 3: Create Pipeline Job"
        echo "==========================="
        echo "1. New Item → user-service-github"
        echo "2. Pipeline job type"
        echo "3. Pipeline section:"
        echo "   - Definition: 'Pipeline script from SCM'"
        echo "   - SCM: Git"
        echo "   - Repository URL: https://github.com/yourusername/your-repo.git"
        echo "   - Credentials: Select github-credentials"
        echo "   - Branch: */main"
        echo "   - Script Path: user-service/Jenkinsfile"
        echo ""
        echo "Step 4: Configure Webhooks (Optional)"
        echo "====================================="
        echo "1. GitHub repo → Settings → Webhooks"
        echo "2. Add webhook:"
        echo "   - Payload URL: http://localhost:8090/github-webhook/"
        echo "   - Content type: application/json"
        echo "   - Events: Just the push event"
        echo ""
        ;;
    * )
        print_error "Invalid choice. Please run the script again and choose A or B."
        exit 1
        ;;
esac

echo ""
echo "📚 Additional Resources:"
echo "========================"
echo "• Detailed setup guide: jenkins/JENKINS_SETUP_GUIDE.md"
echo "• Jenkins documentation: jenkins/README.md"
echo "• Pipeline examples: user-service/Jenkinsfile"
echo ""
echo "🔧 Troubleshooting:"
echo "==================="
echo "• Jenkins logs: make jenkins-logs"
echo "• Restart Jenkins: make jenkins-restart"
echo "• Check services: docker-compose ps"
echo ""
print_success "Setup instructions provided! Follow the steps above to configure your Jenkins job."

