#!/bin/bash

# E2E Test Runner - Bash Version
# Execute comprehensive quote creation flow with cart operations
# Usage: ./test-cases/run-e2e-test.sh [json|plaintext]
# Env: E2E_MODE=json|plaintext

API_URL="${API_URL:-http://localhost:3001}"
E2E_MODE="${E2E_MODE:-${1:-plaintext}}"
PASS=0
FAIL=0

echo ""
echo "🚀 Starting E2E Test: Comprehensive Quote Creation with Cart Operations"
echo "📍 API URL: $API_URL"
echo "📍 Mode: $E2E_MODE"
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

# Test Step 0: Initialize JSON format if requested
if [ "$E2E_MODE" = "json" ]; then
  echo "📋 Step 0: Initialize JSON Format"
  RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION\",\"message\":\"output_format: json\"}")
  TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
  if [ "$TYPE" = "account_search" ]; then
    echo "   ✅ PASS (type: $TYPE)"
    ((PASS++))
  else
    echo "   ❌ FAIL (type: $TYPE)"
    ((FAIL++))
  fi
  echo ""
  sleep 1
fi

# Test Step 1: Search for Omega account
echo "📋 Step 1: Search for Omega account"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"search for Omega\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "account_search" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 2: Select Omega Technologies
echo "📋 Step 2: Select Omega Technologies"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"select 1\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "account_confirm" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 3: Search for NH3 fertilizers
echo "📋 Step 3: Search for NH3 related fertilizers"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"search for NH3 fertilizer\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "product_search" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 4: Add 15 units of NH3 solution
echo "📋 Step 4: Add 15 units of NH3 solution"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 15 units of NH3 solution\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 5: Add 10 units of urea
echo "📋 Step 5: Add 10 units of urea"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 10 units of urea\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 6: Add 3 units of NH4OH
echo "📋 Step 6: Add 3 units of NH4OH"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 3 units of NH4OH\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 7: Add 1 unit of soda bicarb
echo "📋 Step 7: Add 1 unit of soda bicarb"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 1 unit of soda bicarb\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 8: Delete all NH4OH from cart
echo "📋 Step 8: Delete all NH4OH from cart"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"remove all NH4OH from cart\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 9: Increase soda bicarb to 2 units
echo "📋 Step 9: Increase soda bicarb to 2 units"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"update soda bicarb to 2 units\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
if [ "$TYPE" = "cart_update" ]; then
  echo "   ✅ PASS (type: $TYPE)"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  ((FAIL++))
fi
echo ""
sleep 1

# Test Step 10: Create Quote with dynamic name
DATETIME=$(date +"%Y-%m-%d %H:%M:%S")
RANDOM_ID=$((RANDOM % 10000))
QUOTE_NAME="E2E Test ${DATETIME} ${RANDOM_ID}"

echo "📋 Step 10: Create Quote"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"create a quote called ${QUOTE_NAME}\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
MSG=$(echo "$RESULT" | jq -r '.agentMessage.message')
if [ "$TYPE" = "quote_created" ] && [[ "$MSG" == *"created successfully"* ]]; then
  echo "   ✅ PASS (type: $TYPE)"
  echo "   Quote Name: $QUOTE_NAME"
  ((PASS++))
else
  echo "   ❌ FAIL (type: $TYPE)"
  echo "   Message: $MSG"
  ((FAIL++))
fi
echo ""
sleep 2

# Test Step 11: Verify Fresh State
echo "📋 Step 11: Verify Fresh State"
RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"start over\"}")
TYPE=$(echo "$RESULT" | jq -r '.agentMessage.type')
MSG=$(echo "$RESULT" | jq -r '.agentMessage.message')
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
