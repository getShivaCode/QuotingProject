# QuotingProject - Setup & Getting Started

## ✅ Project Structure

```
QuotingProject/
├── packages/
│   └── presentation/              # 8-slide presentation + live agent + backend server
│       ├── src/components/        # Slide components + HeadlessAgentForce chat widget
│       ├── src/services/          # Agent API integration (agentApi.ts)
│       ├── src/utils/             # REST API client (restApiClient.js)
│       ├── server.js              # Express backend (dual-mode: CLI for dev, REST for prod)
│       ├── package.json
│       ├── .env.local             # OAuth credentials and configuration
│       ├── .env.example           # Configuration template
│       └── README.md
│
├── salesforce/                    # Salesforce backend
│   ├── force-app/main/default/
│   │   ├── aiAuthoringBundles/   # Agent definition (Quoting_Agent v18 only)
│   │   ├── bots/                 # Bot versioning (v18 only, v1-v17 removed)
│   │   ├── genAiPlannerBundles/   # Planning bundles (v18 only)
│   │   ├── classes/              # Apex actions
│   │   └── flows/                # Salesforce flows
│   ├── agent-api-flows/          # E2E test scripts
│   └── sfdx-project.json
│
├── docs/                          # Documentation
│   └── AGENT_ARCHITECTURE.md     # Complete technical guide
│
├── README.md                      # Project overview
├── SETUP.md                       # This file
├── SESSION_SUMMARY.md             # Latest session accomplishments
├── REST_API_ARTIFACTS_INDEX.md    # REST API documentation
└── .gitignore
```

## 🚀 Quick Start

### Development Mode (Using SF CLI)

**One command, one terminal:**
```bash
cd packages/presentation
npm install
npm run dev
```

This starts:
- **React frontend** (Slide presentation + agent chat widget) on `http://localhost:3000`
- **Express backend** (Agent session manager) on `http://localhost:3001` - CLI mode

Both are required for the live agent on Slide 8 to work.

**What happens automatically (dev mode):**
- Uses SF CLI for session management (faster local iteration)
- Session creation with server-side JSON mode initialization
- Agent responses formatted as structured JSON
- No OAuth configuration needed for UI development

### Production Mode (Using REST API)

```bash
cd packages/presentation
NODE_ENV=production npm run start:server
```

Starts only the Express backend on `http://localhost:3001` - REST API mode

**Production advantages:**
- Direct Salesforce REST API (no CLI dependency)
- Ready for Heroku or cloud deployment
- Automatic OAuth token refresh and caching (1-hour TTL, 5-minute buffer)
- 28% faster performance, 15.5× better CPU efficiency
- Requires OAuth credentials in environment variables

## 📋 What Each Component Does

### Presentation + Backend (`packages/presentation/`)

**Frontend (React):**
- **8 Slides** showcasing the quoting workflow
  - Slides 1-7: Value statement → our solution → workflow steps
  - **Slide 8: Try It Live** — Interactive live agent widget
- Features: Breadcrumbs, keyboard navigation, dark/light theme, mobile responsive
- Chat widget (left panel) + visualization panel (right panel)

**Backend (Express, `server.js`):**
- **Dual-mode operation:** Uses SF CLI for development, REST API for production
- Automatically initializes JSON mode on session creation (no dummy messages)
- Handles message routing to/from Quoting Agent
- Extracts and formats agent responses as structured JSON
- Wakes up MCP pricing server before session creation
- REST API mode includes automatic token refresh (configurable TTL)

### Salesforce (`salesforce/`)

**Agent Definition:**
- `Quoting_Agent` with 3 subagents:
  - `account_selection` — Find and select customer account
  - `product_search` — Search products via MCP
  - `quote_management` — Create, modify, view quotes

**Apex Actions:**
- Account search (queries Salesforce)
- Product search (calls MCP server)
- Quote creation/management
- External service integration

**Testing:**
- `agent-api-flows/capture-agent-responses.sh` — E2E test script
  - Full workflow: account → products → cart → quote
  - Validates JSON responses at each step

### Documentation (`docs/`)
- `AGENT_ARCHITECTURE.md`: Complete technical guide
  - Agent flow diagrams and variable lifecycle
  - Subagent design and external integrations
  - How JSON mode initialization works

## 🔧 Configuration

### Salesforce Setup (Required for Live Agent)

1. **Connect to your org:**
   ```bash
   cd salesforce
   sf org login web --alias demo-org
   sf config set target-org demo-org
   ```

