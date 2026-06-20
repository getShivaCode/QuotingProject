# REST API Refactor Implementation Guide

**Status:** In-progress (not deployed), parked for CLI stability assessment.

**Why:** Heroku deployment requires removing SF CLI dependency. Direct REST API calls instead of CLI wrappers.

**Tokens spent on this:** ~8000 tokens in current session.

---

## Architecture Overview

### Before (CLI-based)
```
React Client → Node Server (execSync SF CLI) → SF CLI → Salesforce Agent API
```

### After (REST API direct)
```
React Client → Node Server (OAuth + direct HTTP) → Salesforce Einstein Agent API
```

---

## Environment Setup

### Required Environment Variables

```bash
# OAuth 2.0 Client Credentials (from connected app)
# ⚠️ DO NOT COMMIT REAL CREDENTIALS TO VERSION CONTROL
SF_OAUTH_CLIENT_ID=<your_client_id>
SF_OAUTH_CLIENT_SECRET=<your_client_secret>

# Salesforce Instance
SF_INSTANCE_URL=https://<your-instance>.my.salesforce.com

# Agent Configuration
SF_AGENT_ID=<your_agent_id>

# Server
PORT=3001
```

### Create Connected App in Salesforce

1. Setup → Apps → App Manager → New Connected App
2. Configure OAuth:
   - Callback URL: `http://localhost:3001/callback`
   - Scopes: `api`, `refresh_token`
3. Approve for admin use
4. Copy Client ID & Secret

---

## Implementation: server.js

### Key Changes

**1. OAuth Token Management**

```javascript
let cachedAccessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Return cached token if still valid (50 min cache)
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const response = await fetch(`${INSTANCE_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (50 * 60 * 1000);
  return cachedAccessToken;
}
```

**2. REST API Endpoints**

All three endpoints follow this pattern:
- Get OAuth token
- Build API URL with Bearer auth
- Parse response and extract data
- Return structured response

```javascript
// Example: POST /api/agent/message
const accessToken = await getAccessToken();

const response = await fetch(
  `https://api.salesforce.com/einstein/ai-agent/v1/sessions/${sessionId}/messages`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        sequenceId: Math.floor(Math.random() * 10000),
        type: 'Text',
        text: message,
      },
    }),
  }
);

const data = await response.json();
const resultData = data.messages?.[0]?.result?.[0]?.value || null;

res.json({
  agentMessage: data.messages?.[0]?.message || '',
  type: data.messages?.[0]?.type || 'Unknown',
  data: resultData,  // ← Structured action output
  raw: data
});
```

### Critical Salesforce Endpoints

```
POST   /einstein/ai-agent/v1/agents/{agentId}/sessions
POST   /einstein/ai-agent/v1/sessions/{sessionId}/messages
DELETE /einstein/ai-agent/v1/sessions/{sessionId}
```

**Reference:** https://developer.salesforce.com/docs/ai/agentforce/guide/agent-api-examples.html

---

## Implementation: React Components

### agentApi.ts - Enhanced Message Parsing

```typescript
// Three-tier fallback for getting structured data:

// Tier 1: Parse agentMessage as JSON (if agent outputs full JSON)
try {
  const parsed = JSON.parse(data.agentMessage);
  return parsed as AgentMessage;
}

// Tier 2: Use server-extracted data field + intelligent type inference
if (data.data) {
  let inferredType = data.type;
  if (data.data.updatedCart || data.data.cartSummary) 
    inferredType = 'cart_update';
  else if (data.data.quoteNumber) 
    inferredType = 'quote_created';
  
  return {
    type: inferredType,
    message: data.agentMessage,
    data: data.data,
    actions: [],
  };
}

// Tier 3: Detect quote creation from message text (regex fallback)
if (data.agentMessage.toLowerCase().includes('quote') &&
    data.agentMessage.toLowerCase().includes('created')) {
  const quoteMatch = data.agentMessage.match(/[Qq]uote\s+(?:[Nn]umber|ID)[:\s]+([A-Z0-9]+)/i);
  const nameMatch = data.agentMessage.match(/"([^"]+)"/);
  
  if (quoteMatch || nameMatch) {
    return {
      type: 'quote_created',
      message: data.agentMessage,
      data: {
        quoteNumber: quoteMatch?.[1] || 'Generated',
        quoteName: nameMatch?.[1] || 'Quote',
        status: 'Draft',
      },
      actions: [],
    };
  }
}
```

### HeadlessAgentForce.tsx - Smart Data Detection

```typescript
// Override type based on actual data structure
let { type, data } = liveResponseData;

