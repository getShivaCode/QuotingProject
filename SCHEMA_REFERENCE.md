# Agent Response Schema Reference (LOCKED)

**Last Updated:** 2026-06-20  
**Status:** PRODUCTION - All field names locked, no variations allowed

## Overview

This document defines the STRICT, LOCKED schema for all Quoting Agent API responses in JSON mode. The agent MUST follow these exact field names and structures. No variations, alternatives, or deviations are permitted.

---

## Schema Definition

### 1. Account Search (`account_search`)

**Purpose:** Return list of matching accounts

```json
{
  "type": "account_search",
  "message": "Brief message (no account details)",
  "data": [
    {
      "Id": "001fj00001B9VtPAAV",
      "Name": "Omega Financial Services",
      "Phone": "(543) 555-3763",
      "BillingCity": "Arlington",
      "BillingState": "VA"
    }
  ],
  "actions": ["confirm_account", "search_accounts"]
}
```

**Required Fields:**
- `Id` (exact capitalization)
- `Name` (exact capitalization)
- `Phone` (exact capitalization)
- `BillingCity` (exact capitalization)
- `BillingState` (exact capitalization)

---

### 2. Account Confirm (`account_confirm`)

**Purpose:** Confirm selected account

```json
{
  "type": "account_confirm",
  "message": "Confirmation message",
  "data": null,
  "actions": ["to_products"]
}
```

**Required Fields:**
- `data` MUST be `null`

---

### 3. Product Search (`product_search`)

**Purpose:** Return list of matching products

```json
{
  "type": "product_search",
  "message": "Brief message (no product details)",
  "data": [
    {
      "sku": "CHEM-008",
      "name": "Ammonia Solution 25%",
      "description": "Aqueous ammonia, cleaning and fertilizer base.",
      "price": 39.51
    }
  ],
  "actions": ["add_to_cart", "search_products"]
}
```

**Required Fields:**
- `sku` (lowercase, no variations)
- `name` (lowercase, NOT `productName` or `product_name`)
- `description` (lowercase)
- `price` (number, no variations)

---

### 4. Cart Update (`cart_update`)

**Purpose:** Return updated shopping cart

```json
{
  "type": "cart_update",
  "message": "Brief message (no pricing details)",
  "data": {
    "items": [
      {
        "sku": "CHEM-008",
        "name": "Ammonia Solution 25%",
        "quantity": 5,
        "unitPrice": 39.51,
        "lineTotal": 197.53
      }
    ],
    "grandTotal": 197.53
  },
  "actions": ["view_cart", "add_more_products", "update_cart_quantity", "remove_from_cart", "proceed_to_quote"]
}
```

**Required Fields:**
- `items` array (NEVER `products`, `breakdown`, or `cart`)
- `name` (NOT `productName`)
- `unitPrice` (camelCase, NEVER `unit_price`)
- `lineTotal` (camelCase, NEVER `subtotal` or `line_total`)
- `grandTotal` (camelCase, NEVER `grand_total`)

---

### 5. Pricing (`pricing`)

**Purpose:** Show final pricing before quote creation

```json
{
  "type": "pricing",
  "message": "Here's your quote summary. Enter a name and click Create Quote to proceed.",
  "data": {
    "accountName": "Omega Technologies",
    "items": [
      {
        "sku": "CHEM-008",
        "name": "Ammonia Solution 25%",
        "quantity": 5,
        "unitPrice": 39.51,
        "lineTotal": 197.53
      }
    ],
    "grandTotal": 197.53,
    "currency": "USD"
  },
  "actions": ["create_quote", "update_cart_quantity", "remove_from_cart", "view_cart"]
}
```

**Message Requirement:**
- MUST be SHORT (< 150 characters)
- MUST NOT repeat product names, quantities, or prices
- Example: "Here's your quote summary. Enter a name and click Create Quote to proceed."

**Required Fields:**
- `accountName` (camelCase)
- `items` array with proper structure
- `unitPrice` (camelCase, NEVER `unit_price`)
- `lineTotal` (camelCase, NEVER `subtotal`)
- `grandTotal` (camelCase, NEVER `grand_total`)
- `currency` (string)

---

### 6. Quote Created (`quote_created`)

