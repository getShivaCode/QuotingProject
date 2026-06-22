#!/bin/bash

# E2E Test Runner with Raw Salesforce CLI Capture
# Captures direct SF CLI responses without server middleware
# Usage: ./test-cases/run-e2e-test-sf-cli.sh [json|plaintext]

SF_MODE="${1:-plaintext}"
CAPTURE_FILE="/tmp/e2e-requests-responses-sf-cli-${SF_MODE}-$(date +%s).md"

echo "📝 Capturing raw SF CLI responses to: $CAPTURE_FILE"
echo ""

# Initialize capture file
cat > "$CAPTURE_FILE" << 'EOF'
# E2E Test: Raw Salesforce CLI Responses (Direct Agent Output)

## Test Configuration

EOF

echo "- **Mode:** $SF_MODE" >> "$CAPTURE_FILE"
echo "- **Source:** Salesforce CLI (sf agent preview)" >> "$CAPTURE_FILE"
echo "- **Timestamp:** $(date)" >> "$CAPTURE_FILE"
echo "- **Agent:** Quoting_Agent" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

# Start preview session
echo "🚀 Starting Salesforce agent preview session..."
echo ""
echo "## Preview Session Start" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

PREVIEW_START=$(sf agent preview start --json --use-live-actions --authoring-bundle Quoting_Agent 2>&1)

echo "### Command" >> "$CAPTURE_FILE"
echo '```bash' >> "$CAPTURE_FILE"
echo 'sf agent preview start --json --use-live-actions --authoring-bundle Quoting_Agent' >> "$CAPTURE_FILE"
echo '```' >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

echo "### Response" >> "$CAPTURE_FILE"
echo '```json' >> "$CAPTURE_FILE"
echo "$PREVIEW_START" | jq . >> "$CAPTURE_FILE" 2>/dev/null || echo "$PREVIEW_START" >> "$CAPTURE_FILE"
echo '```' >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

# Extract session ID
SESSION=$(echo "$PREVIEW_START" | jq -r '.result.sessionId // .sessionId' 2>/dev/null)

if [ -z "$SESSION" ] || [ "$SESSION" = "null" ]; then
  echo "❌ Failed to start preview session"
  echo "Raw output: $PREVIEW_START"
  exit 1
fi

echo "✅ Session: $SESSION"
echo ""

# Helper function to capture SF CLI message
send_message() {
  local step_num=$1
  local step_name=$2
  local message=$3

  echo "## Step $step_num: $step_name" >> "$CAPTURE_FILE"
  echo "" >> "$CAPTURE_FILE"

  echo "### Command" >> "$CAPTURE_FILE"
  echo '```bash' >> "$CAPTURE_FILE"
  echo "sf agent preview send --json --authoring-bundle Quoting_Agent --session-id $SESSION -u \"$message\"" >> "$CAPTURE_FILE"
  echo '```' >> "$CAPTURE_FILE"
  echo "" >> "$CAPTURE_FILE"

  local response=$(sf agent preview send --json --authoring-bundle Quoting_Agent --session-id "$SESSION" -u "$message" 2>&1)

  echo "### Response" >> "$CAPTURE_FILE"
  echo '```json' >> "$CAPTURE_FILE"
  echo "$response" | jq . >> "$CAPTURE_FILE" 2>/dev/null || echo "$response" >> "$CAPTURE_FILE"
  echo '```' >> "$CAPTURE_FILE"
  echo "" >> "$CAPTURE_FILE"

  echo "✅ Step $step_num: $step_name"
}

# Step 0: Initialize format if JSON mode
if [ "$SF_MODE" = "json" ]; then
  echo "Step 0: Initialize JSON Format"
  send_message "0" "Initialize JSON Format" "output_format: json"
  sleep 1
fi

# Step 1: Search for Omega
echo "Step 1: Search for Omega"
send_message "1" "Search for Omega" "search for Omega"
sleep 1

# Step 2: Select Omega
echo "Step 2: Select Omega"
send_message "2" "Select Omega (1)" "select 1"
sleep 1

# Step 3: Search NH3
echo "Step 3: Search for NH3 fertilizers"
send_message "3" "Search for NH3 Fertilizers" "search for NH3 fertilizer"
sleep 1

# Step 4: Add NH3 (15)
echo "Step 4: Add 15 units of NH3 solution"
send_message "4" "Add 15 units NH3 solution" "add 15 units of NH3 solution"
sleep 1

# Step 5: Add urea (10)
echo "Step 5: Add 10 units of urea"
send_message "5" "Add 10 units urea" "add 10 units of urea"
sleep 1

# Step 6: Add NH4OH (3)
echo "Step 6: Add 3 units of NH4OH"
send_message "6" "Add 3 units NH4OH" "add 3 units of NH4OH"
sleep 1

# Step 7: Add soda bicarb (1)
echo "Step 7: Add 1 unit of soda bicarb"
send_message "7" "Add 1 unit soda bicarb" "add 1 unit of soda bicarb"
sleep 1

# Step 8: Remove NH4OH
echo "Step 8: Remove all NH4OH"
send_message "8" "Remove all NH4OH" "remove all NH4OH from cart"
sleep 1

# Step 9: Update soda bicarb (2)
echo "Step 9: Update soda bicarb to 2"
send_message "9" "Update soda bicarb to 2" "update soda bicarb to 2 units"
sleep 1

# Step 10: Create Quote
DATETIME=$(date +"%Y-%m-%d %H:%M:%S")
RANDOM_ID=$((RANDOM % 10000))
QUOTE_NAME="E2E Test ${DATETIME} ${RANDOM_ID}"

echo "Step 10: Create Quote"
send_message "10" "Create Quote" "create a quote called ${QUOTE_NAME}"
sleep 1

# Step 11: Start fresh
echo "Step 11: Start Over"
send_message "11" "Start Over" "start over"
echo ""

# End preview session
echo "## Preview Session End" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

echo "### Command" >> "$CAPTURE_FILE"
echo '```bash' >> "$CAPTURE_FILE"
echo "sf agent preview stop --json --authoring-bundle Quoting_Agent --session-id $SESSION" >> "$CAPTURE_FILE"
echo '```' >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

PREVIEW_END=$(sf agent preview stop --json --authoring-bundle Quoting_Agent --session-id "$SESSION" 2>&1)

echo "### Response" >> "$CAPTURE_FILE"
echo '```json' >> "$CAPTURE_FILE"
echo "$PREVIEW_END" | jq . >> "$CAPTURE_FILE" 2>/dev/null || echo "$PREVIEW_END" >> "$CAPTURE_FILE"
echo '```' >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"

# Add footer
echo "" >> "$CAPTURE_FILE"
echo "---" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"
echo "**Test Completed:** $(date)" >> "$CAPTURE_FILE"
echo "" >> "$CAPTURE_FILE"
echo "All raw Salesforce CLI responses captured above. This is the direct agent output without server middleware transformation." >> "$CAPTURE_FILE"

echo ""
echo "✅ Capture complete!"
echo "📄 View results: $CAPTURE_FILE"
echo ""
echo "Quick view:"
tail -50 "$CAPTURE_FILE"
