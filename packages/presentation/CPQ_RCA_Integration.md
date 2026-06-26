# Architectural Blueprint: Implementing a Salesforce Revenue MCP Server
**Target Audience:** Integration Engineers, Systems Architects, and AI Tooling Builders  
**Scope:** Model Context Protocol (MCP) Server construction for Legacy CPQ (`SBQQ`) and Revenue Cloud Advanced (Native RLM / `PlaceSalesTransaction`), featuring Automated User OAuth Auth, Custom Configuration Engines, and Dynamic BOM Generation.

---

## 1. System Architecture & High-Level Overview

An AI Agent (such as Claude Desktop or a custom LLM runtime) struggles with multi-step stateful workflows due to token memory limits and error-handling overhead. This server bridges that gap by wrapping complex multi-endpoint Salesforce transactions into atomic, predictable tools exposed over standard I/O streams using the **Model Context Protocol**.


> Use code with caution.

```text
┌──────────────┐   MCP Tools   ┌──────────────┐   REST API (PKCE Flow)   ┌─────────────────────────────────┐
│   AI Agent   ├──────────────►│  MCP Server  ├─────────────────────────►│         Salesforce Core         │
│   Context    │               │  (Node.js)   │                          │      (CPQ Engine / RLM / BRE)   │
└──────────────┘               └──────┬───────┘                          └─────────────────────────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │  Express Local Server  │
                          │ (OAuth Callback :3000) │
                          └────────────────────────┘
```

### Core Responsibilities of the Builder
1. **Maintain Stdio Transport Layer**: Secure communications via raw JSON-RPC on standard streams.
2. **Abstract State Management**: Prevent the LLM from managing temporary record IDs or half-calculated states.
3. **Handle Identity Proxying**: Secure individual user sessions seamlessly via PKCE and local endpoint captures.

---

## 2. Secure User Authentication Layer (OAuth 2.0 + PKCE + Express Listener)

To avoid exposing passwords to the LLM or relying on single background integration users, this server runs an **Authorization Code Flow with PKCE** paired with an internal background Express server.

### The Express Callback Strategy
The MCP server spins up a background HTTP service listening locally. When the LLM provides the generated OAuth link, the human authenticates natively via the browser. The browser redirects to our listener, which completes the code-to-token transaction and signals the core thread to proceed.

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import crypto from "crypto";
import axios from "axios";

const app = express();
const CALLBACK_PORT = 3000;

// Token & Session Storage Primitives
interface UserSession {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  consumerKey: string;
  issuedAt: number;
}
const activeSessions = new Map<string, UserSession>();
const pkceSessionStore = new Map<string, { 
  codeVerifier: string; instanceUrl: string; consumerKey: string; redirectUri: string;
  resolveCallback: (userId: string) => void;
}>();

// PKCE Cryptographic Helpers
function generatePkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// Background Express Server Redirect Hook
app.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const sessionCtx = pkceSessionStore.get(state);

  if (!sessionCtx) return res.status(400).send("Session Expired");

  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: sessionCtx.consumerKey,
    redirect_uri: sessionCtx.redirectUri,
    code_verifier: sessionCtx.codeVerifier
  });

  const response = await axios.post(`${sessionCtx.instanceUrl}/services/oauth2/token`, tokenParams.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  const userId = response.data.id.split("/").pop();
  activeSessions.set(userId, {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    instanceUrl: response.data.instance_url,
    consumerKey: sessionCtx.consumerKey,
    issuedAt: Date.now()
  });

  sessionCtx.resolveCallback(userId);
  res.send("<h1>Authenticated successfully! Return to your AI Chat Agent.</h1>");
});

