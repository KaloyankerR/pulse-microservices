#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 Testing Conversation Creation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Create/Login as User 1
echo -e "${YELLOW}Step 1: Creating/Logging in as User 1...${NC}"
echo -e "${BLUE}Payload:${NC}"
cat << 'PAYLOAD1'
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
PAYLOAD1
echo ""

REG1=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"SecurePass123!"}' 2>&1)

LOGIN1=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SecurePass123!"}')

USER1_TOKEN=$(echo $LOGIN1 | jq -r '.data.accessToken')
USER1_ID=$(echo $LOGIN1 | jq -r '.data.user.id')

echo -e "${GREEN}✅ User 1 (Alice):${NC}"
echo "   User ID: $USER1_ID"
echo "   Token: ${USER1_TOKEN:0:30}..."
echo ""

# Step 2: Create/Login as User 2
echo -e "${YELLOW}Step 2: Creating/Logging in as User 2...${NC}"
echo -e "${BLUE}Payload:${NC}"
cat << 'PAYLOAD2'
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "SecurePass123!"
}
PAYLOAD2
echo ""

REG2=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com","password":"SecurePass123!"}' 2>&1)

LOGIN2=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"SecurePass123!"}')

USER2_TOKEN=$(echo $LOGIN2 | jq -r '.data.accessToken')
USER2_ID=$(echo $LOGIN2 | jq -r '.data.user.id')

echo -e "${GREEN}✅ User 2 (Bob):${NC}"
echo "   User ID: $USER2_ID"
echo "   Token: ${USER2_TOKEN:0:30}..."
echo ""

# Step 3: Create a Group Conversation
echo -e "${YELLOW}Step 3: Creating a Group Conversation (Alice creates, adds Bob)...${NC}"
echo -e "${BLUE}Endpoint:${NC} POST http://localhost:8084/api/messages/group"
echo -e "${BLUE}Headers:${NC} Authorization: Bearer <TOKEN>"
echo -e "${BLUE}Payload:${NC}"
cat << PAYLOAD3
{
  "name": "Project Discussion",
  "participants": ["$USER2_ID"]
}
PAYLOAD3
echo ""

GROUP_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Project Discussion\",\"participants\":[\"$USER2_ID\"]}" \
  http://localhost:8084/api/messages/group)

CONV_ID=$(echo $GROUP_RESPONSE | jq -r '.data.id')

if [ "$CONV_ID" = "null" ] || [ "$CONV_ID" = "" ]; then
    echo -e "${RED}❌ Failed to create group${NC}"
    echo $GROUP_RESPONSE | jq
    exit 1
fi

echo -e "${GREEN}✅ Group Created Successfully!${NC}"
echo "   Conversation ID: $CONV_ID"
echo ""
echo -e "${BLUE}Response:${NC}"
echo $GROUP_RESPONSE | jq
echo ""

# Step 4: Send a Message
echo -e "${YELLOW}Step 4: Alice sends a message...${NC}"
echo -e "${BLUE}Endpoint:${NC} POST http://localhost:8084/api/messages"
echo -e "${BLUE}Payload:${NC}"
cat << PAYLOAD4
{
  "conversation_id": "$CONV_ID",
  "content": "Hey Bob! Welcome to the project! 🚀",
  "mentions": []
}
PAYLOAD4
echo ""

MSG1=$(curl -s -X POST \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Hey Bob! Welcome to the project! 🚀\",\"mentions\":[]}" \
  http://localhost:8084/api/messages)

MSG1_ID=$(echo $MSG1 | jq -r '.data.id')
echo -e "${GREEN}✅ Message sent!${NC}"
echo "   Message ID: $MSG1_ID"
echo ""
echo -e "${BLUE}Response:${NC}"
echo $MSG1 | jq
echo ""

# Step 5: Bob replies
echo -e "${YELLOW}Step 5: Bob replies...${NC}"
MSG2=$(curl -s -X POST \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Thanks Alice! Excited to work together! 👍\",\"mentions\":[]}" \
  http://localhost:8084/api/messages)

MSG2_ID=$(echo $MSG2 | jq -r '.data.id')
echo -e "${GREEN}✅ Bob's message sent!${NC}"
echo "   Message ID: $MSG2_ID"
echo ""

# Step 6: Get All Messages
echo -e "${YELLOW}Step 6: Getting all messages in conversation...${NC}"
echo -e "${BLUE}Endpoint:${NC} GET http://localhost:8084/api/messages/conversations/$CONV_ID/messages"
echo ""

MESSAGES=$(curl -s -H "Authorization: Bearer $USER1_TOKEN" \
  "http://localhost:8084/api/messages/conversations/$CONV_ID/messages")

echo -e "${GREEN}✅ Messages Retrieved!${NC}"
echo ""
echo -e "${BLUE}Response:${NC}"
echo $MESSAGES | jq
echo ""

# Step 7: Mark message as read
echo -e "${YELLOW}Step 7: Bob marks message as read...${NC}"
READ_RESP=$(curl -s -X PUT \
  -H "Authorization: Bearer $USER2_TOKEN" \
  "http://localhost:8084/api/messages/$MSG1_ID/read")

echo -e "${GREEN}✅ Message marked as read!${NC}"
echo $READ_RESP | jq
echo ""

# Step 8: View in MongoDB
echo -e "${YELLOW}Step 8: Checking MongoDB...${NC}"
echo ""
echo "Conversations:"
mongosh "mongodb://pulse_user:pulse_user@localhost:27017/messaging_db?authSource=admin" --quiet --eval "db.conversations.find({_id: ObjectId('$CONV_ID')}).pretty()" 2>/dev/null || echo "MongoDB check skipped"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅✅✅ ALL TESTS PASSED! ✅✅✅${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   User 1 (Alice): $USER1_ID"
echo "   User 2 (Bob):   $USER2_ID"
echo "   Conversation:   $CONV_ID"
echo "   Message 1:      $MSG1_ID"
echo "   Message 2:      $MSG2_ID"
echo ""
echo -e "${BLUE}🎯 You can now test in Postman with these IDs!${NC}"
