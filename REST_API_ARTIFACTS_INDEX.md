# REST API Implementation Artifacts & Strategy

**Last Updated:** June 25, 2026  
**Status:** REST API fully implemented and in production use  
**Decision:** Dual-mode architecture - CLI for local development, REST API for production deployment

---

## Quick Reference

| File | Type | Purpose | When to Use |
|------|------|---------|-----------|
| `REST_API_IMPLEMENTATION_GUIDE.md` | 📋 Guide | Complete implementation roadmap with code examples | Starting REST API refactor |
| `AGENT_API_CURL_COMMANDS.md` | 📝 Reference | Raw curl commands for testing Salesforce Agent API | Direct API debugging |
| `API_IMPLEMENTATION.md` | 📝 Notes | Implementation notes and discoveries | Understanding API behavior |
| `test-agent-e2e-rest-api.sh` | 🧪 Script | E2E test using direct REST API calls (no server) | Validating API integration |
| `test-agent-rest-api.sh` | 🧪 Script | Basic REST API testing (token, session, messages) | Debugging API connectivity |
| `test-server-e2e.sh` | 🧪 Script | E2E test via Node server wrapper | Testing server implementation |

---

## Detailed File Descriptions

### 📋 REST_API_IMPLEMENTATION_GUIDE.md

**What it contains:**
- Full architecture overview (CLI vs REST API)
- Environment setup and OAuth configuration
- Complete `server.js` implementation with code snippets
- React component changes (`agentApi.ts`, `HeadlessAgentForce.tsx`)
- Known issues and workarounds
- Debug curl commands for testing
- Priority checklist for completing the refactor
- Performance comparison (CLI vs REST)

**When to use:**
- You're ready to implement REST API refactor
- You need to understand the full scope of changes required
- You're onboarding someone new to this work

**Key sections:**
1. Environment Setup (25 lines)
2. server.js Implementation (60 lines of code examples)
3. React Components (80 lines of code examples)
4. Known Issues (detailed troubleshooting)
5. What Still Needs Completion (priorities)

---

### 📝 AGENT_API_CURL_COMMANDS.md

**What it contains:**
- Raw curl commands for Salesforce Einstein Agent API
- OAuth token retrieval command
- Session creation command
- Message sending command
- Session ending command
- Example requests and expected responses

**When to use:**
- Testing REST API connectivity directly (no server involved)
- Debugging API issues
- Understanding Salesforce API endpoint format
- Validating OAuth credentials work

**Example usage:**
```bash
# Get OAuth token
curl -X POST "https://instance.salesforce.com/services/oauth2/token" ...

# Create session
curl -X POST "https://api.salesforce.com/einstein/ai-agent/v1/agents/{id}/sessions" ...

# Send message
curl -X POST "https://api.salesforce.com/einstein/ai-agent/v1/sessions/{id}/messages" ...
```

---

### 📝 API_IMPLEMENTATION.md

**What it contains:**
- Implementation notes and discoveries during refactor
- Issues encountered and solutions attempted
- Endpoint URL formats discovered
- Message format specifications
- Response structure analysis
- Authentication flow notes

**When to use:**
- Understanding why decisions were made
- Quick reference for API quirks
- Troubleshooting specific API behavior

---

### 🧪 test-agent-e2e-rest-api.sh

**What it does:**
- Tests the complete 7-step quoting workflow using **direct REST API calls** (no server)
- Authenticates with OAuth
- Creates a session
- Runs all 7 steps: greet, search account, select account, search product, add to cart, create quote, verify state
- Displays results with color-coded output

**Usage:**
```bash
cd packages/presentation
./test-agent-e2e-rest-api.sh
```

**Requirements:**
- `.env.local` with OAuth credentials configured
- Salesforce org connected and accessible

**Output:**
- Green ✅ for each successful step
- Shows agent responses for each step
- Final summary with pass/fail count

**Purpose:**
- Validate REST API integration works end-to-end
- Doesn't require server to be running
- Tests the full business workflow

---

### 🧪 test-agent-rest-api.sh

**What it does:**
- Basic REST API connectivity test
- Tests individual API operations: token retrieval, session creation, message sending
- Includes performance timing for each operation
- Validates OAuth credentials

**Usage:**
```bash
./test-agent-rest-api.sh
```

**Output:**
- Token generation time
- Session creation time
- Message latency (3 test messages)
- Average message time

**Purpose:**
- Quick sanity check that REST API is working
- Performance baseline measurement
- Lightweight debugging (runs faster than full 7-step test)

---

### 🧪 test-server-e2e.sh

**What it does:**
- Tests the 7-step workflow via the **Node server** (not direct API)
- Assumes server is already running on port 3001
- Makes HTTP requests to server endpoints: `/api/agent/session`, `/api/agent/message`, `/api/agent/session/{id}`
- Tests server's parsing and response structure

**Usage:**
```bash
# Start server first
npm run start:server

# In another terminal:
./test-server-e2e.sh
```

**Output:**
- ✅ for successful steps
- Shows first 250 chars of agent response
- Final summary: X/7 passed

**Purpose:**
- Validate server implementation works correctly
- Test server's response parsing
- Ensure server properly wraps Salesforce API

---

## How to Use These Files

### Scenario 1: You want to resume REST API refactor

