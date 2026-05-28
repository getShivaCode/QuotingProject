# QuotingProject - Setup & Getting Started

## ✅ Project Structure Complete

Your project is now organized as a monorepo with the following structure:

```
QuotingProject/
├── packages/
│   ├── presentation/              # Slide deck (7 slides)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── headlessAgentForce/        # Interactive agent chat UI
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── README.md
│
├── salesforce/                    # Salesforce backend
│   ├── force-app/                # Apex, Flows, Agent definitions
│   ├── specs/
│   └── sfdx-project.json
│
├── docs/                          # Documentation
│   └── AGENT_ARCHITECTURE.md     # Complete architecture guide
│
├── .project-config/               # Configuration files
│   ├── .sf/
│   ├── .sfdx/
│   ├── .vscode/
│   └── .agents/
│
├── .claude/                       # Claude memory (persistent)
├── package.json                   # Monorepo root
├── README.md                      # Project overview
├── SETUP.md                       # This file
└── .gitignore
```

## 🚀 Quick Start

### Option 1: Run Both Apps (Recommended)

**Terminal 1 - Start Presentation (with embedded agent)**
```bash
cd packages/presentation
npm install
npm start
```
→ Opens at `http://localhost:3000`
→ Slide 7 contains the interactive HeadlessAgentForce component

**Terminal 2 - Salesforce Backend** (optional, for testing)
```bash
cd salesforce
sf org login web --alias demo-org
sf agent preview --name Quoting_Agent --target-org demo-org
```

### Option 2: Run Individual Apps

**Presentation Only**
```bash
cd packages/presentation
npm start
# Open http://localhost:3000
```

**HeadlessAgentForce Standalone**
```bash
cd packages/headlessAgentForce
npm start
# Open http://localhost:3000
```

**Salesforce**
```bash
cd salesforce
sf org login web --alias demo-org
sf project deploy start --target-org demo-org
```

## 📋 What Each Package Contains

### Presentation (`packages/presentation`)
- **7 Slides** showcasing the quoting workflow
- Slide 1: Value Statement
- Slide 2: The Challenge
- Slide 3: Our Solution (4-step flow)
- Slides 4-6: Detailed workflow steps
- **Slide 7: Interactive Agent** (HeadlessAgentForce embedded)
- Features: Breadcrumbs, keyboard navigation, mobile responsive

### HeadlessAgentForce (`packages/headlessAgentForce`)
- Chat-based interface to interact with Quoting Agent
- Login/logout flow (ready for Salesforce OAuth)
- Multi-turn conversation support
- Message streaming with typing indicator
- Placeholder implementation (awaiting API integration)
- Responsive design (desktop, tablet, mobile)

### Salesforce (`salesforce/`)
- **Agent**: `Quoting_Agent` (4 subagents for account/product/quote workflows)
- **Apex Classes**: 5 action handlers
- **External**: MCP pricing server integration
- Ready to deploy to your org

### Documentation (`docs/`)
- `AGENT_ARCHITECTURE.md`: Complete technical guide
  - Visual flow diagrams
  - Variable lifecycle
  - Design decisions
  - External integrations

## 🔧 Configuration

### Salesforce Setup

1. **Connect to your org:**
   ```bash
   cd salesforce
   sf org login web --alias demo-org
   ```

2. **Deploy metadata:**
   ```bash
   sf project deploy start --target-org demo-org
   ```

3. **Verify agent:**
   ```bash
   sf agent preview --name Quoting_Agent --target-org demo-org
   ```

### HeadlessAgentForce Setup (Future)

To connect the agent app to your Salesforce org:

1. Create Connected App in Salesforce with OAuth 2.0
2. Set redirect URI: `http://localhost:3000/callback` (dev) or your prod URL
3. Update `.env` in `packages/headlessAgentForce`:
   ```
   REACT_APP_SALESFORCE_ORG_URL=https://your-org.my.salesforce.com
   REACT_APP_CLIENT_ID=your_connected_app_client_id
   ```
4. Implement OAuth flow in HeadlessAgentForce component

## 📦 Monorepo Commands

### From Root Directory

```bash
# Install dependencies for all packages
npm install

# Run presentation app
npm run dev

# Run agent app
npm run dev:agent

# Build all packages
npm run build

# Build individual packages
npm run build:presentation
npm run build:agent
```

## 🎯 Next Steps

### Immediate
- [ ] Test presentation locally: `cd packages/presentation && npm start`
- [ ] Explore slide deck navigation (arrow keys, breadcrumbs)
- [ ] Try HeadlessAgentForce login/chat on Slide 7

### Short Term
- [ ] Connect HeadlessAgentForce to Salesforce OAuth
- [ ] Implement Agent Runtime API calls
- [ ] Test real message streaming

### Medium Term
- [ ] Deploy presentation to static host (Vercel, Netlify)
- [ ] Set up CI/CD for Salesforce deployment
- [ ] Add rich message types (buttons, forms, etc.)

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

## 📝 Notes

- **HeadlessAgentForce on Slide 7**: Uses lazy loading to avoid bundle bloat
- **Monorepo**: Uses npm workspaces for shared dependency management
- **Memory**: `.claude/` directory persists Claude AI memory across sessions
- **Git**: Initialized in both packages; root `.gitignore` covers all

## 🎓 Learn More

- [Presentation README](packages/presentation/README.md)
- [HeadlessAgentForce README](packages/headlessAgentForce/README.md)
- [Agent Architecture Guide](docs/AGENT_ARCHITECTURE.md)
- [Salesforce Agentforce Docs](https://developer.salesforce.com/docs/atlas.en-us.agentforce.meta/agentforce/)

---

**Status**: ✅ Project structure complete | 🚧 API integration pending

**Last Updated**: May 27, 2026