**Purpose:** Confirm quote creation with full details

```json
{
  "type": "quote_created",
  "message": "Quote 'Project Alpha' has been created for Omega Technologies with a grand total of $197.53 USD.",
  "data": {
    "quoteNumber": "Q-2026-001234",
    "quoteId": "0Q0fj000002J0MXCA0",
    "quoteName": "Project Alpha",
    "accountName": "Omega Technologies",
    "items": [
      {
        "sku": "CHEM-008",
        "name": "Ammonia Solution 25%",
        "quantity": 5,
        "unitPrice": 39.51,
        "lineTotal": 197.53
      }
    ],
    "grandTotal": 197.53,
    "currency": "USD"
  },
  "actions": ["create_quote", "view_history", "back"]
}
```

**Required Fields:**
- `quoteNumber` (string, MUST be present)
- `quoteId` (camelCase)
- `quoteName` (camelCase)
- `accountName` (camelCase)
- `items` array with proper structure
- `unitPrice` (camelCase, NEVER `unit_price`)
- `lineTotal` (camelCase, NEVER `subtotal`)
- `grandTotal` (camelCase, NEVER `grand_total`)
- `currency` (string)

---

## Field Name Summary

### Always Use
| Purpose | Field Name | Type | Notes |
|---------|-----------|------|-------|
| Product identifier | `sku` | string | Always lowercase |
| Product/Item name | `name` | string | NEVER `productName`, `product_name`, or variants |
| Quantity | `quantity` | number | No variations |
| Unit price | `unitPrice` | number | camelCase, NEVER `unit_price` |
| Line total | `lineTotal` | number | camelCase, NEVER `subtotal`, `line_total` |
| Cart/Order total | `grandTotal` | number | camelCase, NEVER `grand_total` |
| Account name | `accountName` | string | camelCase |
| Quote number | `quoteNumber` | string | camelCase, MUST include |
| Quote ID | `quoteId` | string | camelCase |
| Quote name | `quoteName` | string | camelCase |
| Item array | `items` | array | NEVER `products`, `breakdown`, `cart` |

### Never Use
- ❌ `productName` or `product_name` → Use `name`
- ❌ `unit_price` or `unitprice` → Use `unitPrice`
- ❌ `subtotal`, `line_total`, or `linetotal` → Use `lineTotal`
- ❌ `grand_total` or `grandtotal` → Use `grandTotal`
- ❌ `products`, `breakdown`, `cart` → Use `items`
- ❌ Any snake_case → Use camelCase

---

## Implementation Checklist

- [ ] Agent always uses `items` array (never alternatives)
- [ ] Agent always uses `unitPrice` in camelCase
- [ ] Agent always uses `lineTotal` in camelCase
- [ ] Agent always uses `grandTotal` in camelCase
- [ ] Agent always uses `name` field (never `productName`)
- [ ] Account responses include proper capitalization (Id, Name, Phone, BillingCity, BillingState)
- [ ] Pricing messages are SHORT (< 150 chars)
- [ ] Pricing messages don't repeat details (UI displays card)
- [ ] Quote created responses include `quoteNumber`
- [ ] All responses use camelCase (no snake_case)

---

## Client Expectations

The client (`HeadlessAgentForce.tsx`) now expects ONLY the locked schema:

- ❌ No fallback logic for field name variations
- ❌ No regex extraction from messages
- ❌ No attempt to handle alternative structures
- ✅ Direct property access: `data.items`, `data.unitPrice`, `data.lineTotal`
- ✅ Clean type safety with TypeScript interfaces

---

## Testing

When testing agent responses, verify:

```javascript
// ✅ Correct structure
const response = {
  items: [{sku: "...", name: "...", quantity: 5, unitPrice: 10, lineTotal: 50}],
  grandTotal: 50
}

// ❌ Wrong - will fail client parsing
const response = {
  products: [...], // Wrong field name
  unit_price: 10,  // Wrong case
  grand_total: 50  // Wrong case
}
```

---

## Version History

| Date | Change |
|------|--------|
| 2026-06-20 | Schema locked - all field names fixed, no variations allowed |
| 2026-06-20 | Client updated to expect only locked schema (no fallbacks) |
| 2026-06-20 | Agent updated with explicit schema requirements |
