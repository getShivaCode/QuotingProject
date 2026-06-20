# Quoting Agent API - Complete Flow Documentation

## Test Metadata

- **Test Date:** 2026-06-20 (Last Updated)
- **Agent Version:** Quoting_Agent (Latest)
- **Schema:** LOCKED - Strict field naming (camelCase, no variations)
- **Commit:** Latest from main branch
- **Environment:** Local development (Express server + Salesforce CLI)
- **Server:** http://localhost:3001

---

## Schema Validation (LOCKED)

**Important:** All responses now follow a strict locked schema with no field name variations:

| Type | Required Fields | Always Use | Never Use |
|------|-----------------|------------|-----------|
| `account_search` | `Id`, `Name`, `Phone`, `BillingCity`, `BillingState` | Exact capitalization | - |
| `account_confirm` | `data: null` | - | - |
| `product_search` | `sku`, `name`, `description`, `price` | camelCase | - |
| `cart_update` | `items`, `unitPrice`, `lineTotal`, `grandTotal` | camelCase | `productName`, `unit_price`, `subtotal`, `grand_total` |
| `pricing` | `accountName`, `items`, `unitPrice`, `lineTotal`, `grandTotal`, `currency` | camelCase | `products`, `breakdown`, `unit_price`, `subtotal`, `grand_total` |
| `quote_created` | `quoteNumber`, `quoteId`, `quoteName`, `accountName`, `items`, `unitPrice`, `lineTotal`, `grandTotal`, `currency` | camelCase | Alternative field names not allowed |

**Key Requirement:** All array items use `"name"` field (not `productName` or other variations)

---

This document captures the complete quoting workflow with actual curl requests, raw API responses, and detailed summaries.

**Server Requirement:** The Express server must be running on `http://localhost:3001` to test these flows.

```bash
# Start the server
cd packages/presentation
node server.js
```

---

## STEP 1: Create Session

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/session" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Raw Response
```json
{
  "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
}
```

### Summary
Creates a new agent session. Returns a `sessionId` that must be included in all subsequent messages.

---

## STEP 1a: Initialize with JSON Format