if (data && typeof data === 'object') {
  if (data.updatedCart || data.cartSummary) type = 'cart_update';
  else if (data.quoteNumber) type = 'quote_created';
}

switch (type) {
  case 'cart_update':
    // Parse JSON string if needed
    let cartData = data;
    if (data.updatedCart && typeof data.updatedCart === 'string') {
      cartData = JSON.parse(data.updatedCart);
    }
    return <CartCard cartData={cartData} {...props} />;
  
  case 'quote_created':
    return <QuoteCard quoteData={data} />;
  
  // ... other cases
}
```

---

## Known Issues & Limitations

### 1. Agent Instructions Not Deployed
- Modified `Quoting_Agent.agent` to default to JSON output format
- **Issue:** Salesforce org connection error (HTTP 420) prevented deployment
- **Impact:** Agent still returns text, not structured JSON
- **Workaround:** Frontend uses fallback detection (Tier 2 & 3 parsing)

### 2. Action Output Not Always Present
- When agent responds with "Inform" type, `result[]` is often empty
- Action outputs (cart data, quote details) aren't in the structured response
- **Workaround:** Server extracts from `data` field; frontend detects from message text

### 3. OAuth Token Refresh
- Current implementation: Static token in .env (dev only)
- Production would need: Refresh token handling + secure token storage

---

## What Still Needs Completion

### Before Production

1. **Deploy Agent Instructions**
   ```bash
   cd salesforce
   sf agent publish authoring-bundle --api-name Quoting_Agent -o agentforce
   sf agent activate --api-name Quoting_Agent -o agentforce
   ```
   - Requires fixing Salesforce org connection (HTTP 420 error)
   - Once deployed, agent will respond with proper JSON format

2. **Implement Token Refresh**
   - Add refresh token rotation
   - Secure token storage (not .env)
   - Handle 401 responses gracefully

3. **Add Error Handling**
   - Handle API rate limits
   - Retry logic with exponential backoff
   - User-friendly error messages

4. **Test Against Production**
   - Full workflow testing
   - Performance profiling vs CLI
   - Concurrent session handling

---

## Debugging Commands

### Test OAuth Token
```bash
curl -X POST "https://trailsignup-816972be03897e.my.salesforce.com/services/oauth2/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET" | jq
```

### Test Session Creation
```bash
curl -X POST "https://api.salesforce.com/einstein/ai-agent/v1/agents/0Xxfj000001zIM1CAM/sessions" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "externalSessionKey": "'$(uuidgen)'",
    "instanceConfig": {"endpoint": "https://trailsignup-816972be03897e.my.salesforce.com"},
    "streamingCapabilities": {"chunkTypes": ["Text"]}
  }' | jq
```

### Test Message Send
```bash
curl -X POST "https://api.salesforce.com/einstein/ai-agent/v1/sessions/{SESSION_ID}/messages" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":{"sequenceId":1,"type":"Text","text":"hello"}}' | jq
```

---

## Performance Comparison

| Metric | CLI | REST API |
|--------|-----|----------|
| Session Start | 2-3s | 1-2s |
| Message Send | 3-5s | 2-4s |
| Overhead | SF CLI startup | OAuth token cache |
| Deployment | Requires CLI installed | Environment variables only |

---

## File Changes Summary

| File | Change | Status |
|------|--------|--------|
| `server.js` | Complete rewrite: OAuth + REST API | Implemented |
| `agentApi.ts` | Three-tier data extraction | Implemented |
| `HeadlessAgentForce.tsx` | Smart type detection | Implemented |
| `Quoting_Agent.agent` | JSON output instructions | Not deployed |
| `.env.local` | OAuth credentials | Updated |
| `.env.example` | Template documentation | Created |

---

## Decision Points

**If resuming this work:**

1. **Fix Salesforce Org Connection** (Priority 1)
   - Investigate HTTP 420 error
   - Redeploy agent instructions
   - Verify JSON output mode works

2. **Remove Fallback Regex Detection** (Priority 2)
   - Once agent outputs proper JSON
   - Clean up agentApi.ts Tier 3 fallback
   - Simplify React component logic

3. **Add Token Refresh** (Priority 3)
   - Implement refresh token flow
   - Add secure token storage
   - Handle 401 errors

4. **Performance Testing** (Priority 4)
   - Benchmark against CLI
   - Load test concurrent sessions
   - Compare Heroku deployment

---

## References

- Salesforce Agent API: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-api.html
- OAuth 2.0 Client Credentials: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/oauth_client_credentials_flow.html
- Agent Script Language: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html

---

**Last Updated:** June 2, 2026
**Status:** Parked - CLI approach deemed more reliable
**Next Step:** Fix Salesforce org connection if REST API becomes priority