2. **Deploy metadata:**
   ```bash
   sf project deploy start --target-org demo-org
   ```

3. **Verify agent compiles:**
   ```bash
   sf agent validate authoring-bundle --json --api-name Quoting_Agent
   ```

4. **Test agent via CLI (optional):**
   ```bash
   sf agent preview start --json --use-live-actions --authoring-bundle Quoting_Agent
   sf agent preview send --json --authoring-bundle Quoting_Agent --session-id <ID> --utterance "find Omega Systems"
   ```

### Backend Server Configuration

**Environment Variables (in `.env.local`):**
- `SF_CLIENT_ID` - OAuth client ID for REST API auth
- `SF_CLIENT_SECRET` - OAuth client secret
- `SF_INSTANCE_URL` - Salesforce instance URL
- `EXTERNAL_APP_KEY` - External app key
- `EXTERNAL_APP_SECRET` - External app secret
- `SF_AGENT_ID` - Agentforce agent ID
- `REACT_APP_SF_INSTANCE_URL` - Client-side instance URL (for quote links)
- `TOKEN_TTL_SECONDS` - Token refresh interval (default: 3600 seconds)
- `NODE_ENV` - Set to `production` for REST API mode
- `LOG_LEVEL` - Debug logging level (default: debug)

**Mode Selection:**
- **Development (CLI):** `npm run dev` or `node server.js` (uses SF CLI)
- **Production (REST API):** `NODE_ENV=production npm run start:server` (uses OAuth + REST API)

The Express server automatically:
- Initializes JSON mode on every session
- Calls MCP pricing server before creating sessions
- Logs all requests and responses (with DEBUG markers for [OAUTH], [REST_API], [CLIENT], [RESPONSE])
- Refreshes OAuth tokens proactively (5 minutes before expiration)

## 🧪 Testing the Agent

### Manual Testing (UI)

1. Start dev mode: `cd packages/presentation && npm run dev`
2. Navigate to Slide 8: "Try It Live"
3. Click "Login with Salesforce"
4. Type: "find Omega" (or any account name)
5. Select an account from the results
6. Search for products: "search for fertilizer"
7. Add to cart: "add 10 units"
8. Create quote: "I'm ready to create a quote"
9. Name the quote and confirm
10. View JSON responses via the code icon in the right panel

**UI Features:**
- Logout button: Shows "Logging off...", clears all state, returns to login screen
- Restart button: Shows "Restarting session..." → "Connecting...", clears all cards
- Quote cards: Click quote number to open Salesforce record (new window)
- Status badges: Yellow pill style matching Slide 7 design
- Navigation modal: Appears only on Slide 8 when session is active

### Automated E2E Testing

**Test via Express server (both CLI and REST modes):**
```bash
cd packages/presentation
npm run start:server &
sleep 2
./test-cases/run-e2e-test.sh
```

**Test via direct REST API:**
```bash
cd packages/presentation
./test-cases/run-e2e-test-rest-api.sh
```

Both test scripts validate:
- Session creation with auto-initialization
- Account search and selection
- Product search
- Cart operations
- Quote creation
- All responses are valid JSON

Check the output for `✅` marks on each step.

## 🎯 Next Steps

### Immediate
- [ ] Run the app locally: `cd packages/presentation && npm run dev`
- [ ] Navigate to Slide 8 and test the live agent
- [ ] Try the full workflow: account → products → cart → quote
- [ ] Test logout button (shows "Logging off..." message)
- [ ] Test restart button (clears all state and creates new session)
- [ ] Click a quote number to verify Salesforce link

### Short Term (When Ready)
- [ ] Set up OAuth credentials for production deployment
- [ ] Deploy to Heroku using `NODE_ENV=production npm run start:server`
- [ ] Monitor REST API performance (28% improvement over CLI)
- [ ] Set up CI/CD for Salesforce deployment

### Production Deployment
- [ ] Configure `.env` with OAuth credentials (use `.env.example` as template)
- [ ] Set `NODE_ENV=production` on deployment server
- [ ] Configure `TOKEN_TTL_SECONDS` if needed (default: 3600 = 1 hour)
- [ ] Set `REACT_APP_SF_INSTANCE_URL` for quote record links
- [ ] Run E2E tests before going live: `./test-cases/run-e2e-test-rest-api.sh`

### Future Enhancements
- [ ] Add rich message types (interactive buttons, forms)
- [ ] Deploy presentation to Vercel/Netlify
- [ ] Implement role-based access controls
- [ ] Add quote versioning and history tracking

