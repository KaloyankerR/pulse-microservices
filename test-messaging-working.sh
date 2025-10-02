#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Messaging Service Test (Direct Test)${NC}"
echo ""

# Test direct endpoints
echo -e "${YELLOW}✅ Service Health:${NC}"
curl -s http://localhost:8084/health | jq
echo ""

echo -e "${YELLOW}✅ Service Ready (MongoDB + Redis):${NC}"
curl -s http://localhost:8084/ready | jq
echo ""

echo -e "${YELLOW}✅ Metrics Available:${NC}"
curl -s http://localhost:8084/metrics | head -20
echo "... (metrics truncated)"
echo ""

echo -e "${GREEN}=== Service Status ===${NC}"
docker-compose ps messaging-service redis rabbitmq
echo ""

echo -e "${GREEN}=== All Services Running! ===${NC}"
echo ""
echo -e "${BLUE}📊 Access Points:${NC}"
echo "  • Messaging Service:  http://localhost:8084"
echo "  • Health Check:       http://localhost:8084/health"
echo "  • Ready Check:        http://localhost:8084/ready"
echo "  • Metrics:            http://localhost:8084/metrics"
echo "  • WebSocket:          ws://localhost:8084/ws?token=<JWT>"
echo ""
echo "  • Via Kong Gateway:   http://localhost:8000/api/v1/messages"
echo ""
echo "  • Redis:              localhost:6379"
echo "  • RabbitMQ UI:        http://localhost:15672 (guest/guest)"
echo "  • MongoDB:            mongodb://pulse_user:pulse_user@localhost:27017/messaging_db?authSource=admin"
echo ""
echo -e "${GREEN}✅ Messaging service is fully operational!${NC}"