app.listen(CALLBACK_PORT);
```

### Automatic Token Renewal Mechanics
Before calling any pipeline endpoint, the server verifies token age. If expiration is imminent, it triggers a background refresh using the saved offline grant.

```typescript
async function getOrRefreshValidToken(userId: string): Promise<string> {
  const session = activeSessions.get(userId);
  if (!session) throw new Error("Authentication Required");

  // Check if session token is nearing 2-hour lifespan limit
  if (Date.now() - session.issuedAt < 110 * 60 * 1000) {
    return session.accessToken;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
    client_id: session.consumerKey
  });

  const response = await axios.post(`${session.instanceUrl}/services/oauth2/token`, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  session.accessToken = response.data.access_token;
  session.issuedAt = Date.now();
  activeSessions.set(userId, session);
  return session.accessToken;
}
```

---

## 3. Legacy CPQ (`SBQQ`) Orchestration Pipeline

Legacy CPQ utilizes a multi-step, memory-managed layout using `SBQQ.ServiceRouter`. The builder must handle three distinct server hops to safely save a calculated quote line.

```typescript
async function executeLegacyCpqPipeline(args: any, token: string, instanceUrl: string) {
  const routerUrl = `${instanceUrl}/services/apexrest/SBQQ/ServiceRouter`;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // HOOP 1: Hydrate Product Entries into an Uncalculated Memory Model Layout
  const adderPayload = {
    context: JSON.stringify({
      quote: { record: { attributes: { type: "SBQQ__Quote__c" }, SBQQ__PricebookId__c: args.pricebookId }, lineItems: [] },
      products: args.products.map((p: any) => ({ record: { attributes: { type: "Product2" }, Id: p.productId } })),
      groupKey: 0
    })
  };
  const step1Res = await axios.post(`${routerUrl}?loader=SBQQ.QuoteAPI.QuoteProductAdder`, adderPayload, { headers });
  const quoteModel = JSON.parse(step1Res.data);

  // Apply individual quantities passed by the agent
  quoteModel.lineItems.forEach((line: any) => {
    const matchingInput = args.products.find((p: any) => p.productId === line.record.SBQQ__Product__c);
    if (matchingInput) line.record.SBQQ__Quantity__c = matchingInput.quantity;
  });

  // HOOP 2: Pass Hydrated Payload to Managed Calculation Engine
  const calcPayload = { context: JSON.stringify({ quote: quoteModel, callbackClass: null }) };
  const step2Res = await axios.post(`${routerUrl}?loader=SBQQ.QuoteAPI.QuoteCalculator`, calcPayload, { headers });
  const calculatedQuote = JSON.parse(step2Res.data);

  // HOOP 3: Persist State to the Salesforce Database
  const savePayload = { context: JSON.stringify(calculatedQuote) };
  const step3Res = await axios.post(`${routerUrl}?saver=SBQQ.QuoteAPI.QuoteSaver`, savePayload, { headers });
  
  return JSON.parse(step3Res.data);
}
```

---

## 4. Revenue Cloud Advanced (Native RLM) Orchestration Pipeline

The modern **Revenue Cloud Advanced** platform removes managed routers. It uses standard sObjects (`Quote` & `QuoteLineItem`) via an atomic Connect API endpoint called the **Place Sales Transaction (PST) API**.

```typescript
async function executeRcaPipeline(args: any, token: string, instanceUrl: string) {
  // Native Headless Commerce Connect Endpoint Core Namespace
  const rcaUrl = `${instanceUrl}/services/data/v65.0/commerce/sales-transaction/place-quote`;

  const requestBody = {
    quote: {
      name: args.quoteName,
      opportunityId: args.opportunityId,
      pricebook2Id: args.pricebookId,
      accountId: args.accountId
    },
    lineItems: args.lines.map((l: any) => ({
      productId: l.productId,
      quantity: l.quantity
    })),
    configurationOptions: {
      executePricing: true,       // Evaluates out-of-the-box Pricing Procedures
      validateConstraints: true  // Evaluates native Business Rules Engine (BRE) parameters
    }
  };

  const response = await axios.post(rcaUrl, requestBody, {
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
  });

  return response.data; // Synchronous delivery of fully calculated totals
}
```

---

## 5. Addendum: Integrating an External Pricing & Configurator Engine

For complex scenarios where enterprise pricing or hardware validation resides outside of Salesforce (e.g., Logik.io, Tacton, or an internal microservice), the MCP server acts as an **External Orchestration Gateway**.

### 5.1 Flow A: External Pricing Engine (Salesforce still validates constraints)

Use this flow when pricing is controlled by an external engine, but product eligibility and constraint checks remain in Revenue Cloud Advanced.

```text
┌──────────┐     create quote intent     ┌──────────────┐      price request       ┌───────────────────┐
│ AI Agent ├────────────────────────────►│  MCP Server  ├─────────────────────────►│ External Pricing  │
└────┬─────┘                             └─────┬──-─────┘                          │ Engine            │
     │                                         │                                   └─────────┬─────────┘
     │ final quote + totals                    │ priced line items                           │
     │◄────────────────────────────────────────┤◄────────────────────────────────────────────┘
     │                                         │
     │                                         │ place-quote (executePricing=false,
     │                                         │ validateConstraints=true)
     │                                         │                                     ┌───────────────────┐
     │                                         ├────────────────────────────────────►│ Salesforce RCA    │
     │                                         │◄────────────────────────────────────┤ (PST API)         │
     │                                         │ committed quote + validation output │                   │
     │                                         └─────────────────────────────────────┴───────────────────┘
