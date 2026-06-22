#!/bin/bash

##############################################################################
# Salesforce Agent REST API E2E Test Script
# Calls Salesforce Agent REST API directly via OAuth 2.0
# Same 11-step workflow as run-e2e-test-sf-cli.sh
#
# Usage: ./run-e2e-test-rest-api.sh [json|plaintext]
##############################################################################

# Load environment from .env.local
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: $ENV_FILE not found"
  exit 1
fi

source "$ENV_FILE"

E2E_MODE="${1:-plaintext}"
INSTANCE_URL="${SF_INSTANCE_URL}"
CLIENT_ID="${SF_OAUTH_CLIENT_ID:-${EXTERNAL_APP_KEY}}"
CLIENT_SECRET="${SF_OAUTH_CLIENT_SECRET:-${EXTERNAL_APP_SECRET}}"
AGENT_ID="${SF_AGENT_ID}"
API_HOST="https://api.salesforce.com"

# Validate required variables
if [ -z "$INSTANCE_URL" ] || [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$AGENT_ID" ]; then
  echo "❌ Missing required environment variables"
  echo "   Required: SF_INSTANCE_URL, SF_AGENT_ID"
  echo "   Required (one of each pair):"
  echo "     - SF_OAUTH_CLIENT_ID or EXTERNAL_APP_KEY"
  echo "     - SF_OAUTH_CLIENT_SECRET or EXTERNAL_APP_SECRET"
  exit 1
fi

PASS=0
FAIL=0

echo ""
echo "🚀 Starting E2E Test: Salesforce Agent REST API (Direct)"
echo "📍 Instance: $INSTANCE_URL"
echo "📍 Agent: $AGENT_ID"
echo "📍 Mode: $E2E_MODE"
echo ""

# Get OAuth Token
echo "🔐 Getting OAuth Access Token..."
TOKEN_RESPONSE=$(curl -s "${INSTANCE_URL}/services/oauth2/token" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "client_secret=${CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "✅ Access token obtained"
echo ""

# Create Session
echo "🚀 Creating Agent Session..."
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
  echo "❌ Failed to create session"
  exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

# Helper function to send message
send_message() {
  local step_num=$1
  local step_name=$2
  local message=$3
  local seq_id=$4

  echo "📋 Step $step_num: $step_name"

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
    echo "   ❌ FAIL - No response"
    ((FAIL++))
    return 1
  fi

  echo "   ✅ PASS"
  ((PASS++))
  sleep 0.5
  return 0
}

SEQ_ID=1

# Step 0: Initialize JSON if requested
if [ "$E2E_MODE" = "json" ]; then
  echo "📋 Step 0: Initialize JSON Format"
  send_message "0" "Initialize JSON Format" "output_format: json" $SEQ_ID
  ((SEQ_ID++))
  echo ""
fi

# Step 1: Search for Omega account
send_message "1" "Search for Omega" "search for Omega" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 2: Select Omega Technologies
send_message "2" "Select Omega Technologies" "select 1" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 3: Search for NH3 fertilizers
send_message "3" "Search for NH3 Fertilizers" "search for NH3 fertilizer" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 4: Add 15 units of NH3 solution
send_message "4" "Add 15 units NH3 solution" "add 15 units of NH3 solution" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 5: Add 10 units of urea
send_message "5" "Add 10 units urea" "add 10 units of urea" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 6: Add 3 units of NH4OH
send_message "6" "Add 3 units NH4OH" "add 3 units of NH4OH" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 7: Add 1 unit of soda bicarb
send_message "7" "Add 1 unit soda bicarb" "add 1 unit of soda bicarb" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 8: Remove all NH4OH
send_message "8" "Remove all NH4OH" "remove all NH4OH from cart" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 9: Update soda bicarb to 2 units
send_message "9" "Update soda bicarb to 2" "update soda bicarb to 2 units" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 10: Create Quote
DATETIME=$(date +"%Y-%m-%d %H:%M:%S")
RANDOM_ID=$((RANDOM % 10000))
QUOTE_NAME="E2E Test ${DATETIME} ${RANDOM_ID}"
send_message "10" "Create Quote" "create a quote called ${QUOTE_NAME}" $SEQ_ID
((SEQ_ID++))
echo ""

# Step 11: Start over (verify fresh state)
send_message "11" "Verify Fresh State" "start over" $SEQ_ID
echo ""

# End Session
echo "🔌 Ending Session..."
curl -s -X DELETE "${API_HOST}/einstein/ai-agent/v1/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null

echo ""
# Summary
TOTAL=$((PASS + FAIL))
SUCCESS_RATE=$((PASS * 100 / TOTAL))

echo "════════════════════════════════════════════════════════════"
echo "📊 Test Summary"
echo "   ✅ Passed: $PASS/$TOTAL"
echo "   ❌ Failed: $FAIL/$TOTAL"
echo "   Success Rate: $SUCCESS_RATE%"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
else
  exit 0
fi
