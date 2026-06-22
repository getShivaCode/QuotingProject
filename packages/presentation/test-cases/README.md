# E2E Test Cases

## Overview

Three test runners for the Quoting Agent, each with different data sources:

| Script | Source | Use Case |
|--------|--------|----------|
| `run-e2e-test.sh` | Server API (Node proxy) | Primary E2E tests, normal testing |
| `run-e2e-test-capture.sh` | Server API with full response capture | Debugging, detailed analysis |
| `run-e2e-test-sf-cli.sh` | Salesforce CLI direct | Raw agent output verification |
| `run-e2e-test-rest-api.sh` | Salesforce Agent REST API (Future) | Direct REST API testing without CLI |

---

## 1. Server-Based Tests (CLI Proxy)

### `run-e2e-test.sh` - Main Test

Execute the complete quote creation flow via the Node.js server proxy:

```bash
# Default (plaintext mode)
./packages/presentation/test-cases/run-e2e-test.sh

# JSON mode
./packages/presentation/test-cases/run-e2e-test.sh json

# With custom API URL
API_URL=http://localhost:5000 ./packages/presentation/test-cases/run-e2e-test.sh
```

**11 Test Steps:**
1. Search for Omega account
2. Select Omega Technologies  
3. Search for NH3 fertilizers
4. Add 15 units of NH3 solution
5. Add 10 units of urea
6. Add 3 units of NH4OH
7. Add 1 unit of soda bicarb
8. Remove all NH4OH
9. Update soda bicarb to 2 units
10. Create quote (with dynamic timestamp)
11. Verify fresh state

---

### `run-e2e-test-capture.sh` - Request/Response Capture

Captures all requests and responses with optional full payloads:

```bash
# Plaintext mode
./packages/presentation/test-cases/run-e2e-test-capture.sh plaintext

# JSON mode
./packages/presentation/test-cases/run-e2e-test-capture.sh json
```

Output: `stdout` + markdown file with formatted requests/responses

---

## 2. Raw Agent Output Tests

### `run-e2e-test-sf-cli.sh` - Direct Salesforce CLI

Captures raw Salesforce CLI agent responses without server transformation:

```bash
./packages/presentation/test-cases/run-e2e-test-sf-cli.sh [json|plaintext]
```

Use this to debug agent behavior directly from Salesforce.

---

## 3. REST API Test (Direct)

### `run-e2e-test-rest-api.sh` - Salesforce Agent REST API

Calls Salesforce Agent REST API directly with OAuth 2.0 client credentials flow. This is the **next frontier** - testing without CLI proxy.

**Required in `.env.local`:**
- `SF_INSTANCE_URL` - Salesforce org instance
- `SF_AGENT_ID` - Agent ID
- `EXTERNAL_APP_KEY` - OAuth client ID (or `SF_OAUTH_CLIENT_ID`)
- `EXTERNAL_APP_SECRET` - OAuth client secret (or `SF_OAUTH_CLIENT_SECRET`)

```bash
./packages/presentation/test-cases/run-e2e-test-rest-api.sh
```

**What it does:**
1. Gets OAuth access token via client credentials flow
2. Creates REST API session with agent
3. Sends 7 test messages
4. Validates responses
5. Prints summary

**7 Test Steps:**
1. Hello (initialize)
2. Search for Omega Systems
3. Select Omega Systems
4. Search for NH3 Fertilizer
5. Add 10 units of Urea
6. Create quote "Haiku test"
7. Verify fresh state

---

## Test Flow

All tests follow the same flow:

```
Create Session
    ↓
Step 1-11: Send Messages & Verify Responses
    ↓
End Session
    ↓
Print Summary
```

## Environment Setup

For server-based tests:

```bash
# Start dev server (CLI proxy + React client)
cd packages/presentation
npm run dev

# Or start server only
npm run start:server
```