```

The middleware interceptor for this flow can be implemented as follows:

```typescript
async function executeExternalPricingOrchestration(args: any, token: string, instanceUrl: string) {
  // Step 1: Query your external microservice to fetch prices or rules
  const externalEngineUrl = "https://enterprise.internal";
  
  const externalPayload = {
    customerSegment: args.accountTier,
    requestedItems: args.lines.map((l: any) => ({ sku: l.productId, qty: l.quantity }))
  };

  const externalResult = await axios.post(externalEngineUrl, externalPayload, {
    headers: { "X-API-Key": process.env.EXTERNAL_ENGINE_KEY! }
  });
  
  // Step 2: Inject results into the Salesforce RLM schema
  const rcaUrl = `${instanceUrl}/services/data/v65.0/commerce/sales-transaction/place-quote`;
  const syncPayload = {
    quote: { name: args.quoteName, accountId: args.accountId, pricebook2Id: args.pricebookId },
    lineItems: externalResult.data.computedItems.map((item: any) => ({
      productId: item.sku,
      quantity: item.qty,
      // Provide values explicitly, bypassing default Salesforce Pricebook engine
      netUnitPrice: item.calculatedNetPrice,
      listUnitPrice: item.calculatedListPrice
    })),
    configurationOptions: {
      executePricing: false, // SKIP internal pricing lookup to protect external engine overrides
      validateConstraints: true
    }
  };

  const finalResponse = await axios.post(rcaUrl, syncPayload, {
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
  });

  return finalResponse.data;
}
```

### 5.2 Flow B: External Configurator (external bundle expansion + optional Salesforce pricing)

Use this flow when an external configurator resolves valid options/components and returns expanded bundles/BOM structures.

```text
┌──────────┐ configure product intent ┌──────────────┐ configuration request ┌──────────────────────┐
│ AI Agent ├─────────────────────────►│  MCP Server  ├────────────────────-─►│ External Configurator│
└────┬─────┘                          └──────┬───────┘                       └──────────┬───────────┘
     │                                       │                                   expanded BOM +
     │ final quote + lines                   │                                   rules metadata
     │◄──────────────────────────────────────┤◄─────────────────────────────────────────┘
     │                                       │
     │                                       │ place-quote with one of:
     │                                       │ 1) executePricing=true  (Salesforce re-prices)
     │                                       │ 2) executePricing=false (trust external prices)
     │                                       ├───────────────────────────────────────►┌─────────────────┐
     │                                       │                                        │ Salesforce RCA  │
     │                                       │◄───────────────────────────────────────┤ (PST API)       │
     │                                       │ validation + commit response           │                 │
     │                                       └────────────────────────────────────────┴─────────────────┘
