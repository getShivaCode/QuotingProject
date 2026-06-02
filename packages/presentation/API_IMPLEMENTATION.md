# Salesforce Agent API Implementation

This document explains the two approaches for communicating with Salesforce Agentforce agents.

## Current Implementation: Salesforce CLI (✅ Working)

**Status:** Production-ready, all tests passing

**How it works:**
- Uses Salesforce CLI commands: `sf agent preview start/send/end`
- Subprocess calls via Node.js `execSync`
- Requires SF CLI installed on the server
- Requires org authentication setup (`.sfdx/`)

**Pros:**
- ✅ Fully functional
- ✅ All E2E tests pass (7/7 steps)
- ✅ Simple implementation
- ✅ Built-in error handling

**Cons:**
- ❌ Requires Salesforce CLI installation
- ❌ Cannot deploy to Heroku (CLI not available)
- ❌ Slower (subprocess overhead)
- ❌ Harder to scale

**Current File:** `server.js` (uses `execSync` for CLI commands)

### Running the App

```bash
cd packages/presentation
npm run dev  # Starts both servers
```

- React dev server: `http://localhost:3000`
- Node API server: `http://localhost:3001`

## Future Implementation: Salesforce REST API

**Status:** Ready to implement once agent is configured for REST API access

**How it works:**
- OAuth 2.0 client credentials flow for authentication
- Direct REST API calls to `https://api.salesforce.com/einstein/ai-agent/v1/agents/{agentId}/sessions`
- No CLI required

**Endpoint Details:**

### 1. Get OAuth Access Token

```bash
POST https://{instance}.my.salesforce.com/services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={consumer_key}
&client_secret={consumer_secret}
```

Response:
```json
{
  "access_token": "00Dfj00000OWWRx!AQE...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. Create Session

```bash
POST https://api.salesforce.com/einstein/ai-agent/v1/agents/{agentId}/sessions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "externalSessionKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "instanceConfig": {
    "endpoint": "https://instance.my.salesforce.com"
  },
  "streamingCapabilities": {
    "chunkTypes": ["Text"]
  },
  "bypassUser": true
}
```

Response:
```json
{
  "sessionId": "0Xxfj000001zIM1CAM"
}
```

### 3. Send Message

```bash
POST https://api.salesforce.com/einstein/ai-agent/v1/agents/{agentId}/sessions/{sessionId}/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "utterance": "search for omega systems"
}
```

Response:
```json
{
  "messages": [
    {
      "message": "I found 5 accounts matching 'omega'..."
    }
  ]
}
```

### 4. End Session

```bash
DELETE https://api.salesforce.com/einstein/ai-agent/v1/agents/{agentId}/sessions/{sessionId}
Authorization: Bearer {access_token}
```

## Migration to REST API

### Prerequisites

1. **Create Connected App in Salesforce:**
   - Setup > Apps > App Manager
   - New Connected App
   - Name: "Quoting Agent API"
   - Enable "API (Enable OAuth Settings)"
   - OAuth Scopes: Select "api"
   - Save and get Consumer Key and Consumer Secret

2. **Set Environment Variables:**
   ```bash
   SF_INSTANCE_URL=https://your-instance.my.salesforce.com
   SF_OAUTH_CLIENT_ID=your_consumer_key
   SF_OAUTH_CLIENT_SECRET=your_consumer_secret
   SF_AGENT_ID=0Xxfj000001zIM1CAM
   ```

3. **Update server.js:**
   ```javascript
   const SalesforceAgentApiClient = require('./salesforceAgentApiClient');
   
   const apiClient = new SalesforceAgentApiClient(
     process.env.SF_OAUTH_CLIENT_ID,
     process.env.SF_OAUTH_CLIENT_SECRET,
     process.env.SF_INSTANCE_URL,
     process.env.SF_AGENT_ID
   );
   
   // Then use: await apiClient.startSession()
   ```

### Benefits of REST API

- ✅ No CLI required → Heroku deployable
- ✅ Faster (no subprocess overhead)
- ✅ More scalable
- ✅ Standard HTTP API
- ✅ Better for containerized deployments

## Current Status

| Aspect | CLI | REST API |
|--------|-----|----------|
| Implementation | ✅ Complete | 📋 Ready to use |
| Tests | ✅ 7/7 passing | ⏳ Pending agent setup |
| Deployable to Heroku | ❌ No | ✅ Yes |
| Production Ready | ✅ Yes | ⏳ Awaiting org config |

## Files

- **Current:** `server.js` - CLI-based implementation
- **Prepared:** `salesforceAgentApiClient.js` - REST API client (ready to use when agent is configured)
- **Tests:** `test-cases/run-e2e-test.sh` - E2E test suite (works with both implementations)

## Next Steps

1. Ensure agent `0Xxfj000001zIM1CAM` is published and activated
2. Create Connected App and get OAuth credentials
3. Update `.env.local` with OAuth client ID and secret
4. Switch `server.js` to use `SalesforceAgentApiClient` instead of CLI
5. Run tests to verify functionality

The REST API client is already implemented and ready - just needs the agent to be properly configured for REST API access.
