#!/bin/bash

##############################################################################
# E2E Test Against Running Server
# Tests the full 7-step quoting workflow via the Node server
##############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3001"
PASS=0
FAIL=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}E2E Test: Server REST API${NC}"
echo -e "${BLUE}Full Quoting Workflow (7 Steps)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create session
echo -e "${YELLOW}🚀 Creating Session...${NC}"
SESSION=$(curl -s -X POST "$API_URL/api/agent/session" | jq -r '.sessionId')
echo -e "${GREEN}✅ Session: $SESSION${NC}"
echo ""

send_message() {
  local step=$1
  local msg=$2

  echo -e "${YELLOW}📋 Step $step: $msg${NC}"
  RESULT=$(curl -s -X POST "$API_URL/api/agent/message" \
    -H 'Content-Type: application/json' \
    -d "{\"sessionId\":\"$SESSION\",\"message\":\"$msg\"}")

  AGENT_MSG=$(echo "$RESULT" | jq -r '.agentMessage // empty')

  if [ -z "$AGENT_MSG" ]; then
    echo -e "${RED}❌ No response${NC}"
    ((FAIL++))
    return 1
  fi

  echo -e "${GREEN}✅ Response:${NC}"
  echo "$AGENT_MSG" | head -c 250
  echo ""
  echo ""
  ((PASS++))
  return 0
}

# Run 7 steps
send_message 1 "Hello"
send_message 2 "search for omega systems"
send_message 3 "I want to use Omega Systems"
send_message 4 "search for NH3 fertilizer"
send_message 5 "add 10 units of urea"
send_message 6 "create a quote called Haiku test"
send_message 7 "test"

# End session
curl -s -X DELETE "$API_URL/api/agent/session/$SESSION" > /dev/null

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "   ${GREEN}✅ Passed: $PASS/7${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "   ${RED}❌ Failed: $FAIL/7${NC}"
fi
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed via Server!${NC}"
  exit 0
else
  exit 1
fi