```

```typescript
async function executeExternalConfiguratorOrchestration(args: any, token: string, instanceUrl: string) {
  const configuratorUrl = "https://config.enterprise.internal";
  const rcaUrl = `${instanceUrl}/services/data/v65.0/commerce/sales-transaction/place-quote`;

  // Step 1: Resolve valid components/options externally.
  const configRes = await axios.post(configuratorUrl, {
    accountId: args.accountId,
    opportunityId: args.opportunityId,
    requestedItems: args.lines
  }, {
    headers: { "X-API-Key": process.env.EXTERNAL_CONFIG_KEY! }
  });

  // Step 2: Decide pricing authority at runtime.
  const pricingAuthority = args.pricingAuthority ?? "salesforce"; // "salesforce" | "external"
  const executePricing = pricingAuthority === "salesforce";

  const placeQuotePayload = {
    quote: {
      name: args.quoteName,
      opportunityId: args.opportunityId,
      accountId: args.accountId,
      pricebook2Id: args.pricebookId
    },
    lineItems: configRes.data.expandedItems.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      ...(executePricing ? {} : {
        netUnitPrice: item.netUnitPrice,
        listUnitPrice: item.listUnitPrice
      })
    })),
    configurationOptions: {
      executePricing,
      validateConstraints: true
    }
  };

  const finalResponse = await axios.post(rcaUrl, placeQuotePayload, {
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
  });

  return finalResponse.data;
}
```

### 5.3 Flow Critique and Recommended Edits

The original single "external engine" flow is directionally correct, but it hides critical control points. These edits improve reliability and auditability:

1. **Separate pricing and configuration responsibilities explicitly**: a single external-engine box obscures whether you are overriding price, structure, or both.
2. **Define pricing authority per request**: if both systems can price the same line, reconciliation drift is likely. Enforce one authority (`salesforce` or `external`).
3. **Keep `validateConstraints: true` unless formally waived**: this prevents invalid combinations when external engines send stale bundles.
4. **Return line-level diagnostics**: include external rule IDs/version/timestamp for audit and dispute resolution.
5. **Add idempotency and correlation IDs**: pass a stable key from MCP to external systems and Salesforce to avoid duplicate commits on retries.
6. **Fail closed on partial pricing payloads**: if `executePricing=false` and pricing fields are incomplete, reject before calling `place-quote`.

---

## 6. Functional Validation: Configurations & BOM Generation

### Will this setup take configurations into account?
**Yes.** However, the implementation depends on the platform version:
* **Legacy CPQ**: Configuration is governed by a background Apex payload wrapper (`ConfigurationModel`). If parent items have active options or features, passing flat standalone IDs to `QuoteProductAdder` without configuration payload mappings will trigger validation blocks if required fields are missing.
* **Revenue Cloud Advanced (RCA)**: Configuration uses **Product Catalog Management (PCM)** rules and context definitions. When `validateConstraints` is set to `true`, the native execution rules engine processes product constraints during transaction ingestion.

### Dynamic BOM (Bill of Materials) Cart Resolution
In advanced business workflows, adding a primary product to a cart can automatically generate an underlying Bill of Materials (BOM). This is handled via the following mechanisms:

1. **Native Revenue Cloud Advanced BOM Mapping**:
   When you send a high-level parent bundle item to the `place-quote` API, Salesforce automatically looks up your active **Product Structure Hierarchy** and generates corresponding nested component lines. The API handles child line expansions automatically without requiring explicit layout parsing from your client code.

2. **Automated LLM BOM Inference Over MCP**:
   Because the AI agent can read documentation and schemas via the MCP interface, it can infer when a core parent item requires secondary components. It can dynamically compile the entire `lines` input array *before* making the request, as shown below:

```json
{
  "comment": "LLM intelligently expanded a 'Server Rack Bundle' into its composite BOM parts before calling the tool",
  "quoteName": "Agent-Assisted Infrastructure Deal",
  "lines": [
    { "productId": "01tParentServerRack001", "quantity": 1 },
    { "productId": "01tChildPowerSupply002", "quantity": 4 },
    { "productId": "01tChildBladeModule003", "quantity": 16 },
    { "productId": "01tChildCoolingFan004", "quantity": 2 }
  ]
}
```

---

## Appendix A. Salesforce to Pricefx Real-Time Pricing Integration (Vetted)

### A.1 Executive Summary
This appendix defines a headless, real-time integration between Salesforce Sales Cloud and Pricefx so sellers can retrieve context-aware prices directly from Salesforce quote flows. Pricing decisions can consider account tier, region, volume, and custom policy constraints without requiring users to leave Salesforce.

### A.2 Architecture Overview and Data Flow (Aligned to Section 5 Scenarios)

```text
┌─────────────────┐
│ Salesforce User │
└────────┬────────┘
         │
         ▼ (Clicks "Fetch Pricefx Pricing" or triggers save automation)
