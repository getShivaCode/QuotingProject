# Agentforce Intelligent Quoting - Presentation App

A visually stunning interactive presentation showcasing the Quoting Agent workflow, built with React and Framer Motion. Includes a live embedded agent on Slide 8.

## Overview

This is a slide-based presentation that educates prospects and stakeholders on how the Agentforce Intelligent Quoting system works. It walks through:

1. **Value Statement** - The benefits of intelligent quoting
2. **The Challenge** - Current pain points in manual quoting
3. **Our Solution** - How the conversational agent solves these problems
4. **Step 1: Account Selection** - Find and select customer accounts
5. **Step 2: Product Search** - Intelligent product discovery
6. **Step 3: Shopping Cart & Quote** - Build and generate quotes
7. **Step 4: Request for Quote** - Submit and track quotes
8. **Try It Live** - Interactive live agent with real Salesforce integration

## Features

- 🎨 **Beautiful Gradient Design** - Modern dark theme with cyan/blue gradients
- ⚡ **Smooth Animations** - Powered by Framer Motion
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate
- 📱 **Responsive Design** - Works on desktop and tablet
- 🍞 **Breadcrumb Navigation** - Visual progress tracking
- 🤖 **Live Agent Integration** - Real Salesforce Agentforce on Slide 8
- 📊 **Visual Examples** - Shopping cart preview, quote summary, and more
- 🔗 **Quote Hyperlinks** - Click quote numbers to open Salesforce records
- 📤 **Improved UX** - Logout/restart buttons with state management
- 🎤 **Speech Recognition** - Optional mic input for chat

## Quick Start

### Development (CLI Mode)

```bash
npm install
npm run dev
```

Opens [http://localhost:3000](http://localhost:3000) with React frontend + Express backend (SF CLI mode).

### Production (REST API Mode)

```bash
NODE_ENV=production npm run start:server
```

Starts Express backend on `http://localhost:3001` (REST API mode, no frontend).

## Environment Configuration

Create `.env.local` in this directory:

```env
# OAuth (for REST API mode)
SF_CLIENT_ID=your_client_id
SF_CLIENT_SECRET=your_client_secret
EXTERNAL_APP_KEY=your_app_key
EXTERNAL_APP_SECRET=your_app_secret

# Salesforce
SF_INSTANCE_URL=https://your-instance.my.salesforce.com
SF_AGENT_ID=your_agent_id
REACT_APP_SF_INSTANCE_URL=https://your-instance.my.salesforce.com

# Server
LOG_LEVEL=debug
TOKEN_TTL_SECONDS=3600
```

See `.env.example` for all available options.

## Server Logging

The server logs to stdout with configurable levels. Set `LOG_LEVEL` environment variable:

```bash
# Verbose mode (see all API interactions)
LOG_LEVEL=info npm run dev

# Debug mode (full payloads with [OAUTH], [REST_API], [CLIENT] markers)
LOG_LEVEL=debug npm run dev
```

**Available levels**: `error`, `warn`, `info`, `debug`

**Debug markers** in logs:
- `[OAUTH]` - Token acquisition and refresh
- `[REST_API]` - Salesforce API calls
- `[CLIENT]` - Client request/response details
- `[RESPONSE]` - Pretty-printed JSON responses

### Query Parameters

Include `?debug=true` to get full response payload:

```bash
curl -X POST 'http://localhost:3001/api/agent/message?debug=true' \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "...", "message": "search for Omega"}'
```

By default, the `raw` field is omitted. Use `?debug=true` only when debugging.

## Navigation

- **Arrow Keys** (← →) - Navigate between slides
- **Click Breadcrumbs** - Jump to any slide
- **Navigation Buttons** - Previous/Next at the bottom
- **Slide Counter** - Shows current position

## Slide 8: Try It Live

The final slide features a fully functional interactive agent:

**Features:**
- Real Salesforce account/product search
- Shopping cart management
- Live quote generation
- Salesforce record links on quote cards
- Logout button (shows "Logging off...", clears state)
- Restart button (creates fresh session)
- Speech recognition (click mic icon)
- Navigation confirmation modal

**UI Components:**
- Left panel: Chat conversation with agent
- Right panel: Real-time visualization (cart, quote, JSON)
- Session ID display (or status during operations)
- Theme toggle (top-right)
- Code icon to view agent response JSON

## npm Scripts

- `npm start` - Start React dev server (port 3000)
- `npm run build` - Build production bundle
- `npm run start:server` - Start Express backend only (port 3001)
- `npm run dev` - Start both frontend + backend concurrently
- `npm test` - Run tests

## Architecture

**Dual-mode backend** (`server.js`):
- **CLI mode** (dev): Uses SF CLI with `execSync` for fast iteration
- **REST mode** (prod): Uses OAuth + direct Salesforce REST API for cloud deployment

**Client-side** (`src/services/agentApi.ts`):
- Session management (create, message, delete)
- Error handling with timeouts
- Pretty-printed JSON logging

**REST API client** (`src/utils/restApiClient.js`):
- OAuth token acquisition (client credentials flow)
- Proactive token refresh (1-hour TTL, 5-minute buffer)
- Session initialization and message sending
- Salesforce Agent API endpoints

## Tech Stack

- React 18 + TypeScript
- Express.js (backend)
- Framer Motion (animations)
- Lucide React (icons)
- Modern CSS with gradients
- OAuth 2.0 (client credentials)
