# Agentforce Intelligent Quoting - Presentation App

A visually stunning interactive presentation showcasing the Quoting Agent workflow, built with React and Framer Motion.

## Overview

This is a slide-based presentation that educates prospects and stakeholders on how the Agentforce Intelligent Quoting system works. It walks through:

1. **Value Statement** - The benefits of intelligent quoting
2. **The Challenge** - Current pain points in manual quoting
3. **Our Solution** - How the conversational agent solves these problems
4. **Step 1: Account Selection** - Find and select customer accounts
5. **Step 2: Product Search** - Intelligent product discovery
6. **Step 3: Shopping Cart & Quote** - Build and generate quotes
7. **Step 4: Request for Quote** - Submit and track quotes

## Features

- 🎨 **Beautiful Gradient Design** - Modern dark theme with cyan/blue gradients
- ⚡ **Smooth Animations** - Powered by Framer Motion
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate
- 📱 **Responsive Design** - Works on desktop and tablet
- 🍞 **Breadcrumb Navigation** - Visual progress tracking
- 🤖 **Agentforce Branding** - Built-in Agentforce logo
- 📊 **Visual Examples** - Shopping cart preview, quote summary, and more

## Quick Start

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Server Logging

The server logs to stdout with configurable levels. Set `LOG_LEVEL` environment variable:

```bash
# Default (warnings + errors only)
npm run dev

# Verbose mode (see all API interactions)
LOG_LEVEL=info npm run dev

# Debug mode (full payloads and SF CLI commands)
LOG_LEVEL=debug npm run dev
```

**Available levels**: `error`, `warning` (default), `info`, `debug`

#### Debug Query Parameter

Include `?debug=true` to get full Salesforce CLI response:

```bash
curl -X POST 'http://localhost:3001/api/agent/message?debug=true' \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "...", "message": "search for Omega"}'
```

By default, the `raw` field is omitted from responses to reduce payload size. Use `?debug=true` only when debugging agent behavior.

## Navigation

- **Arrow Keys** (← →) - Navigate between slides
- **Click Breadcrumbs** - Jump to any slide
- **Navigation Buttons** - Previous/Next at the bottom
- **Slide Counter** - Shows current position

## Next Steps

The final slide (Slide 7) has a placeholder for the interactive Quoting Agent. This will be replaced with:
- Salesforce OAuth authentication
- Agent Runtime API integration
- Real multi-turn conversations with the agent

## Tech Stack

- React 18 + TypeScript
- Framer Motion (animations)
- Lucide React (icons)
- Modern CSS with gradients
