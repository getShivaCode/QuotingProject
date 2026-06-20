# Salesforce Agent API - cURL Commands

## Step 1: Get OAuth Access Token

This request uses client credentials flow to get a JWT access token with the correct scopes.

```bash
curl -s https://<your-instance>.my.salesforce.com/services/oauth2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=<your_client_id>' \
  --data-urlencode 'client_secret=<your_client_secret>'
```

**Expected Response:**
```json
{
  "access_token": "eyJ0bmsiOiJjb3JlL3Byb2QvMDBEZmowMDAwME9XV1J4RUFQIi...",
  "signature": "...",
  "token_format": "jwt",
  "scope": "sfap_api chatbot_api api",
  "instance_url": "https://trailsignup-816972be03897e.my.salesforce.com",
  "id": "https://login.salesforce.com/id/00Dfj00000OWWRxEAP/005fj00000EuGSEAA3",
  "token_type": "Bearer",
  "issued_at": "1780362206806",
  "api_instance_url": "https://api.salesforce.com"
}
```

**Key Details:**
- Must include `sfap_api chatbot_api api` scopes (not just `api`)
- Returns JWT access token format
- `api_instance_url` is `https://api.salesforce.com`
- Token expires in ~8 hours (issued_at to exp)

---

## Step 2: Create Agent Session

Create a new session with the agent using the access token.

```bash
curl -i --location -X POST https://api.salesforce.com/einstein/ai-agent/v1/agents/0Xxfj000001zIM1CAM/sessions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  --data '{
    "externalSessionKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "instanceConfig": {
      "endpoint": "https://trailsignup-816972be03897e.my.salesforce.com"
    },
    "streamingCapabilities": {
      "chunkTypes": ["Text"]
    },
    "bypassUser": true
  }'
```

**Required Parameters:**
- `<ACCESS_TOKEN>` - from Step 1 response
- `externalSessionKey` - any valid UUID
- `instanceConfig.endpoint` - your org's instance URL
- `0Xxfj000001zIM1CAM` - Agent ID

**Expected Response (on success):**
```json
{
  "sessionId": "0Xxfj000001zIM1CAM",
  "createdDate": "2026-06-02T01:05:19.000Z",
  ...
}
```

**Current Status:** Returns HTTP 401 "Invalid token" - agent may not be configured for REST API access yet.

---

## Step 3: Send Message to Agent (future use)

Once session is created, send messages to the agent:

```bash
curl -i --location -X POST https://api.salesforce.com/einstein/ai-agent/v1/agents/0Xxfj000001zIM1CAM/sessions/{SESSION_ID}/messages \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  --data '{
    "utterance": "search for omega systems"
  }'
```

**Parameters:**
- `{SESSION_ID}` - from Step 2 response
- `<ACCESS_TOKEN>` - from Step 1 (reuse if not expired)

---

## Step 4: End Session (future use)

```bash
curl -i --location -X DELETE https://api.salesforce.com/einstein/ai-agent/v1/agents/0Xxfj000001zIM1CAM/sessions/{SESSION_ID} \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## Environment Variables

```bash
# OAuth Credentials (from Connected App)
SF_OAUTH_CLIENT_ID=<your_client_id>
SF_OAUTH_CLIENT_SECRET=<your_client_secret>

# Org Configuration
SF_INSTANCE_URL=https://trailsignup-816972be03897e.my.salesforce.com

# Agent Configuration
SF_AGENT_ID=0Xxfj000001zIM1CAM
```

---

## Quick Testing Script

Save as `test-agent-api.sh`:

```bash
#!/bin/bash

# Configuration
INSTANCE_URL="https://<your-instance>.my.salesforce.com"
CLIENT_ID="<your_client_id>"
CLIENT_SECRET="<your_client_secret>"
AGENT_ID="<your_agent_id>"

# Step 1: Get token
echo "🔐 Getting OAuth token..."
TOKEN_RESPONSE=$(curl -s "${INSTANCE_URL}/services/oauth2/token" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "client_secret=${CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
SCOPE=$(echo "$TOKEN_RESPONSE" | jq -r '.scope')

echo "✅ Token received"
echo "📌 Scopes: $SCOPE"
echo ""

# Step 2: Create session
echo "🚀 Creating agent session..."
curl -i --location -X POST "https://api.salesforce.com/einstein/ai-agent/v1/agents/${AGENT_ID}/sessions" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  --data '{
    "externalSessionKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "instanceConfig": {
      "endpoint": "'${INSTANCE_URL}'"
    },
    "streamingCapabilities": {
      "chunkTypes": ["Text"]
    },
    "bypassUser": true
  }'
```

Run with: `bash test-agent-api.sh`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Invalid token | Token may have expired (8 hour lifetime), re-request in Step 1 |
| 404 Agent not found | Agent ID may not be activated for REST API, verify `0Xxfj000001zIM1CAM` is published |
| Invalid scopes | Ensure Connected App has all scopes: `sfap_api chatbot_api api` |
| Wrong endpoint | Always use `https://api.salesforce.com` (not your org instance URL) for session creation |

---

## References

- Endpoint: `POST https://api.salesforce.com/einstein/ai-agent/v1/agents/{agentId}/sessions`
- Auth: OAuth 2.0 client credentials
- Documentation: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-api.html