For REST API tests, ensure `.env.local` has:
- `SF_ACCESS_TOKEN` - OAuth token
- `SF_INSTANCE_URL` - Salesforce org URL
- `SF_AGENT_ID` - Agent ID from Salesforce

---

## Logging

Server logs to stdout with configurable levels:

```bash
LOG_LEVEL=debug npm run dev
```

Log levels: `error`, `warning` (default), `info`, `debug`

---

## Debug Mode (Server Tests Only)

Get full Salesforce CLI response in test output:

```bash
# Server with debug logging
LOG_LEVEL=debug ./packages/presentation/test-cases/run-e2e-test-capture.sh json
```

---

## Test Data

All tests use:
- **Account:** Omega (various Omega companies exist - select 1st)
- **Products:** NH3-related chemicals (Ammonia Solution, Urea, etc.)
- **Operations:** Add/remove/update cart items
- **Quote:** Dynamic name with timestamp: `E2E Test YYYY-MM-DD HH:MM:SS RANDOMID`

---

## Success Criteria

All 11 steps must pass:
- ✅ Correct response type returned
- ✅ Session maintained throughout
- ✅ State transitions correctly (search → confirm → product → cart → quote)
- ✅ Cart operations preserve items
- ✅ Quote creation clears cart and resets state

Success Rate = (Passed Steps / Total Steps) × 100%

---

## REST API Reference

### OAuth 2.0 Client Credentials Flow

**Step 1: Get Access Token**

```bash
curl -s https://<SF_INSTANCE_URL>/services/oauth2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=<EXTERNAL_APP_KEY>' \
  --data-urlencode 'client_secret=<EXTERNAL_APP_SECRET>'
```

**Response:**
```json
{
  "access_token": "eyJ0bmsiOiJjb3JlL3Byb2QvMDADfj...",
  "token_format": "jwt",
  "scope": "sfap_api chatbot_api api",
  "token_type": "Bearer"
}
```

### Agent REST API Endpoints

**Create Session**

```bash
POST https://api.salesforce.com/einstein/ai-agent/v1/agents/{AGENT_ID}/sessions
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "externalSessionKey": "uuid-here",
  "instanceConfig": {
    "endpoint": "https://your-instance.my.salesforce.com"
  },
  "streamingCapabilities": {
    "chunkTypes": ["Text"]
  }
}
```

**Send Message**

```bash
POST https://api.salesforce.com/einstein/ai-agent/v1/sessions/{SESSION_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "message": {
    "sequenceId": 1,
    "type": "Text",
    "text": "search for Omega"
  }
}
```

**Delete Session**

```bash
DELETE https://api.salesforce.com/einstein/ai-agent/v1/sessions/{SESSION_ID}
Authorization: Bearer {ACCESS_TOKEN}
```

### Required Environment Variables

For REST API tests, set in `.env.local`:

```bash
SF_INSTANCE_URL=https://your-instance.my.salesforce.com
SF_AGENT_ID=0Xxfj000001zIM1CAM
EXTERNAL_APP_KEY=your_oauth_client_id
EXTERNAL_APP_SECRET=your_oauth_client_secret
```

### OAuth Scopes Required

The connected app must have these scopes:
- `sfap_api` - Agent Platform API
- `chatbot_api` - Chatbot API
- `api` - Standard API

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Failed to create session` | Ensure `npm run dev` is running on port 3001 (for server tests) |
| `Cannot find .env.local` | Create it from `.env.example` with your credentials |
| `Missing SF_ACCESS_TOKEN` | REST API test uses EXTERNAL_APP_KEY/SECRET, not SF_ACCESS_TOKEN |
| `Port 3000/3001 already in use` | Kill existing processes or use different port |
| `401 Unauthorized` | Verify OAuth token hasn't expired; scopes include sfap_api |
| `404 Agent not found` | Verify SF_AGENT_ID is correct and published |

---

**Last Updated:** 2026-06-22
**Documentation Source:** Consolidated from AGENT_API_CURL_COMMANDS.md
