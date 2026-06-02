#!/bin/bash

##############################################################################
# Salesforce Agent REST API Test Script
# Tests the Agentforce agent via Einstein AI Agent REST API
#
# Usage: ./test-agent-rest-api.sh
# Or:    bash test-agent-rest-api.sh
##############################################################################

# set -e  # Disabled to see all errors

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment from .env.local
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
  echo "Please create $ENV_FILE with the following variables:"
  echo "  SF_INSTANCE_URL"
  echo "  SF_OAUTH_CLIENT_ID"
  echo "  SF_OAUTH_CLIENT_SECRET"
  echo "  SF_AGENT_ID"
  exit 1
fi

# Source the .env.local file
set +a  # Temporarily disable auto-export
source "$ENV_FILE"
set -a

# Configuration from environment (try multiple variable names)
INSTANCE_URL="${SF_INSTANCE_URL}"
CLIENT_ID="${SF_OAUTH_CLIENT_ID:-${EXTERNAL_APP_KEY}}"
CLIENT_SECRET="${SF_OAUTH_CLIENT_SECRET:-${EXTERNAL_APP_SECRET}}"
AGENT_ID="${SF_AGENT_ID}"
API_HOST="https://api.salesforce.com"

# Validate required variables
if [ -z "$INSTANCE_URL" ]; then
  echo -e "${RED}❌ Error: SF_INSTANCE_URL not set in $ENV_FILE${NC}"
  exit 1
fi

if [ -z "$CLIENT_ID" ]; then
  echo -e "${RED}❌ Error: SF_OAUTH_CLIENT_ID or EXTERNAL_APP_KEY not set in $ENV_FILE${NC}"
  exit 1
fi

if [ -z "$CLIENT_SECRET" ]; then
  echo -e "${RED}❌ Error: SF_OAUTH_CLIENT_SECRET or EXTERNAL_APP_SECRET not set in $ENV_FILE${NC}"
  exit 1
fi

if [ -z "$AGENT_ID" ]; then
  echo -e "${RED}❌ Error: SF_AGENT_ID not set in $ENV_FILE${NC}"
  echo "Add this line to .env.local:"
  echo "  SF_AGENT_ID=0Xxfj000001zIM1CAM"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Salesforce Agent REST API Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Display loaded configuration
echo -e "${BLUE}📋 Configuration loaded from $ENV_FILE:${NC}"
echo "   Instance URL: $INSTANCE_URL"
echo "   Client ID: ${CLIENT_ID:0:30}..."
echo "   Agent ID: $AGENT_ID"
echo "   API Host: $API_HOST"
echo ""

# Step 1: Get OAuth Token
echo -e "${YELLOW}📍 Step 1: Getting OAuth Access Token${NC}"
echo "URL: ${INSTANCE_URL}/services/oauth2/token"
echo ""

TOKEN_RESPONSE=$(curl -s "${INSTANCE_URL}/services/oauth2/token" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "client_secret=${CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')
TOKEN_FORMAT=$(echo "$TOKEN_RESPONSE" | jq -r '.token_format // empty')
SCOPE=$(echo "$TOKEN_RESPONSE" | jq -r '.scope // empty')
ISSUED_AT=$(echo "$TOKEN_RESPONSE" | jq -r '.issued_at // empty')
API_INSTANCE=$(echo "$TOKEN_RESPONSE" | jq -r '.api_instance_url // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get access token${NC}"
  echo "Response:"
  echo "$TOKEN_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Access token obtained${NC}"
echo "   Format: $TOKEN_FORMAT"
echo "   Scopes: $SCOPE"
echo "   API Instance: $API_INSTANCE"
echo "   Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
echo ""

# Step 2: Create Session
echo -e "${YELLOW}📍 Step 2: Creating Agent Session${NC}"
echo "URL: ${API_HOST}/einstein/ai-agent/v1/agents/${AGENT_ID}/sessions"
echo ""

SESSION_RESPONSE=$(curl -s --location -X POST "${API_HOST}/einstein/ai-agent/v1/agents/${AGENT_ID}/sessions" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  --data '{
    "externalSessionKey": "'$(uuidgen)'",
    "instanceConfig": {
      "endpoint": "'${INSTANCE_URL}'"
    },
    "streamingCapabilities": {
      "chunkTypes": ["Text"]
    }
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId // empty')
ERROR=$(echo "$SESSION_RESPONSE" | jq -r '.error // empty')

if [ -n "$ERROR" ]; then
  echo -e "${RED}❌ Failed to create session${NC}"
  echo "Error: $ERROR"
  echo ""
  echo "Full response:"
  echo "$SESSION_RESPONSE" | jq .
  echo ""
  echo -e "${YELLOW}Note: If you see '401 Invalid token', the agent may not be${NC}"
  echo -e "${YELLOW}configured for REST API access yet.${NC}"
  exit 1
fi

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ Session creation failed - no session ID in response${NC}"
  echo "Response:"
  echo "$SESSION_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Session created successfully${NC}"
echo "   Session ID: $SESSION_ID"
echo ""

# Step 3: Send Test Message
echo -e "${YELLOW}📍 Step 3: Sending Test Message${NC}"
TEST_MESSAGE="search for omega systems"
echo "Message: $TEST_MESSAGE"
echo ""

MESSAGE_PAYLOAD=$(cat <<EOF
{
  "message": {
    "sequenceId": 1,
    "type": "Text",
    "text": "${TEST_MESSAGE}"
  }
}
EOF
)

MESSAGE_RESPONSE=$(curl -s --location -X POST "${API_HOST}/einstein/ai-agent/v1/sessions/${SESSION_ID}/messages" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  --data "${MESSAGE_PAYLOAD}")

AGENT_RESPONSE=$(echo "$MESSAGE_RESPONSE" | jq -r '.messages[0].message // empty')
RESPONSE_ERROR=$(echo "$MESSAGE_RESPONSE" | jq -r '.error // empty')

if [ -n "$RESPONSE_ERROR" ]; then
  echo -e "${RED}❌ Failed to send message${NC}"
  echo "Error: $RESPONSE_ERROR"
  echo "Response:"
  echo "$MESSAGE_RESPONSE" | jq .
  exit 1
fi

if [ -z "$AGENT_RESPONSE" ]; then
  echo -e "${RED}❌ No response from agent${NC}"
  echo "Response:"
  echo "$MESSAGE_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Message sent and response received${NC}"
echo ""
echo "Agent Response:"
echo "$AGENT_RESPONSE" | head -c 200
echo ""
echo ""

# Step 4: End Session
echo -e "${YELLOW}📍 Step 4: Ending Session${NC}"

END_RESPONSE=$(curl -s --location -X DELETE "${API_HOST}/einstein/ai-agent/v1/agents/${AGENT_ID}/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

END_ERROR=$(echo "$END_RESPONSE" | jq -r '.error // empty')

if [ -n "$END_ERROR" ]; then
  echo -e "${YELLOW}⚠️  Session end returned error (may be normal):${NC}"
  echo "Error: $END_ERROR"
else
  echo -e "${GREEN}✅ Session ended${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