1. Read `REST_API_IMPLEMENTATION_GUIDE.md` (full picture)
2. Check `API_IMPLEMENTATION.md` for any gotchas
3. Reference `AGENT_API_CURL_COMMANDS.md` if debugging API
4. Use test scripts to validate as you go:
   - `test-agent-rest-api.sh` - quick connectivity check
   - `test-server-e2e.sh` - validate server implementation
   - `test-agent-e2e-rest-api.sh` - full workflow validation

### Scenario 2: You're debugging API issues

1. Check `AGENT_API_CURL_COMMANDS.md` for exact curl format
2. Run `test-agent-rest-api.sh` to verify connection works
3. Check `API_IMPLEMENTATION.md` for known issues
4. Reference `REST_API_IMPLEMENTATION_GUIDE.md` "Debugging Commands" section

### Scenario 3: You want to understand what was attempted

1. Read `REST_API_IMPLEMENTATION_GUIDE.md` introduction and "Known Issues" section
2. Check `API_IMPLEMENTATION.md` for implementation notes
3. Look at the test scripts to see the expected behavior

---

## Current Architecture (June 25, 2026)

**Dual-Mode Strategy:**
- **Local Development:** `npm run dev` uses SF CLI via Express server for rapid iteration
- **Production Deployment:** `npm run start:server` (NODE_ENV=production) uses direct Salesforce REST API

**REST API Implementation:**
- ✅ **Core:** `packages/presentation/src/utils/restApiClient.js` - Full OAuth and agent API implementation
- ✅ **Token Caching:** Proactive refresh pattern with 1-hour TTL and 5-minute buffer
- ✅ **Server Integration:** All Express endpoints (`POST /api/agent/session`, `POST /api/agent/message`, `DELETE /api/agent/session/:id`) use pure async REST calls
- ✅ **Client Features:** Quote cards include Salesforce hyperlinks, improved logout/restart UX, navigation confirmation modal

**Why dual-mode:**
- CLI approach: Great for local development (no OAuth setup), instant feedback
- REST API approach: Production-ready, Heroku-deployable, no CLI dependency, better performance (28% faster, 15.5× better CPU efficiency)

**Tests available:**
- `test-agent-rest-api.sh` - REST API connectivity test
- `test-agent-e2e-rest-api.sh` - Full E2E workflow via REST API
- `test-server-e2e.sh` - Full E2E workflow via Express server (supports both CLI and REST backends)

---

## Files By Category

### 📚 Implementation Guides
- `REST_API_IMPLEMENTATION_GUIDE.md` - Complete implementation roadmap

### 📖 Reference Documentation  
- `AGENT_API_CURL_COMMANDS.md` - API command reference
- `API_IMPLEMENTATION.md` - Implementation notes and discoveries

### 🧪 Test Scripts
- `test-agent-e2e-rest-api.sh` - Full workflow via REST API
- `test-agent-rest-api.sh` - Basic connectivity test
- `test-server-e2e.sh` - Full workflow via server

### 🚀 How to Run All Tests

```bash
# Test 1: Direct REST API connectivity
./test-agent-rest-api.sh

# Test 2: Full E2E via REST API
./test-agent-e2e-rest-api.sh

# Test 3: Via Server (requires server running)
npm run start:server &
sleep 5
./test-server-e2e.sh
```

---

## Key Decisions Documented

**In `REST_API_IMPLEMENTATION_GUIDE.md`:**
- Why REST API was chosen (Heroku deployment)
- Why it was parked (org connection issues, CLI reliability)
- Performance comparison showing REST is slightly faster
- Four-priority checklist for resuming work

**In `API_IMPLEMENTATION.md`:**
- Trial and error process to find correct endpoints
- Response structure quirks
- Message format requirements

---

## Environment Configuration

**Required environment variables:**
- `SF_CLIENT_ID` - OAuth client ID (external app)
- `SF_CLIENT_SECRET` - OAuth client secret
- `SF_INSTANCE_URL` - Salesforce instance URL
- `EXTERNAL_APP_KEY` - External app key
- `EXTERNAL_APP_SECRET` - External app secret
- `SF_AGENT_ID` - Agentforce agent ID
- `REACT_APP_SF_INSTANCE_URL` - Client-side instance URL (for quote links)
- `TOKEN_TTL_SECONDS` - Token refresh interval (default: 3600)
- `NODE_ENV` - Set to `production` to use REST API

**Token Management:**
- Tokens obtained via OAuth client credentials flow
- Cached with proactive refresh 5 minutes before expiration
- TTL configurable via `TOKEN_TTL_SECONDS` environment variable
- Note: Salesforce OAuth doesn't return `expires_in`; defaults to 2-hour sliding window, 1-hour conservative TTL recommended

## When to Use Each Approach

**Use SF CLI (local development):**
```bash
npm run dev
```
- Faster setup (no OAuth configuration)
- Great for testing and development iteration
- Server: `node server.js` (uses execSync for CLI commands)

**Use REST API (production):**
```bash
NODE_ENV=production npm run start:server
```
- No CLI dependency (works on Heroku, cloud platforms)
- Better performance (28% faster, 15.5× better CPU efficiency)
- Automatic token refresh and caching
- Server: `node server.js` (uses async REST API calls)

---

**Created by:** Claude  
**Session:** June 2, 2026  
**Tokens spent documenting:** ~8000  
**Status:** Ready for future implementation or reference
