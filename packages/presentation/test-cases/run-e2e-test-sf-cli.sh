#!/bin/bash

# Comprehensive E2E Test - Both JSON and Plaintext Modes
# Tests full workflow: account search, product search, cart, quote
# For plaintext: uses account names for selection

echo "🧪 E2E Test - Plaintext Mode (Full Workflow)"
echo ""

PLAINTEXT_TRACE="./temp_scripts/trace/e2e_plaintext_trace.md"
JSON_TRACE="./temp_scripts/trace/e2e_json_trace.md"

# ===== PLAINTEXT MODE TEST =====

cat > "$PLAINTEXT_TRACE" << 'EOF'
# E2E Test - Plaintext Mode

**Date:** $(date)
**Mode:** Plaintext (no json_format)
**Workflow:** Account search → Product search → Add to cart → Quote

---

## Session Start

EOF

echo "Starting Plaintext Mode Session..."
PLAIN_START=$(sf agent preview start --json --use-live-actions --authoring-bundle Quoting_Agent --target-org trailsignup 2>&1)
PLAIN_SESSION=$(echo "$PLAIN_START" | jq -r '.result.sessionId' 2>/dev/null)

if [ -z "$PLAIN_SESSION" ] || [ "$PLAIN_SESSION" = "null" ]; then
  echo "❌ Failed to start plaintext session"
  exit 1
fi

echo "✅ Plaintext Session: $PLAIN_SESSION"

send_plain_msg() {
  local step=$1
  local label=$2
  local msg=$3

  echo "## Step $step: $label" >> "$PLAINTEXT_TRACE"
  echo "" >> "$PLAINTEXT_TRACE"
  echo "### User Input" >> "$PLAINTEXT_TRACE"
  echo '```' >> "$PLAINTEXT_TRACE"
  echo "$msg" >> "$PLAINTEXT_TRACE"
  echo '```' >> "$PLAINTEXT_TRACE"
  echo "" >> "$PLAINTEXT_TRACE"

  local response=$(sf agent preview send --json --authoring-bundle Quoting_Agent --session-id "$PLAIN_SESSION" --target-org trailsignup -u "$msg" 2>&1)
  local agent_msg=$(echo "$response" | jq -r '.result.messages[0].message // empty' 2>/dev/null)

  echo "### Agent Response" >> "$PLAINTEXT_TRACE"
  echo '```' >> "$PLAINTEXT_TRACE"
  echo "$agent_msg" >> "$PLAINTEXT_TRACE"
  echo '```' >> "$PLAINTEXT_TRACE"
  echo "" >> "$PLAINTEXT_TRACE"

  echo "✅ $step: $label"
}

# Plaintext test steps
send_plain_msg "1" "Search Omega" "search for Omega"
sleep 1

send_plain_msg "2" "Select Omega Systems by name" "select Omega Systems"
sleep 1

send_plain_msg "3" "Search NH3 fertilizers" "search for NH3 fertilizer"
sleep 1

send_plain_msg "4" "Add 15 units ammonia solution" "add 15 units of ammonia solution 25%"
sleep 1

send_plain_msg "5" "Add 10 units urea" "add 10 units of urea"
sleep 1

send_plain_msg "6" "Add 3 units ammonium hydroxide" "add 3 units of ammonium hydroxide 28%"
sleep 1

send_plain_msg "7" "View cart" "show my cart"
sleep 1

send_plain_msg "8" "Create quote" "create a quote called E2E-Plaintext-Test-$(date +%s)"
sleep 1

echo "" >> "$PLAINTEXT_TRACE"
echo "---" >> "$PLAINTEXT_TRACE"
echo "**Plaintext Mode Test Complete:** $(date)" >> "$PLAINTEXT_TRACE"

echo ""
echo "🧪 E2E Test - JSON Mode (Full Workflow)"
echo ""

# ===== JSON MODE TEST =====

cat > "$JSON_TRACE" << 'EOF'
# E2E Test - JSON Mode

**Date:** $(date)
**Mode:** JSON (with json_format first)
**Workflow:** Account search → Product search → Add to cart → Quote

---

## Session Start

EOF

echo "Starting JSON Mode Session..."
JSON_START=$(sf agent preview start --json --use-live-actions --authoring-bundle Quoting_Agent --target-org trailsignup 2>&1)
JSON_SESSION=$(echo "$JSON_START" | jq -r '.result.sessionId' 2>/dev/null)

if [ -z "$JSON_SESSION" ] || [ "$JSON_SESSION" = "null" ]; then
  echo "❌ Failed to start JSON session"
  exit 1
fi

echo "✅ JSON Session: $JSON_SESSION"

send_json_msg() {
  local step=$1
  local label=$2
  local msg=$3

  echo "## Step $step: $label" >> "$JSON_TRACE"
  echo "" >> "$JSON_TRACE"
  echo "### User Input" >> "$JSON_TRACE"
  echo '```' >> "$JSON_TRACE"
  echo "$msg" >> "$JSON_TRACE"
  echo '```' >> "$JSON_TRACE"
  echo "" >> "$JSON_TRACE"

  local response=$(sf agent preview send --json --authoring-bundle Quoting_Agent --session-id "$JSON_SESSION" --target-org trailsignup -u "$msg" 2>&1)
  local agent_msg=$(echo "$response" | jq -r '.result.messages[0].message // empty' 2>/dev/null)

  echo "### Agent Response" >> "$JSON_TRACE"
  echo '```json' >> "$JSON_TRACE"
  echo "$agent_msg" | jq . >> "$JSON_TRACE" 2>/dev/null || echo "$agent_msg" >> "$JSON_TRACE"
  echo '```' >> "$JSON_TRACE"
  echo "" >> "$JSON_TRACE"

  echo "✅ $step: $label"
}

# JSON test steps
send_json_msg "0" "Initialize JSON Format" "json_format"
sleep 1

send_json_msg "1" "Search Omega" "search for Omega"
sleep 1

send_json_msg "2" "Select Omega Systems by name" "select Omega Systems"
sleep 1

send_json_msg "3" "Search NH3 fertilizers" "search for NH3 fertilizer"
sleep 1

send_json_msg "4" "Add 15 units ammonia solution" "add 15 units of ammonia solution 25%"
sleep 1

send_json_msg "5" "Add 10 units urea" "add 10 units of urea"
sleep 1

send_json_msg "6" "Add 3 units ammonium hydroxide" "add 3 units of ammonium hydroxide 28%"
sleep 1

send_json_msg "7" "View cart" "show my cart"
sleep 1

send_json_msg "8" "Create quote" "create a quote called E2E-JSON-Test-$(date +%s)"
sleep 1

echo "" >> "$JSON_TRACE"
echo "---" >> "$JSON_TRACE"
echo "**JSON Mode Test Complete:** $(date)" >> "$JSON_TRACE"

echo ""
echo "✅ Both E2E tests complete!"
echo "📄 Plaintext trace: $PLAINTEXT_TRACE"
echo "📄 JSON trace: $JSON_TRACE"
