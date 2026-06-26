# Quoting Agent - Complete Architecture & Flow Documentation

## Table of Contents
1. [Agent-Level Variables](#agent-level-variables)
2. [Agent Flow & Routing](#agent-flow--routing)
3. [Subagent 1: Account Selection](#subagent-1-account-selection)
4. [Subagent 2: Product Search](#subagent-2-product-search)
5. [Subagent 3: Quote Management](#subagent-3-quote-management)
6. [Variable Flow Across Subagents](#variable-flow-across-subagents)
7. [External Service Interactions](#external-service-interactions)
8. [Key Design Decisions](#key-design-decisions)

---

## Agent-Level Variables

These variables are stored at the agent level and persist throughout the entire session, accessible by all subagents:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT-LEVEL VARIABLES (stored for entire agent session)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • account_id              (string)  - Salesforce Account ID                │
│  • account_name            (string)  - Account Name for display             │
│  • account_confirmed       (boolean) - Flag: account locked in?             │
│  • selected_products       (string)  - JSON array of {sku, quantity}        │
│  • product_search_results  (string)  - Last search results from MCP         │
│  • products_confirmed      (boolean) - Flag: products locked in?            │
│  • quote_total             (string)  - Grand total price (from MCP)         │
│  • quote_description       (string)  - Full quote details JSON              │
│  • quote_id                (string)  - Saved Quote record ID (SF)           │
│  • quote_approved          (boolean) - Flag: quote saved?                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Point**: These persist across subagent transitions. Once `account_id` is set in `account_selection`, it remains available in `product_search` and `quote_management`.

---

## Agent Flow & Routing

```
                              START: User Input
                                    ↓
                        ┌──────────────────────────┐
                        │   agent_router           │
                        │   (START_AGENT)          │
                        │                          │
                        │  - Analyzes user intent  │
                        │  - Routes to subagent    │
                        │  - Does NOT perform work │
                        └──────────────────────────┘
                         /          |          \
                    /            |                \
         intent: create       intent: search      intent: view
         new quote           products          old quotes
              |                   |                  |
              v                   v                  v
        ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
        │ account_    │   │  product_    │   │    quote_    │
        │ selection   │   │  search      │   │  management  │
        └─────────────┘   └──────────────┘   └──────────────┘
```

The `agent_router` is the entry point and traffic controller. It:
- **Never performs work itself** — only routes
- Analyzes user intent (create quote, search products, view history)
- Transitions to the appropriate subagent
- Allows users to switch workflows mid-session

---

## Subagent 1: Account Selection

**Purpose**: Identify and confirm the Salesforce account for the quote.

**Preconditions**: None (entry point for new quote workflow)

**Variables Used/Set**: 
- Sets: `account_id`, `account_name`, `account_confirmed`
- Reads: (none)

### Step-by-Step Flow

#### STEP 1: Ask for Account Name
```
Agent: "Which account is this quote for?"
User: "Acme Corp"
```

#### STEP 2: Search Salesforce Accounts
```
┌─────────────────────────────────────────────────┐
│ STEP 2: Search Salesforce Accounts              │
│ ─────────────────────────────────────────────── │
│ Action: search_accounts                         │
│ Input:  searchTerm = "Acme Corp"                │
│ ┌──────────────────────────┐                    │
│ │ AccountSearchAction      │                    │
│ │ (Apex Class)             │                    │
│ │ - SOQL Query on Accounts │                    │
│ │ - Returns matching accts │                    │
│ └──────────────────────────┘                    │
│ Output: accountResults = [                      │
│   {Id: "001...", Name: "Acme Corp", ...},       │
│   {Id: "002...", Name: "Acme Holdings", ...}    │
│ ]                                               │
│ SET: @variables.product_search_results =        │
│      accountResults                             │
└─────────────────────────────────────────────────┘
```

**AccountSearchAction Details**:
- Executes SOQL: `SELECT Id, Name, BillingCity, BillingState, Phone FROM Account WHERE Name LIKE '%Acme Corp%'`
- Returns JSON array with matching accounts
- Stored in `product_search_results` for display

#### STEP 3: User Confirms Account
```
Agent: "Which account? Here are the matches:
        1. Acme Corp - 001...
        2. Acme Holdings - 002..."
User: "Acme Corp - 001..."
```

#### STEP 4: Set Variables
```
┌─────────────────────────────────────────────────┐
│ STEP 4: Set Variables                           │
│ ─────────────────────────────────────────────── │
│ Action: confirm_account (via @utils.setVariables)
│ SET: @variables.account_id = "001..."           │
│ SET: @variables.account_name = "Acme Corp"      │
│ SET: @variables.account_confirmed = True        │
│ (Variables now persist for rest of session)     │
└─────────────────────────────────────────────────┘
```

#### STEP 5: Transition to Product Search
```
Agent: "Great! Ready to search for products?"
(Transitions to product_search subagent)
```

---

## Subagent 2: Product Search

**Purpose**: Search for products via external MCP pricing server and generate/save quote.

**Preconditions**: 
- `account_id` and `account_name` must be set (from account_selection)
- OR user can provide account info directly if coming from agent_router

**Variables Used/Set**: 
- Reads: `account_id`, `account_name`, `account_confirmed`
- Sets: `product_search_results`, `quote_description`, `quote_id`, `quote_total`

### Step-by-Step Flow

#### STEP 1: Ask What Products User Needs
```
Agent: "What products do you need for Acme?"
User: "I need industrial valves"
```

#### STEP 2: Search Pricing MCP Server
```
┌─────────────────────────────────────────────────┐
│ STEP 2: Search Pricing MCP Server               │
│ ─────────────────────────────────────────────── │
│ Action: search_products                         │
│ Input:  query = "industrial valves"             │
│ ┌──────────────────────────────────────┐        │
│ │ ProductSearchAction (Apex)           │        │
│ │ - Initialize MCP Session             │        │
│ │  (POST /mcp, extract mcp-session-id) │        │
│ │ - Call MCP tool: search_products     │        │
│ │  (semantic search on catalog)        │        │
│ │ - Parse SSE response                 │        │
│ └──────────────────────────────────────┘        │
│         ↓                                       │
│ https://pricingmcp.onrender.com/mcp             │
│ (External Pricing Server)                       │
│         ↓                                       │
│ Output: results = [                             │
│   {sku: "CHEM-008", name: "Heavy Duty Valve",   │
│    desc: "...", unitPrice: 250},                │
│   {sku: "CHEM-045", name: "Safety Relief",      │
│    desc: "...", unitPrice: 150},                │
│   ...                                           │
│ ]                                               │
│ SET: @variables.product_search_results =        │
│      results                                    │
└─────────────────────────────────────────────────┘
```

**ProductSearchAction Details**:
- Calls MCP endpoint with Streamable HTTP (SSE protocol)
- Initializes session: `POST /mcp` with `initialize` method
- Extracts `mcp-session-id` from response headers
- Calls `search_products` tool with semantic search query
- Parses SSE response (looks for `data: ` lines)
- Returns product array with SKU, name, description, unit price

#### STEP 3: Present Results & Ask for Quantities
```
Agent: "Found these products:
        1. CHEM-008: Heavy Duty Valve ($250/ea)
        2. CHEM-045: Safety Relief ($150/ea)
        
        How many of each? And what should we name this quote?"
User: "10x CHEM-008, 5x CHEM-045. Name it: Q-2026-001"
```

#### STEP 4: UNIFIED ACTION - Generate & Save Quote
```
┌─────────────────────────────────────────────────────────┐
│ STEP 4: UNIFIED ACTION - Generate & Save Quote          │
│ ────────────────────────────────────────────────────────│
│ Action: generate_quote                                  │
│                                                         │
│ INPUT - Variable Binding (from earlier):                │
│ • accountId = @variables.account_id                     │
│   (bound with "with accountId = ...")                   │
│ • quoteName = "Q-2026-001"                              │
│   (user-provided input)                                 │
│ • products = [{"sku":"CHEM-008","qty":10},              │
│              {"sku":"CHEM-045","qty":5}]                │
│   (user selections)                                     │
│                                                         │
│ ┌──────────────────────────────────────────┐            │
│ │ GenerateAndSaveQuote (Apex Class)        │            │
│ │ ──────────────────────────────────────── │            │
│ │ PART 1: Call MCP for Pricing             │            │
│ │  • Initialize MCP session                │            │
│ │  • Call MCP tool: calculate_quote        │            │
│ │    with products array & quantities      │            │
│ │  • Parse response: breakdown array +     │            │
│ │    grand_total                           │            │
│ │                                          │            │
│ │ PART 2: Save to Salesforce               │            │
│ │  • Create Opportunity                    │            │
│ │    (AccountId, Amount, StageName)        │            │
│ │  • Create Quote                          │            │
│ │    (OpportunityId, Name, Pricebook2Id)   │            │
│ │  • Create QuoteLineItem                  │            │
│ │    (qty=1, UnitPrice=grandTotal)         │            │
│ │    ^ This triggers Quote.GrandTotal      │            │
│ │      formula calculation                 │            │
│ │  • Query & return Quote record           │            │
│ └──────────────────────────────────────────┘            │
│                                                         │
│ OUTPUT:                                                 │
│ • quoteDetails = formatted quote JSON                   │
│   {product name, desc, qty, unitPrice,                  │
│    lineTotal for each line, grandTotal}                 │
│ • quoteId = "8060..." (SF Quote ID)                     │
│ • quoteNumber = "0000123" (auto-generated)              │
│                                                         │
│ SET: @variables.quote_description = quoteDetails        │
│ SET: @variables.quote_id = quoteId                      │
│ SET: @variables.quote_total = quoteNumber               │
│ (NO USER APPROVAL STEP - saved immediately!)            │
└─────────────────────────────────────────────────────────┘
```

**GenerateAndSaveQuote Details**:

**Part 1 - MCP Call for Pricing**:
1. Initialize MCP session (POST to /mcp with initialize)
2. Extract `mcp-session-id` from response headers
3. Call `calculate_quote` tool with products array and quantities
4. Parse JSON response to extract:
   - Product breakdown array (name, description, quantity, unitPrice, lineTotal)
   - Grand total price

**Part 2 - Salesforce Save**:
1. Create Opportunity record with:
   - AccountId (from parameter)
   - Amount (from MCP grand total)
   - StageName, CloseDate (default values)
   - Pricebook2Id (if applicable)
2. Create Quote record with:
   - OpportunityId (from Opportunity just created)
   - Name (from quoteName parameter)
   - Pricebook2Id
   - Description (optional)
3. Create QuoteLineItem with:
   - QuoteId (from Quote just created)
   - Quantity = 1 (dummy line item)
   - UnitPrice = grandTotal from MCP
   - **Why**: Quote.GrandTotal is a read-only formula field that calculates based on QuoteLineItem totals. By creating this dummy item with the full total, the formula populates correctly.
4. Query the Quote record and return:
   - Full quote details (formatted JSON with line items)
   - Quote ID
   - Quote Number (auto-generated by Salesforce)

#### STEP 5: Display Saved Quote to User
```
Agent: "Your quote is ready!

        Quote #0000123 for Acme Corp
        ─────────────────────────────
        
        Line Items:
        • Heavy Duty Valve (CHEM-008) x10 @ $250 = $2,500
        • Safety Relief (CHEM-045) x5 @ $150 = $750
        
        ─────────────────────────────
        GRAND TOTAL: $5,500
        
        Quote saved! Quote ID: 8060..."
```

**Next Options**:
- User: "Can I see my other quotes?" → Transition to `quote_management`
- User: "Create another quote" → Transition back to `agent_router`
- User: "Done" → End conversation

---

## Subagent 3: Quote Management

**Purpose**: View quote history and details for existing quotes.

**Preconditions**: None (can access from agent_router)

**Variables Used/Set**: 
- Reads: `account_id` (if previously set)
- Sets: `product_search_results`

### Step-by-Step Flow

#### STEP 1: User Specifies Account
```
User: "Show quotes for Acme Corp"
(OR may already have @variables.account_id set from previous workflow)
```

#### STEP 2: Query Quote History
```
┌─────────────────────────────────────────────────┐
│ STEP 2: Query Quote History                     │
│ ─────────────────────────────────────────────── │
│ Action: get_quote_history                       │
│ Input:  accountId = @variables.account_id       │
│         (or extracted from user input)          │
│ ┌──────────────────────────┐                    │
│ │ QuoteHistoryAction       │                    │
│ │ (Apex Class)             │                    │
│ │ - SOQL Query on Quotes   │                    │
│ │  for account via         │                    │
│ │  Opportunity.AccountId   │                    │
│ │ - Returns quote list     │                    │
│ └──────────────────────────┘                    │
│ Output: quotes = [                              │
│   {Id: "8060...", QuoteNumber: "0000123",       │
│    Name: "Q-2026-001", Status: "Draft",         │
│    GrandTotal: 5500, CreatedDate: "..."},       │
│   {Id: "8061...", QuoteNumber: "0000122",       │
│    Name: "Q-2026-002", Status: "Approved",      │
│    GrandTotal: 3250, CreatedDate: "..."}        │
│ ]                                               │
│ SET: @variables.product_search_results =        │
│      quotes                                     │
└─────────────────────────────────────────────────┘
```

**QuoteHistoryAction Details**:
- SOQL Query: `SELECT Id, QuoteNumber, Name, Status, GrandTotal, CreatedDate FROM Quote WHERE Opportunity.AccountId = @accountId ORDER BY CreatedDate DESC`
- Returns array of quotes with:
  - Quote ID
  - Quote Number (auto-generated Salesforce field)
  - Name
  - Status (Draft, Approved, etc.)
  - Grand Total
  - Created Date

#### STEP 3: Display Quote History
```
Agent: "Here are quotes for Acme Corp:

        1. Q-0000123 (Q-2026-001) - Draft - $5,500 - Created 2025-05-20
        2. Q-0000122 (Q-2026-002) - Approved - $3,250 - Created 2025-05-15
        
        Which would you like to see details for? Or create a new quote?"
User: "Show details for quote 0000123"
```

#### STEP 4: Get Specific Quote Details
```
┌─────────────────────────────────────────────────┐
│ STEP 4: Get Specific Quote Details              │
│ ─────────────────────────────────────────────── │
│ Action: get_quote_details                       │
│ Input:  quoteId = "8060..."                     │
│ ┌──────────────────────────┐                    │
│ │ QuoteDetailsAction       │                    │
│ │ (Apex Class)             │                    │
│ │ - SOQL Query on Quote    │                    │
│ │  with full details       │                    │
│ │ - Includes Opportunity   │                    │
│ │  & Account relationships │                    │
│ └──────────────────────────┘                    │
│ Output: quoteDetail = {                         │
│   Id, QuoteNumber, Name, Status,                │
│   GrandTotal, CreatedDate,                      │
│   Opportunity, Account info,                    │
│   QuoteLineItems: [...]                         │
│ }                                               │
└─────────────────────────────────────────────────┘
```

**QuoteDetailsAction Details**:
- SOQL Query includes relationships: Quote → Opportunity → Account
- Returns full quote with:
  - All quote fields (ID, number, name, status, total, dates)
  - Opportunity details
  - Account details
  - QuoteLineItems array (product breakdown)

#### STEP 5: Display Full Quote Details
```
Agent: "Here are the full details for Quote Q-0000123:

        Account: Acme Corp
        Quote Name: Q-2026-001
        Status: Draft
        Created: 2025-05-20
        
        Line Items:
        ───────────────────────────────────────
        Heavy Duty Valve (CHEM-008)
        Quantity: 10 @ $250.00 = $2,500.00
        
        Safety Relief (CHEM-045)
        Quantity: 5 @ $150.00 = $750.00
        ───────────────────────────────────────
        GRAND TOTAL: $5,500.00"
```

**Next Options**:
- User: "Create a new quote" → Transition to `account_selection`
- User: "Go back" → Transition to `agent_router`

---

## Variable Flow Across Subagents

Variables persist at the agent level and are accessible to all subagents. Here's the timeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ agent_router (START)                                                        │
│ • All variables: EMPTY                                                      │
│ • LLM routes to: account_selection                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ account_selection                                                           │
│ • Calls: search_accounts(searchTerm)                                        │
│ • Sets:  product_search_results = accountResults                            │
│ • Calls: confirm_account (via LLM)                                          │
│ • Sets:  ✓ account_id = "001..."                                            │
│          ✓ account_name = "Acme Corp"                                       │
│          ✓ account_confirmed = True                                         │
│ • Transitions to: product_search                                            │
└─────────────────────────────────────────────────────────────────────────────┘
     ↓ (Variables persist across transitions!)
┌───────────────────────────────────────────────────────────────────────────┐
│ product_search (RECEIVES account variables from previous subagent)        │
│ • Can READ: account_id, account_name (set = verified ✓)                   │
│ • Calls: search_products(query)                                           │
│ • Sets:  product_search_results = results                                 │
│ • Calls: generate_quote with:                                             │
│   - products = user input (JSON array)                                    │
│   - accountId = @variables.account_id ← REUSED FROM PREVIOUS              │
│   - quoteName = user input                                                │
│ • Receives: quoteDetails, quoteId, quoteNumber                            │
│ • Sets:  ✓ quote_description = quoteDetails                               │
│          ✓ quote_id = quoteId                                             │
│          ✓ quote_total = quoteNumber                                      │
│ • Transitions to: agent_router (OR quote_management)                      │
└───────────────────────────────────────────────────────────────────────────┘
     ↓ (Variables persist!)
┌───────────────────────────────────────────────────────────────────────────┐
│ quote_management (OR back at agent_router)                                │
│ • Can READ: account_id ← reused from first subagent!                      │
│ • Calls: get_quote_history(accountId)                                     │
│ • OR:     get_quote_details(quoteId) ← can use from product_search!       │
│ • All variables remain available for any future workflow step             │
└───────────────────────────────────────────────────────────────────────────┘
```

**Example Variable Journey**:

```
1. account_selection sets:
   account_id = "001D000000IRFmaIAH"
   account_name = "Acme Corp"
   
2. product_search reads account_id and uses it in generate_quote call
   
3. generate_quote uses @variables.account_id to create Opportunity with 
   the correct AccountId
   
4. Later, quote_management can read @variables.account_id to search 
   for all quotes for that account
   
5. User can switch back to account_selection and search a different account,
   overwriting the variables, and the new account flows through the entire 
   workflow
```

---

## External Service Interactions

### 1. Salesforce (Local - Apex Callouts)

#### AccountSearchAction
- **Purpose**: Search for accounts by name
- **Query**: `SELECT Id, Name, BillingCity, BillingState, Phone FROM Account WHERE Name LIKE '%searchTerm%'`
- **Used By**: account_selection subagent
- **Returns**: JSON array of matching accounts

#### ProductSearchAction
- **Purpose**: Semantic search for products on external MCP server
- **Protocol**: Streamable HTTP (SSE)
- **Flow**:
  1. POST /mcp with `initialize` method
  2. Extract `mcp-session-id` from headers
  3. Call `search_products` tool with query
  4. Parse SSE response
- **Used By**: product_search subagent
- **Returns**: JSON array of products with SKU, name, description, unitPrice

#### GenerateAndSaveQuote
- **Purpose**: Call MCP for pricing calculation AND save quote to Salesforce
- **Two-Part Action**:
  1. **MCP Call** (pricing):
     - Initialize MCP session
     - Call `calculate_quote` tool with products array
     - Parse response for breakdown and grand_total
  2. **Salesforce Save**:
     - Create Opportunity record
     - Create Quote record
     - Create QuoteLineItem with qty=1, UnitPrice=grandTotal (triggers GrandTotal formula)
     - Query and return Quote details
- **Used By**: product_search subagent
- **Returns**: quoteDetails (formatted JSON), quoteId, quoteNumber

#### QuoteHistoryAction
- **Purpose**: Retrieve all quotes for an account
- **Query**: `SELECT Id, QuoteNumber, Name, Status, GrandTotal, CreatedDate FROM Quote WHERE Opportunity.AccountId = @accountId ORDER BY CreatedDate DESC`
- **Used By**: quote_management subagent
- **Returns**: JSON array of quotes

#### QuoteDetailsAction
- **Purpose**: Get full details for a specific quote
- **Query**: `SELECT * FROM Quote WHERE Id = @quoteId` (with Opportunity and Account relationships)
- **Used By**: quote_management subagent
- **Returns**: JSON object with complete quote details

### 2. MCP Server (External HTTP)

**Endpoint**: `https://pricingmcp.onrender.com/mcp`

**Protocol**: Streamable HTTP (SSE - Server Sent Events)
- Uses `Accept: application/json, text/event-stream` header
- Responses are SSE format: `data: <JSON>\n`
- Parser looks for `data: ` prefix lines and extracts JSON

**Session Management**:
- First call: POST /mcp with method `initialize`
- Response includes `mcp-session-id` header
- All subsequent calls use this session ID in `Mcp-Session-Id` header
- Session persists for the duration of the MCP interaction

**Available Tools**:

**Tool 1: search_products** (Semantic Search)
- **Input**: query (string) - e.g., "industrial valves", "ammonia", "sulfuric acid"
- **Output**: 
  ```json
  {
    "products": [
      {
        "sku": "CHEM-008",
        "name": "Heavy Duty Valve",
        "description": "Industrial valve for high-pressure applications",
        "unitPrice": 250
      },
      ...
    ]
  }
  ```

**Tool 2: calculate_quote** (Pricing Calculation)
- **Input**: 
  ```json
  {
    "products": [
      {"sku": "CHEM-008", "quantity": 10},
      {"sku": "CHEM-045", "quantity": 5}
    ]
  }
  ```
- **Output**:
  ```json
  {
    "breakdown": [
      {
        "sku": "CHEM-008",
        "name": "Heavy Duty Valve",
        "quantity": 10,
        "unitPrice": 250,
        "lineTotal": 2500
      },
      {
        "sku": "CHEM-045",
        "name": "Safety Relief",
        "quantity": 5,
        "unitPrice": 150,
        "lineTotal": 750
      }
    ],
    "grand_total": 5500
  }
  ```

---

## Key Design Decisions

### 1. Unified generate_quote Action

**Decision**: Combine MCP pricing call + Salesforce save into single action

**Why**: 
- Atlas Reasoning Engine LLM won't invoke actions with 3+ slot-fill inputs
- Tested extensively: actions with 1 slot-fill work 100% of the time, 3+ never work
- Separate generate+save would require 2+ actions; LLM would hallucinate completion

**Implementation**:
- Single `generate_quote` action with 3 inputs:
  - products (JSON array - slot-fill)
  - accountId (variable-bound with `with accountId = @variables.account_id`)
  - quoteName (user-provided - slot-fill)
- Apex class handles both:
  1. MCP call for pricing
  2. Salesforce DML for save

**Result**:
- Reliable invocation (LLM calls it every time)
- Quote saved immediately (no approval step)
- No user confusion about "is it saved yet?"

### 2. Variable Persistence Across Subagents

**Decision**: Declare variables at agent level (not subagent-local)

**Why**:
- User data flows from account → product → quote
- Avoid asking user for the same info twice
- Enable switching between workflows (e.g., create quote → view history → create new quote)

**Implementation**:
- All variables defined in agent-level `variables:` section
- All subagents can read and write them
- Transitions between subagents preserve variables

**Result**:
- Seamless multi-step workflow
- account_id set once in step 1, reused in step 3
- User can switch workflows without losing context

### 3. Streaming MCP Response Handling

**Decision**: Parse SSE (Server Sent Events) protocol in Apex

**Why**:
- MCP server uses Streamable HTTP with SSE transport
- Simple JSON-RPC won't work; server rejects with "Client must accept text/event-stream"

**Implementation**:
- Add headers: `Accept: application/json, text/event-stream`
- Parse response line-by-line looking for `data: ` prefix
- Extract and parse JSON from data lines

**Result**:
- Compatible with external MCP server format
- No need to build custom adapters

### 4. Dummy QuoteLineItem for GrandTotal

**Decision**: Create QuoteLineItem with qty=1, UnitPrice=grandTotal

**Why**:
- Salesforce Quote.GrandTotal is a read-only formula field
- It calculates automatically from QuoteLineItem totals
- Can't set it directly

**Implementation**:
- After creating Quote, create a QuoteLineItem:
  - Quantity = 1
  - UnitPrice = grand total from MCP response
  - Product2Id = null (dummy item)
- Quote.GrandTotal formula now calculates correctly

**Result**:
- Quote record has accurate grand total
- Salesforce data model compliance

### 5. Routing Subagent (agent_router)

**Decision**: Create dedicated router that never performs work

**Why**:
- Allow users to switch workflows mid-session (create quote → view quotes → create new)
- Prevent LLM from trying to answer questions directly

**Implementation**:
- Router only has `@utils.transition` actions
- Reasoning block instructs: "Always use a transition action. Do NOT help the user directly."
- Three transitions: to_account_selection, to_product_search, to_quote_management

**Result**:
- Clean workflow switching
- LLM focuses on routing, not execution
- Can restart workflow or switch to management mode

---

## Summary

The **Quoting Agent** is a structured, multi-subagent workflow engine with these key characteristics:

| Aspect | Design |
|--------|--------|
| **Entry Point** | agent_router (intent classifier) |
| **Subagents** | 3 specialized: account_selection, product_search, quote_management |
| **Variable Scope** | Agent-level (persist across subagents) |
| **Key Workaround** | Unified generate+save action (LLM slot-fill limitation) |
| **External Calls** | MCP (pricing), Salesforce (accounts, quotes) |
| **User Approval** | Eliminated (quote saves immediately) |
| **Session Management** | Supports multi-turn, workflow switching |

When a user creates a quote, they flow through:

```
agent_router
    ↓
account_selection (find account) → sets account_id, account_name
    ↓
product_search (find products, generate quote) → uses account_id, sets quote_id
    ↓
(Quote is saved immediately - no approval step)
    ↓
User can view it or create another
```

Variables persist throughout, enabling seamless data flow and workflow flexibility.
