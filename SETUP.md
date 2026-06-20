# QuotingProject - Setup & Getting Started

## ✅ Project Structure

```
QuotingProject/
├── packages/
│   └── presentation/              # 8-slide presentation + live agent + backend server
│       ├── src/components/        # Slide components + HeadlessAgentForce chat widget
│       ├── src/services/          # Agent API integration
│       ├── server.js              # Express backend (agent session management)
│       ├── package.json
│       └── README.md
│
├── salesforce/                    # Salesforce backend
│   ├── force-app/main/default/
│   │   ├── aiAuthoringBundles/   # Agent definition (Quoting_Agent)
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
├── REST_API_IMPLEMENTATION_GUIDE.md # Parked work (for future refactor)
└── .gitignore
```

## 🚀 Quick Start

### Start the Presentation with Live Agent

**One command, one terminal:**
```bash
cd packages/presentation
npm install
npm start
```

This starts:
- **React frontend** (Slide presentation + agent chat widget) on `http://localhost:3000`
- **Express backend** (Agent session manager) on `http://localhost:3001`

Both are required for the live agent on Slide 8 to work.

**What happens automatically:**
- Session creation with server-side JSON mode initialization
- Agent responses formatted as structured JSON
- No dummy initialization messages needed

## 📋 What Each Component Does

### Presentation + Backend (`packages/presentation/`)

**Frontend (React):**
- **8 Slides** showcasing the quoting workflow
  - Slides 1-7: Value statement → our solution → workflow steps
  - **Slide 8: Try It Live** — Interactive live agent widget
- Features: Breadcrumbs, keyboard navigation, dark/light theme, mobile responsive
- Chat widget (left panel) + visualization panel (right panel)

**Backend (Express, `server.js`):**
- Manages agent sessions via Salesforce CLI
- Automatically initializes JSON mode on session creation (no dummy messages)
- Handles message routing to/from Quoting Agent
- Extracts and formats agent responses as structured JSON
- Wakes up MCP pricing server before session creation

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

The Express server automatically:
- Uses `demo-org` as the target org (set in `server.js`)
- Initializes JSON mode on every session (`initializeSession()`)
- Calls MCP pricing server before creating sessions
- Logs all requests and responses

To change the target org, edit `server.js`:
```javascript
const ORG_ALIAS = 'demo-org';  // Change this
```

## 🧪 Testing the Agent

### Manual Testing (UI)

1. Start the app: `cd packages/presentation && npm start`
2. Navigate to Slide 8: "Try It Live"
3. Click "Login with Salesforce"
4. Type: "find Omega Systems" (or any account name)
5. Select an account from the results
6. Search for products: "search for NH3 fertilizer"
7. Add to cart: "add 10 units of urea"
8. Create quote: "create a quote"
9. Name the quote: "name it Test Quote"
10. View JSON responses via the code icon in the right panel

### Automated E2E Testing

```bash
cd salesforce/agent-api-flows
./capture-agent-responses.sh
```

This tests:
- Session creation with auto-initialization
- Account search
- Product search
- Cart operations
- Quote creation
- All responses are valid JSON

Check the output for `✅` marks on each step.

## 🎯 Next Steps

### Immediate
- [ ] Run the app locally: `cd packages/presentation && npm start`
- [ ] Navigate to Slide 8 and test the live agent
- [ ] Try the full workflow: account → products → cart → quote
- [ ] Run E2E tests: `cd salesforce/agent-api-flows && ./capture-agent-responses.sh`

### Short Term (When Ready)
- [ ] Switch from CLI to REST API (see `REST_API_IMPLEMENTATION_GUIDE.md`)
- [ ] Deploy to Heroku (requires REST API to remove CLI dependency)
- [ ] Set up CI/CD for Salesforce deployment

### Future Enhancements
- [ ] Implement Salesforce OAuth for production
- [ ] Add rich message types (interactive buttons, forms)
- [ ] Deploy presentation to Vercel/Netlify

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

The server automatically initializes JSON mode on every new session:

```javascript
// server.js - POST /api/agent/session
function initializeSession(sessionId) {
  const result = runSfCommand(
    `sf agent preview send --json --authoring-bundle Quoting_Agent --session-id ${sessionId} --utterance 'set_json_format'`
  );
  // This triggers the agent's set_json_format action
  // which sets @variables.json_mode = True
}
```

This replaces the old hack of sending "output_format: json show me accounts" as a dummy message.

### Agent Variables

The agent uses two special variables for JSON mode:
- `json_mode: mutable boolean` — When True, agent outputs JSON
- `json_mode_initialized: mutable boolean` — Prevents re-initialization

See `docs/AGENT_ARCHITECTURE.md` for complete variable lifecycle.

## 📚 Documentation

- [Presentation README](packages/presentation/README.md)
- [Agent Architecture Guide](docs/AGENT_ARCHITECTURE.md) — Full technical details
- [REST API Guide](REST_API_IMPLEMENTATION_GUIDE.md) — Parked work for future REST API refactor
- [Salesforce Agentforce Docs](https://developer.salesforce.com/docs/atlas.en-us.agentforce.meta/agentforce/)

---

**Status**: ✅ Live agent working | ✅ Server-side initialization | ✅ E2E tests passing

**Last Updated**: June 2026