┌───────────────────────────────────────┐       (1) Auth / (2) Pricing/Config Request       ┌──────────────────────┐
│ Salesforce Quote + QuoteLineItems     ├──────────────────────────────────────────────────►│ Pricefx API Gateway  │
└───────────────────────┬───────────────┘                                                   └──────────┬───────────┘
                        │                                                                              │
                        │                                                                              ▼
┌───────────────────────▼───────────────┐                                                    ┌──────────────────────┐
│ Field Updates in Salesforce           │◄───────────────────────────────────────────────────┤ Pricefx Logic Engine │
└───────────────────────────────────────┘      (3) computedItems/expandedItems + errors      └──────────────────────┘
```

High-level flow:
1. **Trigger**: Quote line data changes via UI action, Flow, or Apex trigger.
2. **Authentication**: Salesforce uses a secure credential path to obtain or refresh a bearer token.
3. **External call**: Salesforce/MCP sends quote and line context to Pricefx for either pricing (`computedItems`) or configuration expansion (`expandedItems`).
4. **Processing**: Pricefx evaluates pricing and/or configuration logic.
5. **Response and Commit**: Salesforce maps returned lines to the same RCA `place-quote` shape used in Section 4/5 (`quote`, `lineItems`, `configurationOptions`).

### A.3 Detailed Component Architecture

#### A.3.1 Salesforce (Source / Consumer)
- **Trigger mechanisms**: Apex trigger on `QuoteLineItem` (careful with recursion/governor limits), invocable Apex from Flow, or explicit UI action.
- **State model**: Salesforce remains source of truth for CRM objects; external pricing outputs are transient inputs used to update quote fields.
- **Credential model**: Store endpoints and credentials in **Named Credentials** and **External Credentials**; avoid hard-coded secrets.

#### A.3.2 Pricefx (Target / Provider)
- **API layer**: REST endpoints over TLS.
- **Pricing service**: Formula service (for example, `Salesforce_Live_Quote_Pricing`) evaluates context and returns output elements.

### A.4 API Specification and Interface Contracts

#### A.4.1 Authentication Contract
- **Protocol**: HTTPS `POST`
- **Endpoint pattern**: `https://<your-instance>/<your-partition>/auth/login`

Request payload:
```json
{
  "username": "sf_integration_user",
  "password": "SecurePassword123!"
}
```

