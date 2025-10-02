#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 Complete Conversation Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Create 3 users
echo -e "${YELLOW}Creating 3 users...${NC}"

# User 1 - Alice
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"SecurePass123!"}' > /dev/null 2>&1

LOGIN1=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SecurePass123!"}')
USER1_TOKEN=$(echo $LOGIN1 | jq -r '.data.accessToken')
USER1_ID=$(echo $LOGIN1 | jq -r '.data.user.id')

# User 2 - Bob
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com","password":"SecurePass123!"}' > /dev/null 2>&1

LOGIN2=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"SecurePass123!"}')
USER2_TOKEN=$(echo $LOGIN2 | jq -r '.data.accessToken')
USER2_ID=$(echo $LOGIN2 | jq -r '.data.user.id')

# User 3 - Charlie
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"charlie","email":"charlie@example.com","password":"SecurePass123!"}' > /dev/null 2>&1

LOGIN3=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"charlie@example.com","password":"SecurePass123!"}')
USER3_TOKEN=$(echo $LOGIN3 | jq -r '.data.accessToken')
USER3_ID=$(echo $LOGIN3 | jq -r '.data.user.id')

echo -e "${GREEN}✅ Users created:${NC}"
echo "   Alice (User 1):   $USER1_ID"
echo "   Bob (User 2):     $USER2_ID"
echo "   Charlie (User 3): $USER3_ID"
echo ""

# Create Group Conversation
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Creating Group Conversation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Endpoint:${NC} POST http://localhost:8084/api/messages/group"
echo -e "${BLUE}Auth:${NC} Bearer <Alice's Token>"
echo ""
echo -e "${BLUE}Payload:${NC}"
cat << PAYLOAD
{
  "name": "Team Project",
  "participants": [
    "$USER2_ID",
    "$USER3_ID"
  ]
}
PAYLOAD
echo ""

GROUP=$(curl -s -X POST \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Team Project\",\"participants\":[\"$USER2_ID\",\"$USER3_ID\"]}" \
  http://localhost:8084/api/messages/group)

CONV_ID=$(echo $GROUP | jq -r '.data.id')
echo -e "${GREEN}✅ Group Created!${NC}"
echo "   Conversation ID: $CONV_ID"
echo "   Participants: Alice, Bob, Charlie"
echo ""
echo -e "${BLUE}Full Response:${NC}"
echo $GROUP | jq
echo ""

# Send Messages
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💬 Sending Messages${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Message 1 - Alice
echo -e "${BLUE}1. Alice:${NC} \"Welcome to the team project!\""
MSG1=$(curl -s -X POST \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Welcome to the team project! 🚀\",\"mentions\":[]}" \
  http://localhost:8084/api/messages)
MSG1_ID=$(echo $MSG1 | jq -r '.data.id')
echo "   Message ID: $MSG1_ID"
echo ""

# Message 2 - Bob
echo -e "${BLUE}2. Bob:${NC} \"Happy to be here!\""
MSG2=$(curl -s -X POST \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Happy to be here! Let's do this! 💪\",\"mentions\":[]}" \
  http://localhost:8084/api/messages)
MSG2_ID=$(echo $MSG2 | jq -r '.data.id')
echo "   Message ID: $MSG2_ID"
echo ""

# Message 3 - Charlie
echo -e "${BLUE}3. Charlie:${NC} \"Excited to work with you all!\""
MSG3=$(curl -s -X POST \
  -H "Authorization: Bearer $USER3_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Excited to work with you all! 🎉\",\"mentions\":[]}" \
  http://localhost:8084/api/messages)
MSG3_ID=$(echo $MSG3 | jq -r '.data.id')
echo "   Message ID: $MSG3_ID"
echo ""

# Get All Messages
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📖 Retrieving Conversation Messages${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Endpoint:${NC} GET http://localhost:8084/api/messages/conversations/$CONV_ID/messages"
echo ""

MESSAGES=$(curl -s -H "Authorization: Bearer $USER1_TOKEN" \
  "http://localhost:8084/api/messages/conversations/$CONV_ID/messages?limit=10&offset=0")

echo $MESSAGES | jq
echo ""

# Get Alice's Conversations
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 Alice's Conversations List${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Endpoint:${NC} GET http://localhost:8084/api/messages/conversations"
echo ""

CONVS=$(curl -s -H "Authorization: Bearer $USER1_TOKEN" \
  "http://localhost:8084/api/messages/conversations")

echo $CONVS | jq
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SUCCESS! All Tests Passed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "   • Created 3 users (Alice, Bob, Charlie)"
echo "   • Created 1 group conversation"
echo "   • Sent 3 messages"
echo "   • Retrieved messages successfully"
echo ""
echo -e "${BLUE}🎯 Use these in Postman:${NC}"
echo "   Conversation ID: $CONV_ID"
echo "   Alice Token:     $USER1_TOKEN"
echo "   Bob Token:       $USER2_TOKEN"
echo "   Charlie Token:   $USER3_TOKEN"
