#!/bin/bash

# E2E Test Runner - Bash Version
# Execute the Haiku Test (full quote creation flow)
# Usage: ./test-cases/run-e2e-test.sh

API_URL="${API_URL:-http://localhost:3001}"
PASS=0
FAIL=0

echo ""
echo "🚀 Starting E2E Test: Haiku Test - Full Quote Creation Flow"
echo "📍 API URL: $API_URL"
echo ""

# Create session
SESSION=$(curl -s -X POST "$API_URL/api/agent/session" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.sessionId')

if [ -z "$SESSION" ] || [ "$SESSION" = "null" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

echo "✅ Session created: $SESSION"
echo ""

# Test Step 1: Initialize
echo "📋 Step 1: Initialize Agent"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"output_format: json show me accounts\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .type')
if [ "$TYPE" = "account_search" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 2: Search for Omega Systems
echo "📋 Step 2: Search for Omega Systems"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"find Omega Systems\"}")
MSG=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .message')
if [[ "$MSG" == *"1 matching account"* ]]; then
  echo "   ✅ PASS"
  ((PASS++))
else
  echo "   ❌ FAIL - Message: $MSG"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 3: Select Account
echo "📋 Step 3: Select Omega Systems"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"select 1\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .type')
if [ "$TYPE" = "account_confirm" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 4: Search Products
echo "📋 Step 4: Search for NH3 Fertilizer"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"search for NH3 fertilizer\"}")
MSG=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .message')
if [[ "$MSG" == *"10 products"* ]]; then
  echo "   ✅ PASS"
  ((PASS++))
else
  echo "   ❌ FAIL - Message: $MSG"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 5: Add to Cart
echo "📋 Step 5: Add 10 Units of Urea"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 10 units of urea\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 6: Create Quote
echo "📋 Step 6: Create Quote 'Haiku test'"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"Create a quote called Haiku test\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .type')
MSG=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .message')
if [ "$TYPE" = "quote_created" ] && [[ "$MSG" == *"Thank you"* ]]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  echo "   Message: $MSG"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 7: Verify Fresh State
echo "📋 Step 7: Verify Fresh State"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"test\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .type')
MSG=$(echo "$RESULT" | jq -r '.agentMessage | fromjson | .message')
# After quote creation, agent should be back in account_search state (fresh state)
if [ "$TYPE" = "account_search" ]; then
  echo "   ✅ PASS (fresh state: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL - Expected account_search but got: $TYPE"
  echo "   Message: $MSG"
  ((FAIL++))
fi
echo ""

# End session
curl -s -X DELETE "$API_URL/api/agent/session/$SESSION" > /dev/null

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
