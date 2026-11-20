# Setup

How to point this repo at a Salesforce org and run the live agent. What the app is, and how to start it, is in [README.md](README.md).

The demo org is `pricing-demo`. The old `trailsignup` alias points at an expired org. Do not use it.

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

Agentforce is already on. The admin user has the Copilot admin and user permission sets. `Copilot_for_Salesforce` is the org's default employee agent and is not the demo agent.

## 1. Authorize the CLI

```bash
sf config set target-org pricing-demo
sf org display --target-org pricing-demo
```

If the alias is missing:

```bash
sf org login web --alias pricing-demo --set-default
```

## 2. Deploy Apex, the flow, the remote site, and the price book

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

`salesforce/sfdx-project.json` is source API 62.0. That manifest cannot deploy the agent. It also rejects `McpServerDefinition`, because `url` is not valid on that type at this API version. Leave `mcpServerDefinitions/Pricing_MCP` undeployed. Apex calls `https://pricingmcp.onrender.com/mcp` itself, and the `PricingMCP` remote site allows that callout.

Do not deploy `bots/Quoting_Agent` or `genAiPlannerBundles` from the previous org. Those files contain the old org's ids. Publishing the authoring bundle creates the runtime in the new org.

### Price book

`GenerateAndSaveQuote` reads `Quoting_Settings__mdt` record `Default`, field `Pricebook_Id__c`. In this repo that value is `01sak00000O15vtAAB`, the standard price book. A blank value makes Apex query `Pricebook2 WHERE IsStandard = true`.

Redeploying `Quoting_Settings.Default` overwrites the org value with the value in source. The agent saves quotes through `GenerateAndSaveQuote`. `Save_Quote_Flow` uses the same custom metadata for the opportunity and quote price book. Its line-item `PricebookEntryId` is still an id from the old org, and the agent does not call that flow.

## 3. Publish the agent

Deploy the authoring bundle with an explicit API 66 manifest. A normal project deploy builds the manifest at API 62.0, and the bundle is not deployable there.

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

Publish creates the Bot. Confirm the id:

```bash
sf org list metadata --metadata-type Bot --target-org pricing-demo
```

`SF_AGENT_ID` for this org is `0Xxak000004hFW9CAM`. The agent type is `AgentforceEmployeeAgent`, so there is no Einstein Agent user.

Do not retrieve the authoring bundle after publish. A retrieve writes `<target>` into `bundle-meta.xml` and locks the bundle to this org.

`sf agent preview start --api-name Quoting_Agent` talks to the published agent. `--authoring-bundle` talks to the draft.

## 4. External Client App

Heroku cannot use the Salesforce CLI. The server in `packages/presentation/src/utils/restApiClient.js` asks for a token with `grant_type=client_credentials`, then calls the Agent API. The Login button does not send the browser to Salesforce. It asks the server to open a session.

In Setup, open **External Client App Manager** and create a local app.

- Enable OAuth. The callback field is required and unused. Set it to `http://localhost:3001/oauth/callback`. Leave the Heroku URL off this form.
- Scopes: Manage user data via APIs (`api`), Access chatbot services (`chatbot_api`), Perform requests at any time (`refresh_token`, `offline_access`), Access the Salesforce API Platform (`sfap_api`).
- Enable Client Credentials Flow.
- Enable **Issue JWT-based access tokens for named users**. Without this, the token call succeeds and every session call returns an empty 404.

Save, then open the app from the manager list. The Run As and IP settings are on **Policies**, not on the create screen.

- Policies, Edit. Under OAuth Flows, enable Client Credentials Flow. Run As appears after that box is checked. Set it to `trailsignup.f46e26a8bd57ae@salesforce.com`.
- Under App Authorization, set IP Relaxation to Relax IP restrictions. Heroku's outbound addresses change.

Copy the consumer key and secret after Salesforce verifies your identity. The key starts with `3MVG9` and is longer than 64 characters. The secret is 64 hex characters. They are not interchangeable. Putting the secret in `EXTERNAL_APP_KEY` returns `invalid_client_id`.

## 5. Environment

Create `packages/presentation/.env.local` from `.env.example`. That file is gitignored. The server reads it once at startup, so restart Node after any change.

```env
SF_AGENT_TRANSPORT=rest
SF_TARGET_ORG=pricing-demo
SF_AGENT_NAME=Quoting_Agent
SF_INSTANCE_URL=https://trailsignup-f46e26a8bd57ae.my.salesforce.com
SF_AGENT_ID=0Xxak000004hFW9CAM
SF_ORG_ID=00Dak00001QTif8EAD
EXTERNAL_APP_KEY=<consumer key>
EXTERNAL_APP_SECRET=<consumer secret>
REACT_APP_SF_INSTANCE_URL=https://trailsignup-f46e26a8bd57ae.my.salesforce.com
TOKEN_TTL_SECONDS=3600
LOG_LEVEL=info
```

`SF_AGENT_TRANSPORT` chooses the client:

- `rest` uses the External Client App.
- `cli` shells out to `sf agent preview` as `SF_TARGET_ORG`. Local only.
- Unset: REST when both `EXTERNAL_APP_KEY` and `EXTERNAL_APP_SECRET` are set, otherwise CLI.

`NODE_ENV` does not choose the transport. `npm run dev` and `npm run start:server` both start the server with `NODE_ENV=production`.

`REACT_APP_SF_INSTANCE_URL` is baked into the React build. Set it before `npm start` or `npm run build`. Quote links use it.

The REST client caches the access token for `TOKEN_TTL_SECONDS` (default 3600) and requests a new one five minutes before that window ends. Salesforce's client-credentials response does not include `expires_in`.

Heroku app `headless-quoting` needs the same variables, with `SF_AGENT_TRANSPORT=rest` and `NODE_ENV=production`. Config changes restart the dyno. A swapped key and secret is the failure mode behind `invalid_client_id` in `heroku logs -a headless-quoting`.

## 6. Check that it works

Start the app with `npm run dev` from `packages/presentation`, open slide 8, and log in.

1. "find Omega" returns Omega Industrial Compounders, Omega Synthesis & Processing, and Omega Systems.
2. Select an account, search for a product, add it to the cart, and create a quote.
3. The quote number opens the record on the instance above.

Server tests, from `packages/presentation` with the server already running:

```bash
./test-cases/run-e2e-test.sh
./test-cases/run-e2e-test-rest-api.sh
```

`run-e2e-test-sf-cli.sh` talks to the authoring-bundle draft through `sf agent preview`, not to the published agent.

## Troubleshooting

| What you see | What to change |
|---|---|
| `invalid_client_id` | `EXTERNAL_APP_KEY` is not the consumer key. It must start with `3MVG9`. The 64-character hex value is the secret. |
| Token succeeds, session is an empty 404 | On the External Client App, enable Issue JWT-based access tokens for named users, and include the `refresh_token` scope. |
| Login spins and the server never answers | The Node process was started before `.env.local` changed. Restart it. |
| CLI session fails while parsing JSON | `cliAgentClient.js` has to skip the CLI's plugin warning text. `SF_API_VERSION` must not be passed through to `sf`. |
| Quote link opens the wrong org | `REACT_APP_SF_INSTANCE_URL` still points at the old instance. Rebuild the client after changing it. |
| `sf` says the org is expired | The command is using `trailsignup`. Use `--target-org pricing-demo`. |

Port 3000 or 3001 already in use means a previous `npm run dev` is still running. Stop that process before starting another.

Agent variables and the topic flow are in [docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md).
