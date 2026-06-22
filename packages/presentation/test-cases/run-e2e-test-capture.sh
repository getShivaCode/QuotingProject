#!/bin/bash

# E2E Test Runner with Request/Response Capture
# Captures all raw requests and responses to markdown file
# Usage: ./test-cases/run-e2e-test-capture.sh [json|plaintext]

API_URL="${API_URL:-http://localhost:3001}"
E2E_MODE="${E2E_MODE:-${1:-plaintext}}"
CAPTURE_FILE="/tmp/e2e-requests-responses-${E2E_MODE}-$(date +%s).md"

echo "📝 Capturing requests and responses to: $CAPTURE_FILE"
echo ""

# Initialize capture file
cat > "$CAPTURE_FILE" << 'EOF'
# E2E Test: Raw Requests and Responses

EOF

echo "## Test Configuration" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"
echo "- **API URL:** $API_URL" >> "$CAPTURE_FILE"
echo "- **Mode:** $E2E_MODE" >> "$CAPTURE_FILE"
echo "- **Timestamp:** $(date)" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

# Create session
echo "🚀 Starting E2E Test: $E2E_MODE mode"
echo ""
echo "## Session Creation" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/agent/session" \
  -H "Content-Type: application/json" \
  -d '{}')

SESSION=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId')

echo "### Request" >> "$CAPTURE_FILE"
echo '```json' >> "$CAPTURE_FILE"
echo '{"method": "POST", "endpoint": "/api/agent/session", "body": {}}' >> "$CAPTURE_FILE"
echo '```' >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

echo "### Response" >> "$CAPTURE_FILE"
echo '```json' >> "$CAPTURE_FILE"
echo "$SESSION_RESPONSE" | jq . >> "$CAPTURE_FILE" 2>/dev/null || echo "$SESSION_RESPONSE" >> "$CAPTURE_FILE"
echo '```' >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

if [ -z "$SESSION" ] || [ "$SESSION" = "null" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

echo "✅ Session: $SESSION"
echo ""

# Helper function to capture request/response
capture_step() {
  local step_num=$1
  local step_name=$2
  local message=$3

  echo "## Step $step_num: $step_name" >> "$CAPTURE_FILE"
  echo "" >> "$CAPTURE_FILE"

  echo "### Request" >> "$CAPTURE_FILE"
  echo '```json' >> "$CAPTURE_FILE"
  echo "{" >> "$CAPTURE_FILE"
  echo "  \"method\": \"POST\"," >> "$CAPTURE_FILE"
  echo "  \"endpoint\": \"/api/agent/message\"," >> "$CAPTURE_FILE"
  echo "  \"body\": {" >> "$CAPTURE_FILE"
  echo "    \"sessionId\": \"$SESSION\"," >> "$CAPTURE_FILE"
  echo "    \"message\": \"$message\"" >> "$CAPTURE_FILE"
  echo "  }" >> "$CAPTURE_FILE"
  echo "}" >> "$CAPTURE_FILE"
  echo '```' >> "$CAPTURE_FILE"
  echo "" >> "$CAPTURE_FILE"

  local response=$(curl -s -X POST "$API_URL/api/agent/message" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION\",\"message\":\"$message\"}")

  echo "### Response" >> "$CAPTURE_FILE"
  echo '```json' >> "$CAPTURE_FILE"
  echo "$response" | jq . >> "$CAPTURE_FILE" 2>/dev/null || echo "$response" >> "$CAPTURE_FILE"
  echo '```' >> "$CAPTURE_FILE"
  echo "" >> "$CAPTURE_FILE"

  echo "$response"
}

# Step 0: Initialize JSON if requested
if [ "$E2E_MODE" = "json" ]; then
  echo "Step 0: Initialize JSON Format"
  capture_step "0" "Initialize JSON Format" "output_format: json" > /dev/null
  sleep 1
fi

# Step 1: Search for Omega
echo "Step 1: Search for Omega"
capture_step "1" "Search for Omega" "search for Omega" > /dev/null
sleep 1

# Step 2: Select Omega
echo "Step 2: Select Omega Technologies"
capture_step "2" "Select Omega Technologies" "select 1" > /dev/null
sleep 2

# Step 3: Search NH3
echo "Step 3: Search for NH3 fertilizers"
capture_step "3" "Search for NH3 Fertilizers" "search for NH3 fertilizer" > /dev/null
sleep 2

# Step 4: Add NH3 solution (15)
echo "Step 4: Add 15 units of NH3 solution"
capture_step "4" "Add 15 units NH3 solution" "add 15 units of NH3 solution" > /dev/null
sleep 1

# Step 5: Add urea (10)
echo "Step 5: Add 10 units of urea"
capture_step "5" "Add 10 units urea" "add 10 units of urea" > /dev/null
sleep 1

# Step 6: Add NH4OH (3)
echo "Step 6: Add 3 units of NH4OH"
capture_step "6" "Add 3 units NH4OH" "add 3 units of NH4OH" > /dev/null
sleep 1

# Step 7: Add soda bicarb (1)
echo "Step 7: Add 1 unit of soda bicarb"
capture_step "7" "Add 1 unit soda bicarb" "add 1 unit of soda bicarb" > /dev/null
sleep 1

# Step 8: Remove NH4OH
echo "Step 8: Remove all NH4OH from cart"
capture_step "8" "Remove all NH4OH" "remove all NH4OH from cart" > /dev/null
sleep 1

# Step 9: Update soda bicarb to 2
echo "Step 9: Update soda bicarb to 2 units"
capture_step "9" "Update soda bicarb to 2" "update soda bicarb to 2 units" > /dev/null
sleep 1

# Step 10: Create Quote
DATETIME=$(date +"%Y-%m-%d %H:%M:%S")
RANDOM_ID=$((RANDOM % 10000))
QUOTE_NAME="E2E Test ${DATETIME} ${RANDOM_ID}"

echo "Step 10: Create Quote"
capture_step "10" "Create Quote" "create a quote called ${QUOTE_NAME}" > /dev/null
sleep 2

# Step 11: Verify Fresh State
echo "Step 11: Verify Fresh State"
capture_step "11" "Verify Fresh State" "start over" > /dev/null
echo ""

# End session
curl -s -X DELETE "$API_URL/api/agent/session/$SESSION" > /dev/null

# Add footer
echo "" >> "$CAPTURE_FILE"
echo "---" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"
echo "**Test Completed:** $(date)" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"
echo "All raw requests and responses captured above. Review the responses to verify correctness." >> "$CAPTURE_FILE"

echo ""
echo "✅ Capture complete!"
echo "📄 View results: $CAPTURE_FILE"
echo ""
echo "Quick view:"
cat "$CAPTURE_FILE" | head -100
echo ""
echo "... (see full file at $CAPTURE_FILE)"
