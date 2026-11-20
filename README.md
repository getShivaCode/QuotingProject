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
│       ├── src/utils/             # REST client and local CLI client
│       ├── src/styles/            # Theme CSS, animations
│       ├── server.js              # Express backend (dual-mode: CLI or REST)
│       ├── .env.local             # OAuth credentials and configuration
│       └── .env.example           # Configuration template
├── salesforce/                    # Salesforce backend & metadata
│   ├── force-app/main/default/
│   │   ├── aiAuthoringBundles/   # Quoting_Agent authoring bundle
│   │   ├── classes/              # Apex actions
│   │   ├── objects/              # Quoting_Settings__mdt
│   │   └── customMetadata/       # Per-org pricebook id
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

## Salesforce org setup (`pricing-demo`)

This is the org the demo runs against. The old `trailsignup` alias points at an expired org and must not be used.

| | |
|---|---|
| CLI alias | `pricing-demo` |
| Username | `trailsignup.f46e26a8bd57ae@salesforce.com` |
| Instance | `https://trailsignup-f46e26a8bd57ae.my.salesforce.com` |
| Org id | `00Dak00001QTif8EAD` |
| Agent | `Quoting_Agent` (Quoting Assistant), employee agent, active version 1 |
| Agent id | `0Xxak000004hFW9CAM` |
| Standard price book | `01sak00000O15vtAAB` |
| Demo account | Omega Systems `001ak00004I2p3iAAB` |
| Hosted app | `https://headless-quoting-a41dfa247fb0.herokuapp.com` |

Agentforce is already on in this org. The admin user has the Copilot admin and user permission sets. A default employee agent, `Copilot_for_Salesforce`, is also present and is not the demo agent.

### 1. Authorize the CLI

The org is already authorized as `pricing-demo`. Point the project at it:

```bash
sf config set target-org pricing-demo
sf org display --target-org pricing-demo
```

### 2. Deploy Apex, the flow, and the remote site

From `salesforce/`:

```bash
sf project deploy start \
  --target-org pricing-demo \
  --test-level NoTestRun \
  --metadata ApexClass \
  --metadata Flow:Save_Quote_Flow \
  --metadata RemoteSiteSetting:PricingMCP \
  --metadata CustomObject:Quoting_Settings__mdt \
  --metadata CustomMetadata:Quoting_Settings.Default
```

`salesforce/sfdx-project.json` is source API 62.0. A plain project deploy cannot deploy the agent, and it also rejects `McpServerDefinition` (`url` is not valid on that type at this API version). Leave `mcpServerDefinitions/Pricing_MCP` undeployed. Product search does not need it: Apex calls `https://pricingmcp.onrender.com/mcp` directly, and the `PricingMCP` remote site allows that callout.

Do not deploy `bots/Quoting_Agent` or `genAiPlannerBundles` retrieved from the previous org. Those files contain the old org's ids. Publishing the authoring bundle creates the new runtime.

### 3. Price book

Quote creation reads `Quoting_Settings__mdt` record `Default`, field `Pricebook_Id__c`. For this org that value is the standard price book, `01sak00000O15vtAAB`. If the field is blank, `GenerateAndSaveQuote` queries `Pricebook2 WHERE IsStandard = true`.

Redeploying `Quoting_Settings.Default` overwrites whatever is in the org with the value in source. The agent saves quotes through `GenerateAndSaveQuote`. `Save_Quote_Flow` reads the same custom metadata for the opportunity and quote price book. Its line-item `PricebookEntryId` is still an id from the old org, and the agent does not call that flow.

### 4. Deploy, publish, and activate the agent

The authoring bundle has to be deployed with API 66 or newer. `sf project deploy start` generates a manifest from source API 62.0, so use an explicit manifest:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Quoting_Agent</members>
        <name>AiAuthoringBundle</name>
    </types>
    <version>66.0</version>
