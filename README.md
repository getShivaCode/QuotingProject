# Agentforce Intelligent Quoting Platform

A conversational AI-powered presentation and quoting system that showcases how Agentforce intelligently guides users through account selection, product search, shopping cart management, and quote generation.

## Overview

This project demonstrates an end-to-end quoting experience with:
- **8-slide professional presentation** with live embedded agent (Slide 8)
- **Real-time agent interaction** with Salesforce Agentforce backend
- **Dark/Light theme** toggle with responsive mobile design
- **JSON payload inspector** for viewing agent responses
- **Server-side JSON initialization** for clean session setup
- **Salesforce integration** with Agentforce backend

## Project Structure

```
QuotingProject/
├── packages/
│   ├── presentation/              # Main presentation app (8 slides + live agent)
│   │   ├── src/components/        # Slide components, Presentation controller
│   │   ├── src/styles/            # Theme CSS, animations
│   │   └── src/components/        # HeadlessAgentForce chat widget
│   └── headlessAgentForce/       # Standalone agent component
├── salesforce/                    # Salesforce backend & metadata
│   ├── force-app/                # Apex classes, agent bundles
│   ├── specs/                    # Agent specifications
│   └── sfdx-project.json         # Salesforce configuration
├── docs/                          # Documentation
│   └── AGENT_ARCHITECTURE.md     # Agent architecture guide
└── README.md, SETUP.md, STATUS.md
```

## Quick Start

### Development

```bash
# Terminal 1: Start the backend server (required for live agent)
cd packages/presentation
npm install
npm start

# This starts both the presentation slides AND the Express backend server on port 3001
# Open http://localhost:3000 in your browser
```

The backend server initializes agent sessions with JSON mode automatically. No dummy messages needed.

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
8. **Try It Live** - Interactive agent widget with chat interface

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
- **Right Panel**: Order summary visualization
  - Shopping cart with line items and totals
  - Quote display with account, items, and metadata
  - **JSON Toggle** (top-right): Click code icon to view agent response JSON
  - Real Salesforce data displayed as cards

### Testing Agent Flows

Run end-to-end tests for the full quoting workflow:

```bash
cd salesforce/agent-api-flows
./capture-agent-responses.sh
```

This script:
- Creates a session with auto-initialized JSON mode
- Searches for accounts
- Selects an account
- Searches for products
- Adds items to cart
- Creates and names a quote
- Captures all agent responses as JSON

See `docs/AGENT_ARCHITECTURE.md` for detailed flow documentation.

### Building for Production

```bash
cd packages/presentation
npm build
```

Output goes to `build/` directory.

## Salesforce Backend

The `salesforce/` directory contains production Agentforce agent metadata:

- **Agent**: `Quoting_Agent` (v6) - Multi-turn agent orchestrating account → product → quote workflows
- **Apex Actions**: Account/product search, quote generation, history, and details handlers
- **External Integration**: MCP server connection for pricing and semantic product search

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

🤖 **Agent Widget (Slide 8)**
- Multi-turn conversation with mock account/product search
- Click-to-select account and product cards
- Shopping cart with quantity management
- Quote generation and display
- JSON response inspector for debugging
- Login/logout flow
- Typing indicators and smooth animations

📱 **Responsive Design**
- Desktop: Full-width layout with sidebars
- Tablet (≤768px): Stacked layout, compact controls
- Mobile (≤480px): Minimal header, optimized touch targets

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

## Development Notes

- **Default Theme**: Dark mode (toggle at top-right)
- **Keyboard Shortcuts**: Arrow keys to navigate slides
- **Mobile Header**: Salesforce logo centered, theme toggle at top-right (smaller)
- **Agent Widget**: Mock data hardcoded; ready for real Salesforce API integration
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