### Curl Request
```bash
SESSION="511bdb24-ba51-4478-bd90-5fb7db74c660"
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"output_format: json show me accounts\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"account_search\", \"message\": \"No matching accounts found. Please check for typos or try using a different name or abbreviation. Let me know if you have more details to help refine the search.\", \"data\": [], \"actions\": [\"search_accounts\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "5dcbb765-118d-4022-8be9-67d1da45af49",
        "metrics": {},
        "feedbackId": "646f6b48-33ff-4af5-bb53-104eae76fd7b",
        "planId": "646f6b48-33ff-4af5-bb53-104eae76fd7b",
        "isContentSafe": true,
        "message": "{\"type\": \"account_search\", \"message\": \"No matching accounts found. Please check for typos or try using a different name or abbreviation. Let me know if you have more details to help refine the search.\", \"data\": [], \"actions\": [\"search_accounts\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `account_search`
- **Message:** "No matching accounts found. Please check for typos or try using a different name or abbreviation..."
- **Data:** Empty array (first request was ambiguous)
- **Purpose:** Sets JSON output format and initializes the agent

---

## STEP 2: Search for Accounts

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"find Omega Systems\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"account_search\", \"message\": \"I found 1 matching account. Please select one from the list.\", \"data\": [{\"Phone\":\"(684) 555-3823\",\"BillingState\":\"CA\",\"BillingCity\":\"San Francisco\",\"Name\":\"Omega Systems\",\"Id\":\"001fj00001B9VtWAAV\"}], \"actions\": [\"confirm_account\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "84f57936-2abc-40b9-8655-04f82f7867d5",
        "metrics": {},
        "feedbackId": "ae9c4f5e-5695-4755-91c7-0fa970a7e749",
        "planId": "ae9c4f5e-5695-4755-91c7-0fa970a7e749",
        "isContentSafe": true,
        "message": "{\"type\": \"account_search\", \"message\": \"I found 1 matching account. Please select one from the list.\", \"data\": [{\"Phone\":\"(684) 555-3823\",\"BillingState\":\"CA\",\"BillingCity\":\"San Francisco\",\"Name\":\"Omega Systems\",\"Id\":\"001fj00001B9VtWAAV\"}], \"actions\": [\"confirm_account\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `account_search`
- **Message:** "I found 1 matching account. Please select one from the list."
- **Data:**
  - Account Name: Omega Systems
  - Account ID: 001fj00001B9VtWAAV
  - Phone: (684) 555-3823
  - Location: San Francisco, CA
- **Purpose:** Search and display matching accounts

---

## STEP 3: Select Account

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"select 1\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"account_confirm\", \"message\": \"Omega Systems has been selected and confirmed. Would you like to proceed to search for products to add to your quote?\", \"data\": {\"account_id\":\"001fj00001B9VtWAAV\",\"account_name\":\"Omega Systems\",\"account_confirmed\":true}, \"actions\": [\"to_products\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "a45383b6-b6d2-46a8-b62f-272e66f2597d",
        "metrics": {},
        "feedbackId": "db563a2b-3fbf-44a2-b7d4-427a6baf18e8",
        "planId": "db563a2b-3fbf-44a2-b7d4-427a6baf18e8",
        "isContentSafe": true,
        "message": "{\"type\": \"account_confirm\", \"message\": \"Omega Systems has been selected and confirmed. Would you like to proceed to search for products to add to your quote?\", \"data\": {\"account_id\":\"001fj00001B9VtWAAV\",\"account_name\":\"Omega Systems\",\"account_confirmed\":true}, \"actions\": [\"to_products\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `account_confirm`
- **Message:** "Omega Systems has been selected and confirmed. Would you like to proceed to search for products to add to your quote?"
- **Data:**
  - account_id: 001fj00001B9VtWAAV
  - account_name: Omega Systems
  - account_confirmed: true
- **Purpose:** Confirm account selection and transition to product search

---

## STEP 4: Search for Products (NH3)

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"search for NH3 fertilizer\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"product_search\", \"message\": \"I found 10 NH3 fertilizer-related products. Please select which ones you want quoted.\", \"data\": [{\"sku\":\"CHEM-052\",\"name\":\"Ammonium Nitrate\",\"description\":\"Fertilizer and industrial oxidizer.\"},{\"sku\":\"CHEM-008\",\"name\":\"Ammonia Solution 25%\",\"description\":\"Aqueous ammonia, cleaning and fertilizer base.\"},{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"description\":\"Fertilizer and chemical feedstock.\"},{\"sku\":\"CHEM-024\",\"name\":\"Potassium Carbonate\",\"description\":\"Pearl ash, fertilizer and specialty chemicals.\"},{\"sku\":\"CHEM-045\",\"name\":\"Ammonium Hydroxide 28%\",\"description\":\"Aqueous ammonia, cleaning and lab.\"},{\"sku\":\"CHEM-015\",\"name\":\"Nitric Acid 68%\",\"description\":\"Concentrated nitric acid, industrial grade.\"},{\"sku\":\"CHEM-037\",\"name\":\"Magnesium Sulfate Heptahydrate\",\"description\":\"Epsom salt, technical and agricultural.\"},{\"sku\":\"CHEM-013\",\"name\":\"Potassium Hydroxide Flakes\",\"description\":\"Caustic potash, 90% min. Soap and chemical synthesis.\"},{\"sku\":\"CHEM-050\",\"name\":\"Monoethanolamine\",\"description\":\"MEA, gas treating and surfactants.\"},{\"sku\":\"CHEM-012\",\"name\":\"Sodium Bicarbonate\",\"description\":\"Food and technical grade baking soda.\"}], \"actions\": [\"add_to_cart\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "b31a0329-b727-4525-9458-8bd321e9abbe",
        "metrics": {},
        "feedbackId": "4bbb39ac-bf5e-42ba-be2f-6ee6fe4c2db8",
        "planId": "4bbb39ac-bf5e-42ba-be2f-6ee6fe4c2db8",
        "isContentSafe": true,
        "message": "{\"type\": \"product_search\", \"message\": \"I found 10 NH3 fertilizer-related products. Please select which ones you want quoted.\", \"data\": [...],
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `product_search`
- **Message:** "I found 10 NH3 fertilizer-related products. Please select which ones you want quoted."
- **Data:** 10 products returned:
  1. CHEM-052: Ammonium Nitrate (Fertilizer and industrial oxidizer)
  2. CHEM-008: Ammonia Solution 25% (Aqueous ammonia, cleaning and fertilizer base)
  3. CHEM-051: Urea Prilled (Fertilizer and chemical feedstock)
  4. CHEM-024: Potassium Carbonate (Pearl ash, fertilizer and specialty chemicals)
  5. CHEM-045: Ammonium Hydroxide 28% (Aqueous ammonia, cleaning and lab)
  6. CHEM-015: Nitric Acid 68% (Concentrated nitric acid, industrial grade)
  7. CHEM-037: Magnesium Sulfate Heptahydrate (Epsom salt, technical and agricultural)
  8. CHEM-013: Potassium Hydroxide Flakes (Caustic potash, 90% min. Soap and chemical synthesis)
  9. CHEM-050: Monoethanolamine (MEA, gas treating and surfactants)
  10. CHEM-012: Sodium Bicarbonate (Food and technical grade baking soda)
- **Purpose:** Search and display matching products with descriptions

---

## STEP 5: Add 10 Units of Urea

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"add 10 units of urea\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"cart_update\", \"message\": \"10 units of Urea Prilled have been added to your cart. Here is your updated cart with pricing.\", \"data\": {\"items\":[{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"quantity\":10,\"unitPrice\":0.41,\"lineTotal\":4.13}],\"grandTotal\":4.13}, \"actions\": [\"add_to_cart\", \"remove_from_cart\", \"update_cart_quantity\", \"view_cart\", \"proceed_to_quote\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "c23cedee-e758-4980-a0b5-a13472b88630",
        "metrics": {},
        "feedbackId": "e97405cf-35ed-40ac-9318-9ec3de9a8b25",
        "planId": "e97405cf-35ed-40ac-9318-9ec3de9a8b25",
        "isContentSafe": true,
        "message": "{\"type\": \"cart_update\", \"message\": \"10 units of Urea Prilled have been added to your cart. Here is your updated cart with pricing.\", \"data\": {\"grandTotal\":4.13,\"itemCount\":1,\"items\":[{\"sku\":\"CHEM-051\",\"productName\":\"Urea Prilled\",\"description\":\"Fertilizer and chemical feedstock.\",\"quantity\":10,\"unitPrice\":0.41,\"lineTotal\":4.13}]}, \"actions\": [\"add_to_cart\", \"remove_from_cart\", \"update_cart_quantity\", \"view_cart\", \"proceed_to_quote\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `cart_update`
- **Message:** "10 units of Urea Prilled have been added to your cart. Here is your updated cart with pricing."
- **Data:**
  - SKU: CHEM-051
  - Product Name: Urea Prilled
  - Quantity: 10
  - Unit Price: $0.41
  - Line Total: $4.13
  - Grand Total: $4.13
  - Item Count: 1
- **Purpose:** Add product to cart with automatic pricing calculation

---

## STEP 6: Remove 1 Unit of Urea

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"remove 1 unit of urea\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"cart_update\", \"message\": \"The cart has been updated to 9 units of Urea Prilled. Here is your updated cart with pricing.\", \"data\": {\"items\":[{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"quantity\":9,\"unitPrice\":0.42,\"lineTotal\":3.78}],\"grandTotal\":3.78}, \"actions\": [\"add_to_cart\", \"remove_from_cart\", \"update_cart_quantity\", \"view_cart\", \"proceed_to_quote\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "833d6d65-d3f0-4813-9a60-ec442062757f",
        "metrics": {},
        "feedbackId": "189ff202-ecf4-4a0c-a3db-2751eca18ff8",
        "planId": "189ff202-ecf4-4a0c-a3db-2751eca18ff8",
        "isContentSafe": true,
        "message": "{\"type\": \"cart_update\", \"message\": \"The cart has been updated to 9 units of Urea Prilled. Here is your updated cart with pricing.\", \"data\": {\"grandTotal\":3.78,\"itemCount\":1,\"items\":[{\"sku\":\"CHEM-051\",\"productName\":\"Urea Prilled\",\"description\":\"Fertilizer and chemical feedstock.\",\"quantity\":9,\"unitPrice\":0.42,\"lineTotal\":3.78}]}, \"actions\": [\"add_to_cart\", \"remove_from_cart\", \"update_cart_quantity\", \"view_cart\", \"proceed_to_quote\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `cart_update`
- **Message:** "The cart has been updated to 9 units of Urea Prilled. Here is your updated cart with pricing."
- **Data:**
  - SKU: CHEM-051
  - Quantity: 9 (reduced from 10)
  - Unit Price: $0.42
  - Line Total: $3.78
  - Grand Total: $3.78
- **Purpose:** Remove product quantity from cart with updated pricing

---

## STEP 7: Create a Quote

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"create a quote\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"pricing\", \"message\": \"Here's your quote summary. Enter a name and click Create Quote to proceed.\", \"data\": {\"accountName\":\"Omega Systems\",\"items\":[{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"quantity\":9,\"unitPrice\":0.46,\"lineTotal\":4.15}],\"grandTotal\":4.15,\"currency\":\"USD\"}, \"actions\": [\"create_quote\", \"update_cart_quantity\", \"remove_from_cart\", \"view_cart\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "86493377-44f7-4c59-a95b-1ed03fe3c156",
        "metrics": {},
        "feedbackId": "aae09f6d-7af7-46c7-8ec6-097c568a10d9",
        "planId": "aae09f6d-7af7-46c7-8ec6-097c568a10d9",
        "isContentSafe": true,
        "message": "{\"type\": \"pricing\", \"message\": \"Here is your final pricing for the quote:\\n- Urea Prilled: 9 units at $0.46 each, line total $4.15\\nGrand Total: $4.15 USD\\nPlease provide a quote name and confirm if you're ready to create the quote.\", \"data\": {\"items\":[{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"description\":\"Fertilizer and chemical feedstock.\",\"unit_price\":0.46,\"quantity\":9,\"line_total\":4.15}],\"grand_total\":4.15,\"currency\":\"USD\"}, \"actions\": [\"confirm_quote\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `pricing`
- **Message:** "Here is your final pricing for the quote:\n- Urea Prilled: 9 units at $0.46 each, line total $4.15\nGrand Total: $4.15 USD\nPlease provide a quote name and confirm if you're ready to create the quote."
- **Data:**
  - Account Name: Omega Systems
  - Items:
    - SKU: CHEM-051
    - Name: Urea Prilled
    - Quantity: 9
    - Unit Price: $0.46
    - Line Total: $4.15
  - Grand Total: $4.15
  - Currency: USD
- **Purpose:** Display final pricing and request quote name (UI displays items, message is short)

---

## STEP 8: Provide Quote Name

### Curl Request
```bash
curl -s -X POST "http://localhost:3001/api/agent/message" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"name it Test Quote March 2026\"}"
```

### Raw Response
```json
{
  "agentMessage": "{\"type\": \"quote_created\", \"message\": \"Quote 'Test Quote March 2026' has been created for Omega Systems with a grand total of $4.08 USD.\", \"data\": {\"quoteNumber\":\"00000087\",\"quoteId\":\"0Q0fj000002IkWHCA0\",\"quoteName\":\"Test Quote March 2026\",\"accountName\":\"Omega Systems\",\"items\":[{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"quantity\":9,\"unitPrice\":0.45,\"lineTotal\":4.08}],\"grandTotal\":4.08,\"currency\":\"USD\"}, \"actions\": [\"create_quote\", \"view_history\", \"back\"]}",
  "raw": {
    "messages": [
      {
        "type": "Inform",
        "id": "62fe477a-1c51-4bfb-a2f1-404b2ec6610a",
        "metrics": {},
        "feedbackId": "1ba4a3b1-c4ac-480f-b31d-84ddbdf5595a",
        "planId": "1ba4a3b1-c4ac-480f-b31d-84ddbdf5595a",
        "isContentSafe": true,
        "message": "{\"type\": \"quote_created\", \"message\": \"Quote 'Test Quote March 2026' has been created for Omega Systems. Details:\\n- Quote Number: 00000087\\n- Quote ID: 0Q0fj000002IkWHCA0\\n- Product: Urea Prilled, 9 units at $0.45 each\\n- Grand Total: $4.08 USD\\nThe shopping cart has been cleared.\\nWould you like to create another quote, view quote history, or go back to the main menu?\", \"data\": {\"quoteName\":\"Test Quote March 2026\",\"quoteId\":\"0Q0fj000002IkWHCA0\",\"quoteNumber\":\"00000087\",\"accountName\":\"Omega Systems\",\"products\":[{\"sku\":\"CHEM-051\",\"name\":\"Urea Prilled\",\"quantity\":9,\"unit_price\":0.45,\"line_total\":4.08}],\"grand_total\":4.08,\"currency\":\"USD\",\"cartEmpty\":true}, \"actions\": [\"new_quote\", \"view_quote_history\", \"back\"]}",
        "result": [],
        "citedReferences": []
      }
    ],
    "agentApiName": "Quoting_Agent",
    "sessionId": "511bdb24-ba51-4478-bd90-5fb7db74c660"
  }
}
```

### Summary
- **Type:** `quote_created`
- **Message:** "Quote 'Test Quote March 2026' has been created for Omega Systems with a grand total of $4.08 USD."
- **Data:**
  - Quote Number: 00000087
  - Quote ID: 0Q0fj000002IkWHCA0
  - Quote Name: Test Quote March 2026
  - Account Name: Omega Systems
  - Items:
    - SKU: CHEM-051
    - Name: Urea Prilled
    - Quantity: 9
    - Unit Price: $0.45
    - Line Total: $4.08
  - Grand Total: $4.08
  - Currency: USD
- **Purpose:** Create quote, return confirmation with all quote details and line items (UI displays full card)

---

## Response Type Summary

The agent uses the following response types in JSON mode:

| Type | Purpose | When Used |
|------|---------|-----------|
| `account_search` | Display account search results | When searching for accounts |
| `account_confirm` | Confirm selected account | After selecting an account |
| `product_search` | Display product search results | When searching for products |
| `cart_update` | Show updated cart with pricing | When adding/removing items |
| `pricing` | Display final pricing before quote | When requesting quote creation |
| `quote_created` | Confirm quote creation | After quote is saved |

---

## Running the Test Flow

1. **Start the server:**
   ```bash
   cd packages/presentation
   node server.js
   ```

2. **Run the capture script:**
   ```bash
   chmod +x salesforce/agent-api-flows/capture-agent-responses.sh
   ./capture-agent-responses.sh
   ```

3. **View the output** to see all agent responses in JSON format with detailed pricing, product details, and account information.

---

## Notes

- All prices are dynamically calculated based on the pricing MCP
- The agent automatically matches product names to SKUs
- Quantities are case-insensitive ("10 units of urea" → matched to CHEM-051)
- The cart persists across messages within a session
- Session ID must be included in all message requests
