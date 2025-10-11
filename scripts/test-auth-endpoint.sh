#!/bin/bash

# Test Authentication Endpoint
# This script tests the /api/v1/users/profile endpoint to verify response structure

echo "=== Testing Authentication Endpoint ==="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Install it with: brew install jq"
    echo "   Continuing without pretty printing..."
    JQ_CMD="cat"
else
    JQ_CMD="jq ."
fi

# Check if token is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-auth-endpoint.sh <ACCESS_TOKEN>"
    echo ""
    echo "To get a token:"
    echo "1. Login to the application"
    echo "2. Open browser console"
    echo "3. Run: localStorage.getItem('accessToken')"
    echo "4. Copy the token and run: ./test-auth-endpoint.sh <token>"
    exit 1
fi

TOKEN=$1
API_URL=${API_URL:-http://localhost:8000}

echo "Testing endpoint: $API_URL/api/v1/users/profile"
echo "Using token: ${TOKEN:0:20}..."
echo ""

# Test the endpoint
HTTP_CODE=$(curl -s -o response.json -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/api/v1/users/profile")

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Request successful!"
    echo ""
    echo "Response structure:"
    cat response.json | $JQ_CMD
    echo ""
    
    # Check response structure
    if command -v jq &> /dev/null; then
        HAS_SUCCESS=$(cat response.json | jq -r '.success')
        HAS_DATA=$(cat response.json | jq -r '.data')
        HAS_USER=$(cat response.json | jq -r '.data.user')
        
        echo "Validation:"
        echo "  - Has 'success' field: $HAS_SUCCESS"
        echo "  - Has 'data' field: $([ "$HAS_DATA" != "null" ] && echo "✓" || echo "✗")"
        echo "  - Has 'data.user' field: $([ "$HAS_USER" != "null" ] && echo "✓" || echo "✗")"
        echo ""
        
        if [ "$HAS_USER" != "null" ]; then
            USER_ID=$(cat response.json | jq -r '.data.user.id')
            USER_NAME=$(cat response.json | jq -r '.data.user.username')
            USER_EMAIL=$(cat response.json | jq -r '.data.user.email')
            
            echo "User Details:"
            echo "  - ID: $USER_ID"
            echo "  - Username: $USER_NAME"
            echo "  - Email: $USER_EMAIL"
        else
            echo "⚠️  User data not found in expected location!"
            echo "    Expected: response.data.user"
            echo "    Check response.json for actual structure"
        fi
    fi
else
    echo "❌ Request failed with status $HTTP_CODE"
    echo ""
    echo "Error response:"
    cat response.json | $JQ_CMD
fi

echo ""
echo "Full response saved to: response.json"

# Cleanup
rm -f response.json

