# Agentforce Intelligent Quoting Platform

A conversational AI-powered presentation and quoting system that showcases how Agentforce intelligently guides users through account selection, product search, shopping cart management, and quote generation.

## Overview

This project demonstrates an end-to-end quoting experience with:
- **8-slide professional presentation** with live embedded agent (Slide 8)
- **Real-time agent interaction** with Salesforce Agentforce backend
- **Dual-mode backend** - SF CLI for development, REST API for production
- **Dark/Light theme** toggle with responsive mobile design
- **JSON payload inspector** for viewing agent responses
- **Server-side JSON initialization** for clean session setup
- **Salesforce integration** with Agentforce backend
- **Quote hyperlinks** to Salesforce records (opens in new window)
- **Improved UX** - Logout/restart buttons with state management

## Project Structure

```
QuotingProject/
├── packages/
│   └── presentation/              # Main presentation app (8 slides + live agent)
│       ├── src/components/        # Slide components, Presentation controller
│       ├── src/services/          # Agent API integration (agentApi.ts)
│       ├── src/utils/             # REST API client (restApiClient.js)
│       ├── src/styles/            # Theme CSS, animations
│       ├── server.js              # Express backend (dual-mode: CLI or REST)
│       ├── .env.local             # OAuth credentials and configuration
│       └── .env.example           # Configuration template
├── salesforce/                    # Salesforce backend & metadata
│   ├── force-app/main/default/
│   │   ├── aiAuthoringBundles/   # Agent definition (Quoting_Agent v18)
│   │   ├── bots/                 # Bot versioning (v18 only)
│   │   ├── genAiPlannerBundles/   # Planning bundles (v18 only)
│   │   └── classes/              # Apex actions
│   ├── agent-api-flows/          # E2E test scripts
│   └── sfdx-project.json         # Salesforce configuration
├── docs/                          # Documentation
│   └── AGENT_ARCHITECTURE.md     # Agent architecture guide
├── README.md                      # Project overview
├── SETUP.md                       # Setup and configuration
├── SESSION_SUMMARY.md             # Latest session notes
└── REST_API_ARTIFACTS_INDEX.md    # REST API documentation
```

## Quick Start

### Development (CLI Mode)

```bash
cd packages/presentation
npm install
npm run dev

# This starts:
# - React frontend: http://localhost:3000
# - Express backend: http://localhost:3001 (uses SF CLI)
```

### Production (REST API Mode)

```bash
cd packages/presentation
NODE_ENV=production npm run start:server

# Starts Express backend on http://localhost:3001 (uses OAuth + REST API)
# 28% faster, 15.5× better CPU efficiency, no CLI dependency
```

The backend server initializes agent sessions with JSON mode automatically. No dummy messages needed.

**Key Differences:**
- **Dev (CLI):** Fast iteration, no OAuth setup, uses SF CLI
- **Prod (REST):** Cloud-ready (Heroku), OAuth token refresh, better performance

## Presentation Package

The main deliverable: `packages/presentation/` is a professional 8-slide presentation app.

### Slides

1. **Value Statement** - Opening statement on intelligent quoting
2. **The Challenge** - Problem context for sales teams
3. **Our Solution** - How Agentforce solves the problem
4. **Step 1: Account Selection** - Search and select customer accounts
5. **Step 2: Product Search** - Intelligent product discovery interface
6. **Step 3: Shopping Cart** - Quantity management and cart totals
7. **Step 4: Request Quote** - Quote generation and review
8. **Try It Live** - Interactive agent widget with live chat and quote generation

### Features

- **Theme Toggle** (top-right): Light/Dark mode, default dark
- **Breadcrumb Navigation** (right sidebar): Jump to any slide, shows progress
- **Arrow Controls** (bottom): Navigate slides or use keyboard ← →
- **Responsive Design**: Works on desktop, tablet, mobile
- **Slide Counter**: Shows current slide / total slides

### Try It Live (Slide 8)

The final slide embeds a live interactive agent widget:
- **Left Panel**: Chat interface for multi-turn conversation with real Agentforce agent
  - Account search and selection (queries Salesforce)
  - Product search via external MCP pricing server
  - Shopping cart management
  - Real quote generation and storage
  - Real-time typing indicators and message history
  - **Logout Button**: Shows "Logging off..." message, clears all state, returns to login
  - **Restart Button**: Shows "Restarting session..." then "Connecting...", clears all UI
  - Speech recognition support (click mic icon)
- **Right Panel**: Order summary visualization
  - Shopping cart with line items and totals
  - Quote display with account, items, and metadata
  - **Quote links**: Click quote number to open in Salesforce (new window)
  - **Status badges**: Yellow pill-style status indicators
  - **JSON Toggle** (top-right): Click code icon to view agent response JSON
  - Real Salesforce data displayed as cards
  - **Navigation Modal**: Confirmation when leaving slide with active session

### Testing Agent Flows

Run end-to-end tests for the full quoting workflow:

**Via Express server (supports both CLI and REST):**
```bash
cd packages/presentation
npm run start:server &
sleep 2
./test-cases/run-e2e-test.sh
```

**Direct REST API test:**
```bash
cd packages/presentation
./test-cases/run-e2e-test-rest-api.sh
```

