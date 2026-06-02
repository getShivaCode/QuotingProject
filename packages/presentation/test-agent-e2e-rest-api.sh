#!/bin/bash

##############################################################################
# Salesforce Agent REST API E2E Test Script
# Tests the full 7-step quoting workflow via REST API
#
# Steps:
# 1. Initialize Agent
# 2. Search for Omega Systems
# 3. Select Omega Systems
# 4. Search for NH3 Fertilizer
# 5. Add 10 Units of Urea
# 6. Create Quote 'Haiku test'
# 7. Verify Fresh State
#
# Usage: ./test-agent-e2e-rest-api.sh
##############################################################################

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
  exit 1
fi

source "$ENV_FILE"

INSTANCE_URL="${SF_INSTANCE_URL}"
CLIENT_ID="${SF_OAUTH_CLIENT_ID:-${EXTERNAL_APP_KEY}}"
CLIENT_SECRET="${SF_OAUTH_CLIENT_SECRET:-${EXTERNAL_APP_SECRET}}"
AGENT_ID="${SF_AGENT_ID}"
API_HOST="https://api.salesforce.com"

# Validate required variables
if [ -z "$INSTANCE_URL" ] || [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$AGENT_ID" ]; then
  echo -e "${RED}❌ Missing required environment variables${NC}"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Salesforce Agent E2E REST API Test${NC}"
echo -e "${BLUE}Full Quoting Workflow (7 Steps)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get OAuth Token
echo -e "${YELLOW}🔐 Getting OAuth Access Token...${NC}"
TOKEN_RESPONSE=$(curl -s "${INSTANCE_URL}/services/oauth2/token" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "client_secret=${CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get access token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Access token obtained${NC}"
echo ""

# Create Session
echo -e "${YELLOW}🚀 Creating Agent Session...${NC}"
SESSION_RESPONSE=$(curl -s -X POST "${API_HOST}/einstein/ai-agent/v1/agents/${AGENT_ID}/sessions" \
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

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ Failed to create session${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Session created: $SESSION_ID${NC}"
echo ""

# Helper function to send message
send_message() {
  local step=$1
  local message=$2
  local seq_id=$3

  echo -e "${YELLOW}📋 Step $step: $message${NC}"

  MESSAGE_PAYLOAD=$(cat <<EOF
{
  "message": {
    "sequenceId": ${seq_id},
    "type": "Text",
    "text": "${message}"
  }
}
EOF
)

  RESPONSE=$(curl -s -X POST "${API_HOST}/einstein/ai-agent/v1/sessions/${SESSION_ID}/messages" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    --data "${MESSAGE_PAYLOAD}")

  AGENT_MSG=$(echo "$RESPONSE" | jq -r '.messages[0].message // empty')

  if [ -z "$AGENT_MSG" ]; then
    echo -e "${RED}❌ No response from agent${NC}"
    echo "Response: $RESPONSE"
    return 1
  fi

  echo -e "${GREEN}✅ Agent Response:${NC}"
  echo "$AGENT_MSG" | head -c 300
  echo ""
  echo ""

  return 0
}

PASS=0
FAIL=0
SEQ_ID=1

# Step 1: Initialize Agent
if send_message 1 "Hello" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi
((SEQ_ID++))

# Step 2: Search for Omega Systems
if send_message 2 "search for omega systems" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi
((SEQ_ID++))

# Step 3: Select Omega Systems
if send_message 3 "I want to use Omega Systems" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi
((SEQ_ID++))

# Step 4: Search for NH3 Fertilizer
if send_message 4 "search for NH3 fertilizer" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi
((SEQ_ID++))

# Step 5: Add 10 Units of Urea
if send_message 5 "add 10 units of urea" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi
((SEQ_ID++))

# Step 6: Create Quote
if send_message 6 "create a quote called Haiku test" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi
((SEQ_ID++))

# Step 7: Verify Fresh State
if send_message 7 "test" $SEQ_ID; then
  ((PASS++))
else
  ((FAIL++))
fi

# End Session
echo -e "${YELLOW}🔌 Ending Session...${NC}"
curl -s -X DELETE "${API_HOST}/einstein/ai-agent/v1/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "   ${GREEN}✅ Passed: $PASS/7${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "   ${RED}❌ Failed: $FAIL/7${NC}"
fi

SUCCESS_RATE=$((PASS * 100 / 7))
echo "   Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