Response payload:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6Wy..."
}
```

#### A.4.2 External Pricing Contract (Aligned with `executeExternalPricingOrchestration`)
- **Protocol**: HTTPS `POST`
- **Endpoint pattern**: `https://<your-instance>/<your-partition>/pricing/evaluate`
- **Required headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token_here>`

Request payload:
```json
{
  "quoteName": "Agent-Assisted Infrastructure Deal",
  "accountId": "001xx000003NGpYAAW",
  "opportunityId": "006xx000004TQkBAAW",
  "pricebookId": "01sxx0000002abcAAA",
  "accountTier": "Enterprise",
  "requestedItems": [
    { "sku": "01tParentServerRack001", "qty": 1 },
    { "sku": "01tChildPowerSupply002", "qty": 4 }
  ]
}
```

Response payload:
```json
{
  "computedItems": [
    {
      "sku": "01tParentServerRack001",
      "qty": 1,
      "calculatedListPrice": 3200.0,
      "calculatedNetPrice": 2890.0
    },
    {
      "sku": "01tChildPowerSupply002",
      "qty": 4,
      "calculatedListPrice": 190.0,
      "calculatedNetPrice": 160.0
    }
  ]
}
```

#### A.4.3 External Configurator Contract (Aligned with `executeExternalConfiguratorOrchestration`)
- **Protocol**: HTTPS `POST`
- **Endpoint pattern**: `https://<your-instance>/<your-partition>/configuration/resolve`
- **Required headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token_here>`

Request payload:
```json
{
  "quoteName": "Agent-Assisted Infrastructure Deal",
  "accountId": "001xx000003NGpYAAW",
  "opportunityId": "006xx000004TQkBAAW",
  "requestedItems": [
    { "productId": "01tParentServerRack001", "quantity": 1 }
  ]
}
```

Response payload:
```json
{
  "expandedItems": [
    {
      "productId": "01tParentServerRack001",
      "quantity": 1,
      "netUnitPrice": 2890.0,
      "listUnitPrice": 3200.0
    },
    {
      "productId": "01tChildPowerSupply002",
      "quantity": 4,
      "netUnitPrice": 160.0,
      "listUnitPrice": 190.0
    }
  ]
}
```

### A.5 Field Mapping Schema

| Salesforce/RCA Field | External Payload Field | External Response Field | Data Type | Notes |
| --- | --- | --- | --- | --- |
| `quote.accountId` | `accountId` | - | String | Matches Section 4/5 payload shape |
| `quote.opportunityId` | `opportunityId` | - | String | Optional in some flows, included here for alignment |
| `quote.pricebook2Id` | `pricebookId` | - | String | External name maps to RCA field |
| `lineItems[].productId` | `requestedItems[].sku` or `requestedItems[].productId` | `computedItems[].sku` or `expandedItems[].productId` | String | Pricing flow may use `sku`; configurator flow uses `productId` |
| `lineItems[].quantity` | `requestedItems[].qty` or `requestedItems[].quantity` | `computedItems[].qty` or `expandedItems[].quantity` | Decimal | Keep a consistent transform layer in MCP |
| `lineItems[].listUnitPrice` | - | `calculatedListPrice` or `listUnitPrice` | Currency | Used when `executePricing=false` |
| `lineItems[].netUnitPrice` | - | `calculatedNetPrice` or `netUnitPrice` | Currency | Used when `executePricing=false` |
| `configurationOptions.executePricing` | `pricingAuthority` (derived) | - | Boolean/Enum | `salesforce` => `true`, `external` => `false` |

### A.6 Error Handling, Resilience, and Performance

#### A.6.1 Performance Targets
- **Target roundtrip**: under 1500 ms end-to-end (environment dependent).
- **Bulk guidance**: for large quotes, use chunking or async orchestration to avoid transaction timeouts.

#### A.6.2 Error Management Strategy
- **Timeout/network failures** (for example, 504): preserve prior pricing values; show actionable user feedback; retry with backoff when safe.
- **Authentication failures** (401): clear token cache, refresh token path, retry once with correlation ID.
- **Functional pricing rejections**: map Pricefx business errors to quote-line error fields for user correction.

Example functional error payload:
```json
{
  "errors": [
    { "message": "Requested quantity exceeds available tier constraints." }
  ]
}
```

### A.7 Vetting Notes and Recommended Edits Applied
1. **Endpoint syntax corrected**: removed malformed `https://<instance>://<partition>` style and replaced with a valid path pattern.
2. **Security posture improved**: this appendix assumes credentials are externalized via Named Credentials/External Credentials, not embedded in code.
3. **Operational guidance tightened**: trigger strategy notes now call out governor-limit and recursion concerns.
4. **Performance guidance generalized**: avoids hard absolute platform limits where org/network variance is expected.
5. **Error semantics clarified**: separates technical faults from business-rule rejections and recommends deterministic retry behavior.

