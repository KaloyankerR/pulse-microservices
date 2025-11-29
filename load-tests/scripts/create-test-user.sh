#!/bin/bash

# Script to create test user for load testing
# Usage: ./scripts/create-test-user.sh

BASE_URL="${BASE_URL:-http://localhost:8000}"
EMAIL="${TEST_EMAIL:-loadtest@pulse.com}"
USERNAME="${TEST_USERNAME:-loadtester}"
PASSWORD="${TEST_PASSWORD:-LoadTest123!}"

echo "Creating test user for load testing..."
echo "Email: $EMAIL"
echo "Username: $USERNAME"
echo "Base URL: $BASE_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"displayName\": \"Load Tester\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Test user created successfully!"
  echo "You can now run: make load-test-baseline"
elif [ "$HTTP_CODE" = "409" ]; then
  echo "ℹ️  Test user already exists (this is fine)"
  echo "You can now run: make load-test-baseline"
else
  echo "❌ Failed to create test user"
  echo "HTTP Status: $HTTP_CODE"
  echo "Response: $BODY"
  echo ""
  echo "Please check:"
  echo "1. Services are running: make up"
  echo "2. Kong Gateway is accessible: curl $BASE_URL/health"
  exit 1
fi











