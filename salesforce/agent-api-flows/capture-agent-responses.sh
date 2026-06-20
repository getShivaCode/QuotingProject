#!/bin/bash
# Capture Agent Responses - Full Quoting Flow
# This script demonstrates all steps in the quoting workflow
# and captures the raw API responses from the agent

set -e

API="http://localhost:3001/api"

# Capture test metadata
TEST_DATE=$(date "+%Y-%m-%d %H:%M:%S")
GIT_COMMIT=$(cd /Users/sbhajekar/SalesforceProjects/QuotingProject && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(cd /Users/sbhajekar/SalesforceProjects/QuotingProject && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

echo "=========================================="
echo "TEST METADATA"
echo "=========================================="
echo "Date: $TEST_DATE"
echo "Commit: $GIT_COMMIT"
echo "Branch: $GIT_BRANCH"
echo "Server: $API"
echo ""

echo "=========================================="
echo "STEP 1: Create Session"
echo "=========================================="
SESSION=$(curl -s -X POST "$API/agent/session" -H "Content-Type: application/json" -d '{}' | jq -r '.sessionId')
echo "SESSION: $SESSION"
echo ""
sleep 2

echo "=========================================="
echo "STEP 1a: Session auto-initialized with JSON mode"
echo "=========================================="
echo "✅ Session auto-initialized by server-side initializeSession()"
echo ""
echo "=========================================="
echo "STEP 2: Search for Accounts"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"find Omega Systems\"}" | jq '.'
sleep 1

echo ""
echo "=========================================="
echo "STEP 3: Select Account"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"select 1\"}" | jq '.'
sleep 2

echo ""
echo "=========================================="
echo "STEP 4: Search for Products (NH3)"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"search for NH3 fertilizer\"}" | jq '.'
sleep 2

echo ""
echo "=========================================="
echo "STEP 5: Add 10 Units of Urea"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 10 units of urea\"}" | jq '.'
sleep 2

echo ""
echo "=========================================="
echo "STEP 6: Remove 1 Unit of Urea"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"remove 1 unit of urea\"}" | jq '.'
sleep 2

echo ""
echo "=========================================="
echo "STEP 7: Create a Quote"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"create a quote\"}" | jq '.'
sleep 2

echo ""
echo "=========================================="
echo "STEP 8: Provide Quote Name"
echo "=========================================="
curl -s -X POST "$API/agent/message" -H "Content-Type: application/json" -d "{\"sessionId\":\"$SESSION\",\"message\":\"name it Test Quote March 2026\"}" | jq '.'

echo ""
echo "=========================================="
echo "Closing Session"
echo "=========================================="
curl -s -X DELETE "$API/agent/session/$SESSION" > /dev/null
echo "Done"
