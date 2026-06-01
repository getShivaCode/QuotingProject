# E2E Test Cases

## Haiku Test - Full Quote Creation Flow

**Test Name:** `e2e-full-flow.test.ts`  
**Created:** 2026-06-01  
**Status:** ✅ Passing

### Overview

This is a comprehensive end-to-end test that validates the complete quoting workflow from account selection through quote creation.

### Test Flow

1. **Initialize Agent** - Set JSON output format
2. **Search for Omega Systems** - Find account by name
3. **Select Omega Systems** - Confirm account selection
4. **Search for NH3 Fertilizer** - Find products matching query
5. **Add 10 Units of Urea** - Add product to shopping cart
6. **Create Quote "Haiku test"** - Generate quote with proper thank you message
7. **Verify Fresh State** - Confirm cart cleared and agent ready for new quote

### Expected Results

- **Quote Number:** 00000058
- **Account:** Omega Systems
- **Product:** Urea Prilled (10 units @ $0.43/unit)
- **Total:** $4.34
- **Status:** Draft
- **Thank You Message:** Displayed after quote creation
- **Variables Reset:** Yes (ready for next quote)

### Running the Test

**Bash version (quickest):**
```bash
chmod +x test-cases/run-e2e-test.sh
./test-cases/run-e2e-test.sh
```

**TypeScript version:**
```bash
npx ts-node test-cases/run-e2e-test.ts
```

**With custom API URL:**
```bash
API_URL=https://your-api.herokuapp.com ./test-cases/run-e2e-test.sh
```

### Test Data

| Field | Value |
|-------|-------|
| Account | Omega Systems |
| Product | Urea Prilled (NH3 Fertilizer) |
| Quantity | 10 units |
| Quote Name | Haiku test |
| Unit Price | $0.43 |
| Line Total | $4.34 |

### Validation Points

Each test step validates:
- ✅ Correct response type (account_search, account_confirm, product_search, cart_update, quote_created)
- ✅ Expected message content
- ✅ Proper data structure and values
- ✅ Variable state transitions (account confirmed, cart updated, etc.)

### Response Formats

All responses follow the JSON structure:
```json
{
  "type": "account_search|account_confirm|product_search|cart_update|quote_created",
  "message": "brief user-facing message",
  "data": { /* structured data */ },
  "actions": ["available_next_actions"]
}
```

### Notes

- Currently using **Salesforce CLI** via `sf agent preview` commands
- API calls made through Express server proxy (`http://localhost:3001`)
- Test expects dev environment running: `npm run dev`
- Each step has 1-2 second delay to allow agent processing

### Current vs. Future

| Aspect | Current | Future |
|--------|---------|--------|
| Backend | Salesforce CLI | Direct Salesforce REST API |
| Authentication | Org alias | OAuth 2.0 token (env variable) |
| Deployment | Local/CLI required | Heroku-ready |
| Speed | 5-6s per call | Expected <1s per call |

---

**Last Updated:** 2026-06-01  
**Test Created By:** Claude (Haiku 4.5)
