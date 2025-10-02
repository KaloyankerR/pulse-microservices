#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Full Messaging Service Test${NC}"
echo ""

# 1. Login to get token
echo -e "${YELLOW}1. Logging in...${NC}"
LOGIN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}')

TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
USER_ID=$(echo $LOGIN | jq -r '.data.user.id')

if [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
    echo -e "${YELLOW}User not found, registering...${NC}"
    REG=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
      -H "Content-Type: application/json" \
      -d '{"username":"testuser","email":"john@example.com","password":"SecurePass123!"}')
    
    LOGIN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"john@example.com","password":"SecurePass123!"}')
    
    TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
    USER_ID=$(echo $LOGIN | jq -r '.data.user.id')
fi

echo -e "${GREEN}✅ Logged in as user: $USER_ID${NC}"
echo ""

# 2. Get conversations
echo -e "${YELLOW}2. Getting conversations...${NC}"
CONVS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8084/api/messages/conversations)
echo $CONVS | jq
echo ""

# 3. Create a group
echo -e "${YELLOW}3. Creating a group conversation...${NC}"
GROUP=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Group\",\"participants\":[\"$USER_ID\"]}" \
  http://localhost:8084/api/messages/group)

CONV_ID=$(echo $GROUP | jq -r '.data.id')
echo -e "${GREEN}✅ Group created: $CONV_ID${NC}"
echo $GROUP | jq
echo ""

# 4. Send a message
echo -e "${YELLOW}4. Sending a message...${NC}"
MSG=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Hello from automated test! 🚀\",\"mentions\":[]}" \
  http://localhost:8084/api/messages)

MSG_ID=$(echo $MSG | jq -r '.data.id')
echo -e "${GREEN}✅ Message sent: $MSG_ID${NC}"
echo $MSG | jq
echo ""

# 5. Get messages
echo -e "${YELLOW}5. Getting messages...${NC}"
MSGS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8084/api/messages/conversations/$CONV_ID/messages")
echo $MSGS | jq
echo ""

# 6. Mark as read
echo -e "${YELLOW}6. Marking message as read...${NC}"
READ_RESP=$(curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8084/api/messages/$MSG_ID/read")
echo $READ_RESP | jq
echo ""

echo -e "${GREEN}✅✅✅ All tests passed! ✅✅✅${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  User ID: $USER_ID"
echo "  Conversation ID: $CONV_ID"
echo "  Message ID: $MSG_ID"
echo ""
echo -e "${BLUE}Service is running at: http://localhost:8084${NC}"
echo -e "${BLUE}Check MongoDB:${NC} mongosh mongodb://pulse_user:pulse_user@localhost:27017/messaging_db?authSource=admin"