</Package>
```

```bash
sf project deploy start --manifest /tmp/deploy-agent.xml --target-org pricing-demo --test-level NoTestRun
sf agent publish authoring-bundle --api-name Quoting_Agent --target-org pricing-demo
sf agent activate --api-name Quoting_Agent --target-org pricing-demo
```

Publish creates the Bot and version 1. The id for `SF_AGENT_ID` is `0Xxak000004hFW9CAM` (`sf org list metadata --metadata-type Bot`). This agent is an `AgentforceEmployeeAgent`, so it has no Einstein Agent user.

Do not retrieve the authoring bundle after publish. A retrieve writes `<target>` into `bundle-meta.xml` and locks the bundle to this org.

Check the published agent from the CLI:

```bash
sf agent preview start --api-name Quoting_Agent --target-org pricing-demo
```

`--authoring-bundle` talks to the draft. `--api-name` talks to the published agent.

### 5. External Client App for Heroku

Heroku cannot use the Salesforce CLI. The Express server uses the OAuth client-credentials flow in `packages/presentation/src/utils/restApiClient.js`. The "Login with Salesforce" button does not send the browser through a Salesforce login. It asks the server to open an agent session.

In Setup, open **External Client App Manager** and create a local app. **Enable OAuth** is required. The callback field is required by the form and is unused by this flow. Set it to `http://localhost:3001/oauth/callback`. Do not add the Heroku URL. Selected scopes:

- Manage user data via APIs (`api`)
- Access chatbot services (`chatbot_api`)
- Perform requests at any time (`refresh_token`, `offline_access`)
- Access the Salesforce API Platform (`sfap_api`)

On the same OAuth settings, enable **Client Credentials Flow** and **Issue JWT-based access tokens for named users**. Without the JWT setting, the token call succeeds and every Agent API session call returns an empty 404.

After the app exists, open it from the manager list, then **Policies → Edit**:

- Under OAuth Flows, enable **Client Credentials Flow**. **Run As** appears after that box is checked. Set it to `trailsignup.f46e26a8bd57ae@salesforce.com`.
- Under App Authorization, set **IP Relaxation** to **Relax IP restrictions**. Heroku's outbound addresses change.

Consumer Key and Secret are on the app after you verify your identity. The key starts with `3MVG9`. Put them only in `packages/presentation/.env.local` and in Heroku config vars. `.env.local` is gitignored. Restart the Node process after changing it. The server reads that file once at startup.

```env
SF_AGENT_TRANSPORT=rest
SF_INSTANCE_URL=https://trailsignup-f46e26a8bd57ae.my.salesforce.com
SF_AGENT_ID=0Xxak000004hFW9CAM
SF_ORG_ID=00Dak00001QTif8EAD
EXTERNAL_APP_KEY=<consumer key>
EXTERNAL_APP_SECRET=<consumer secret>
REACT_APP_SF_INSTANCE_URL=https://trailsignup-f46e26a8bd57ae.my.salesforce.com
```

Heroku needs those same variables, plus `NODE_ENV=production`. Leave `SF_AGENT_TRANSPORT` unset or set it to `rest`. `cli` cannot run there.

`SF_AGENT_TRANSPORT=cli` is the local-only path. It shells out to `sf agent preview` as `pricing-demo`. The session route then sends the utterance `json_format`, which turns on JSON responses. The action inside the agent is named `set_json_format`. The utterance that works is `json_format`.

See `docs/AGENT_ARCHITECTURE.md` for agent flows and variable persistence.

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
SF_AGENT_TRANSPORT=rest
SF_TARGET_ORG=pricing-demo
SF_AGENT_NAME=Quoting_Agent
SF_INSTANCE_URL=https://trailsignup-f46e26a8bd57ae.my.salesforce.com
SF_AGENT_ID=0Xxak000004hFW9CAM
SF_ORG_ID=00Dak00001QTif8EAD
EXTERNAL_APP_KEY=<consumer key from the External Client App>
EXTERNAL_APP_SECRET=<consumer secret from the External Client App>
REACT_APP_SF_INSTANCE_URL=https://trailsignup-f46e26a8bd57ae.my.salesforce.com
TOKEN_TTL_SECONDS=3600
LOG_LEVEL=info
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
- Real Agentforce agent integration on `pricing-demo`
- Server-side session initialization with JSON mode
- Dark/light theme with full responsiveness
- Mobile optimizations
- JSON response inspector for debugging
- E2E test scripts for full workflow validation

🚀 **Ready for**
- Customer demos on `pricing-demo`
- Heroku, using `SF_AGENT_TRANSPORT=rest` and the External Client App
