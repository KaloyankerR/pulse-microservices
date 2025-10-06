#!/bin/bash

# Test Monitoring Setup
# This script verifies that Prometheus and Grafana are working correctly

set -e

echo "=================================="
echo "Testing Monitoring Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if services are running
echo "1. Checking if monitoring services are running..."
if docker ps | grep -q prometheus; then
    success "Prometheus container is running"
else
    error "Prometheus container is not running"
    echo "  Run: docker-compose up -d prometheus"
    exit 1
fi

if docker ps | grep -q grafana; then
    success "Grafana container is running"
else
    error "Grafana container is not running"
    echo "  Run: docker-compose up -d grafana"
    exit 1
fi

echo ""

# Test Prometheus
echo "2. Testing Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    success "Prometheus is healthy"
else
    error "Prometheus health check failed"
    exit 1
fi

# Check Prometheus targets
echo ""
echo "3. Checking Prometheus targets..."
TARGETS=$(curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' | wc -l)
if [ "$TARGETS" -gt 0 ]; then
    success "Prometheus is scraping $TARGETS target(s)"
    
    # Show target status
    echo ""
    echo "   Target Status:"
    curl -s http://localhost:9090/api/v1/targets | \
        grep -o '"job":"[^"]*","health":"[^"]*"' | \
        sed 's/"job":"/   - /g' | \
        sed 's/","health":"/ : /g' | \
        sed 's/"//g'
else
    warning "No targets found - services may not be running"
fi

echo ""

# Test Grafana
echo "4. Testing Grafana..."
if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    success "Grafana is healthy"
else
    error "Grafana health check failed"
    exit 1
fi

echo ""

# Check service metrics endpoints
echo "5. Checking service metrics endpoints..."

services=(
    "user-service:8081"
    "post-service:8082"
    "messaging-service:8084"
    "social-service:8085"
    "notification-service:8086"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s http://localhost:${port}/metrics > /dev/null 2>&1; then
        success "$name metrics endpoint is available"
    else
        warning "$name metrics endpoint is not available (service may not be running)"
    fi
done

echo ""

# Verify metrics are being collected
echo "6. Verifying metrics collection..."
METRICS_COUNT=$(curl -s http://localhost:9090/api/v1/query?query=up | grep -o '"value":\[' | wc -l)
if [ "$METRICS_COUNT" -gt 0 ]; then
    success "Metrics are being collected"
else
    warning "No metrics found - wait a few seconds and try again"
fi

echo ""
echo "=================================="
echo "Monitoring Test Complete!"
echo "=================================="
echo ""
echo "Access URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "Next Steps:"
echo "  1. Open Grafana in your browser"
echo "  2. Navigate to Dashboards → Pulse Microservices Overview"
echo "  3. Generate some load: for i in {1..100}; do curl http://localhost:8000/api/v1/posts; done"
echo "  4. Watch metrics update in real-time"
echo ""

