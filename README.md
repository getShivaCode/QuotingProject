# Agentforce Intelligent Quoting Platform

A presentation that walks through account selection, product search, a shopping cart, and quote creation, with a live Agentforce agent on the last slide.

The live agent runs against the `pricing-demo` org. Org setup, the External Client App, and Heroku config are in [SETUP.md](SETUP.md).

## Run it

```bash
cd packages/presentation
npm install
cp .env.example .env.local   # then fill in the values from SETUP.md
npm run dev
```

- Slides: http://localhost:3000
- Agent server: http://localhost:3001
- Hosted app: https://headless-quoting-a41dfa247fb0.herokuapp.com

`npm run dev` starts the React app and the Express server together. Which Salesforce connection the server uses is `SF_AGENT_TRANSPORT` in `.env.local`: `rest` for the External Client App, `cli` for a local `sf` login. Heroku uses `rest`.

Build the slides with `npm run build` in `packages/presentation`. The Express server serves that `build/` directory when it is present.

## Slides

1. Value statement
2. The challenge
3. Our solution
4. Account selection
5. Product search
6. Shopping cart
7. Request a quote
8. Try it live

Slide 8 is the agent. The left side is the chat. The right side shows the cart or the quote. Quote numbers open the Salesforce record. The code icon shows the JSON the agent returned. Arrow keys and the breadcrumb move between slides. The theme toggle is at the top right. Dark is the default.

Leaving slide 8 with a session open asks for confirmation. Logout ends the session. Restart ends it and opens a new one.

## Layout

```
QuotingProject/
├── packages/presentation/     # React slides, Express server, e2e scripts
│   ├── server.js              # Session API. Picks CLI or REST.
│   ├── src/utils/restApiClient.js
│   ├── src/utils/cliAgentClient.js
│   └── .env.example
├── salesforce/                # Agent, Apex, price book setting
├── docs/AGENT_ARCHITECTURE.md
├── README.md                  # This file
└── SETUP.md                   # Org, OAuth, and Heroku
```

## Agent behavior

On every new session the server sends the utterance `json_format`. That turns on JSON responses for the demo UI. The action inside the agent is named `set_json_format`. The utterance that works is `json_format`.

Product search calls `https://pricingmcp.onrender.com/mcp` from Apex. The server wakes that host before opening a session.

End-to-end scripts live in `packages/presentation/test-cases/`. Run them after the server is up. See [SETUP.md](SETUP.md).