## 📚 File Reference

| Path | Purpose |
|------|---------|
| `packages/presentation/src/components/slides/` | Individual slide components |
| `packages/presentation/src/styles/` | Presentation styling |
| `packages/headlessAgentForce/src/components/HeadlessAgentForce.tsx` | Main agent component |
| `packages/headlessAgentForce/src/styles/agent.css` | Agent styling |
| `salesforce/force-app/main/default/aiAuthoringBundles/` | Agent definitions |
| `salesforce/force-app/main/default/classes/` | Apex action handlers |
| `docs/AGENT_ARCHITECTURE.md` | Technical documentation |
| `.claude/` | Project memory (persists across sessions) |

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port for presentation
cd packages/presentation
PORT=3001 npm start

# Change port for agent
cd packages/headlessAgentForce
PORT=3002 npm start
```

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Salesforce Connection Issues
```bash
# Reconnect to org
sf org login web --alias demo-org --set-default

# List authorized orgs
sf org list --all
```

## 📝 Implementation Details

### Session Initialization

**REST API mode:**
The server initializes JSON mode server-side during session creation:
```javascript
// server.js - POST /api/agent/session
// Uses restApiClient to call Salesforce Agent API
const sessionId = await restApiClient.initializeSession(agentId);
// Then sends set_json_format message
await restApiClient.sendMessage(sessionId, 'set_json_format');
```

**CLI mode (development):**
The server uses SF CLI for development iteration (faster feedback loop).

### Agent Variables

The agent uses special variables for JSON mode:
- `json_mode: mutable boolean` — When True, agent outputs JSON
- `json_mode_initialized: mutable boolean` — Prevents re-initialization

### Token Caching (REST API mode)

**Proactive refresh pattern:**
- Tokens cached with 1-hour default TTL (configurable via `TOKEN_TTL_SECONDS`)
- Refreshed automatically 5 minutes before expiration
- No `expires_in` in Salesforce OAuth response; uses conservative TTL to ensure token validity
- Sliding window: Token expiration resets on every successful API call

**Token acquisition:**
```javascript
// REST API client - OAuth client credentials flow
POST https://{instance}/services/oauth2/token
- grant_type: client_credentials
- client_id: {EXTERNAL_APP_KEY}
- client_secret: {EXTERNAL_APP_SECRET}
```

See `docs/AGENT_ARCHITECTURE.md` for complete variable lifecycle.

## 📚 Documentation

- [Presentation README](packages/presentation/README.md) — Frontend features and environment variables
- [Agent Architecture Guide](docs/AGENT_ARCHITECTURE.md) — Full technical details
- [Session Summary](SESSION_SUMMARY.md) — Latest accomplishments and current state
- [REST API Documentation](REST_API_ARTIFACTS_INDEX.md) — REST API architecture and token management
- [Salesforce Agentforce Docs](https://developer.salesforce.com/docs/atlas.en-us.agentforce.meta/agentforce/)

## 🐛 Troubleshooting

### REST API OAuth Issues

**Token acquisition fails (HTTP 401):**
- Verify `EXTERNAL_APP_KEY` and `EXTERNAL_APP_SECRET` are correct
- Check that external app is enabled in Salesforce
- Confirm `SF_INSTANCE_URL` matches where app is registered

**Token refresh not working:**
- Check logs for `[OAUTH]` markers to see refresh attempts
- Verify `TOKEN_TTL_SECONDS` is set correctly
- Ensure 5-minute buffer is appropriate for your use case

### Quote Links Not Working

**Quote number not hyperlinked:**
- Verify `REACT_APP_SF_INSTANCE_URL` is set in `.env.local`
- Confirm `quoteId` is being returned in agent response
- Check browser console for errors

**Link opens wrong URL:**
- Verify `REACT_APP_SF_INSTANCE_URL` matches your Salesforce instance
- Use format: `https://your-instance.my.salesforce.com` (without trailing slash)

### UI State Issues

**Logout button not working:**
- Check browser console for errors
- Verify `endSession()` completes (check network tab)
- Session deletion should complete before returning to login screen

**Restart button stuck on "Restarting session...":**
- Increase `endSession()` timeout if network is slow (currently 5 seconds)
- Check server logs for DELETE endpoint errors

---

**Status**: ✅ REST API fully implemented | ✅ Dual-mode (CLI + REST) | ✅ E2E tests passing | ✅ Production-ready

**Last Updated**: June 25, 2026