These scripts:
- Create a session with auto-initialized JSON mode
- Search for and select accounts
- Search for products
- Add items to cart
- Create and name quotes
- Capture all agent responses as valid JSON

See `docs/AGENT_ARCHITECTURE.md` for detailed flow documentation.

### Building for Production

```bash
cd packages/presentation
npm run build
```

Output goes to `build/` directory. Then start with:
```bash
NODE_ENV=production npm run start:server
```

## Salesforce Backend

The `salesforce/` directory contains production Agentforce agent metadata:

- **Agent**: `Quoting_Agent` (v18) - Multi-turn agent orchestrating account → product → quote workflows
- **Apex Actions**: Account/product search, quote generation, history, and details handlers
- **External Integration**: MCP server connection for pricing and semantic product search
- **Cleaned versions**: Only v18 kept; v1-v17 removed for repo cleanliness

### Deployment

```bash
cd salesforce/
sf org login web --alias demo-org
sf project deploy start --target-org demo-org
```

### Preview Agent

```bash
sf agent preview --name Quoting_Agent --target-org demo-org
```

See `docs/AGENT_ARCHITECTURE.md` for complete technical details on agent flows, variable persistence, and integrations.

## Key Features

✨ **Presentation Experience**
- Professional 8-slide deck with animations and transitions
- Live agent interaction on final slide
- Dark/light theme with smooth toggle
- Mobile-responsive design (768px, 480px breakpoints)
- Keyboard navigation (← → arrows)
- Breadcrumb progress tracking
- Navigation confirmation modal (on Slide 8 with active session)

🤖 **Agent Widget (Slide 8)**
- Multi-turn conversation with real Salesforce account/product search
- Click-to-select account and product cards
- Shopping cart with quantity management
- Real quote generation and storage in Salesforce
- JSON response inspector for debugging
- Improved login/logout flow (shows status message)
- Restart button with session deletion
- Quote cards with Salesforce hyperlinks
- Typing indicators and smooth animations
- Speech recognition support (mic icon)

📱 **Responsive Design**
- Desktop: Full-width layout with sidebars
- Tablet (≤768px): Stacked layout, compact controls
- Mobile (≤480px): Minimal header, optimized touch targets

🚀 **Backend Modes**
- **Development:** SF CLI with fast iteration
- **Production:** REST API with OAuth token management (28% faster)

## Technology Stack

- **Frontend**: React 18, TypeScript, Framer Motion (animations)
- **Styling**: CSS3 with CSS-in-JS, dark mode via class selectors
- **Build**: Create React App, Webpack
- **Backend**: Salesforce Agentforce, Apex
- **Icons**: Lucide React (chevrons, sun/moon, message icons)

## File Structure

```
presentation/src/
├── components/
│   ├── Presentation.tsx          # Main slide controller & routing
│   ├── HeadlessAgentForce.tsx   # Chat widget (8-slide embed)
│   └── slides/
│       ├── Slide1.tsx           # Value Statement
│       ├── Slide2.tsx           # The Challenge
│       ├── Slide3.tsx           # Our Solution
│       ├── Slide4.tsx           # Step 1: Account Selection
│       ├── Slide5.tsx           # Step 2: Product Search
│       ├── Slide6.tsx           # Step 3: Shopping Cart
│       ├── Slide7.tsx           # Step 4: Request Quote
│       └── Slide8.tsx           # Try It Live (agent widget)
└── styles/
    ├── presentation.css         # Layout, navigation, breadcrumbs
    ├── slides.css              # Slide-specific styling, dark mode
    └── agent.css               # Chat widget, visualization panel
```

## Environment Configuration

Create `.env.local` in `packages/presentation/`:

```env
# OAuth Configuration
SF_CLIENT_ID=your_client_id
SF_CLIENT_SECRET=your_client_secret
EXTERNAL_APP_KEY=your_app_key
EXTERNAL_APP_SECRET=your_app_secret
SF_INSTANCE_URL=https://your-instance.my.salesforce.com

# Agent Configuration
SF_AGENT_ID=your_agent_id

# Client Configuration
REACT_APP_SF_INSTANCE_URL=https://your-instance.my.salesforce.com

# Server Configuration
NODE_ENV=development  # or 'production' for REST API mode
LOG_LEVEL=debug
TOKEN_TTL_SECONDS=3600  # 1 hour (REST API mode only)
```

See `SETUP.md` for full configuration details.

## Development Notes

- **Default Theme**: Dark mode (toggle at top-right)
- **Keyboard Shortcuts**: Arrow keys to navigate slides
- **Mobile Header**: Salesforce logo centered, theme toggle at top-right (smaller)
- **Agent Widget**: Real Salesforce integration; REST API ready for production
- **JSON Inspector**: Subtle code icon in visualization header—click to toggle between UI and raw JSON

## Status

✅ **Complete**
- All 8 slides built and styled with live agent on Slide 8
- Real Agentforce agent integration (CLI-based, no mocks)
- Server-side session initialization with JSON mode
- Dark/light theme with full responsiveness
- Mobile optimizations
- JSON response inspector for debugging
- E2E test scripts for full workflow validation

🚀 **Ready for**
- Customer demos
- REST API refactor (when needed; see `REST_API_IMPLEMENTATION_GUIDE.md` for parked work)
- Production deployment (replace CLI with REST API)
- Heroku deployment (requires REST API)
