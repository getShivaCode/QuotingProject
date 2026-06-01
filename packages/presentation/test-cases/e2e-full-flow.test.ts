/**
 * End-to-End Test Case: Complete Quote Creation Flow
 *
 * This test verifies the entire quoting workflow from account selection
 * through product search, cart management, and quote creation.
 *
 * Test Name: Haiku Test (Omega Systems with NH3 Fertilizer)
 * Created: 2026-06-01
 */

interface TestStep {
  name: string;
  message: string;
  expectedInMessage?: string;
  expectedType?: string;
  validateData?: (data: any) => boolean;
}

const E2E_TEST_CASE: TestStep[] = [
  {
    name: "Step 1: Initialize Agent",
    message: "output_format: json show me accounts",
    expectedType: "account_search",
  },
  {
    name: "Step 2: Search for Omega Systems",
    message: "find Omega Systems",
    expectedInMessage: "I found 1 matching account",
    expectedType: "account_search",
    validateData: (data) => {
      return (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].Name === "Omega Systems"
      );
    },
  },
  {
    name: "Step 3: Select Omega Systems Account",
    message: "select 1",
    expectedType: "account_confirm",
    validateData: (data) => {
      return data.account_name === "Omega Systems";
    },
  },
  {
    name: "Step 4: Search for NH3 Fertilizer Products",
    message: "search for NH3 fertilizer",
    expectedInMessage: "I found 10 products",
    expectedType: "product_search",
    validateData: (data) => {
      return Array.isArray(data) && data.length === 10;
    },
  },
  {
    name: "Step 5: Add 10 Units of Urea to Cart",
    message: "add 10 units of urea",
    expectedInMessage: "Urea Prilled has been added",
    expectedType: "cart_update",
    validateData: (data) => {
      return (
        data.itemCount === 1 &&
        data.items[0].productName === "Urea Prilled" &&
        data.items[0].quantity === 10
      );
    },
  },
  {
    name: "Step 6: Create Quote Named 'Haiku test'",
    message: "Create a quote called Haiku test",
    expectedInMessage:
      "Thank you for using me to create the quote! Your cart has now been cleared",
    expectedType: "quote_created",
    validateData: (data) => {
      return (
        data.quoteNumber === "00000058" &&
        data.accountName === "Omega Systems" &&
        data.itemCount === 1 &&
        data.status === "Draft" &&
        data.cart[0].productName === "Urea Prilled" &&
        data.cart[0].quantity === 10
      );
    },
  },
  {
    name: "Step 7: Verify Fresh State - Ready for New Quote",
    message: "test",
    expectedInMessage:
      "How can I assist you with quoting or account selection today",
  },
];

/**
 * Test Case Configuration
 */
export const HAIKU_TEST_CONFIG = {
  name: "Haiku Test - Full Quote Creation Flow",
  description:
    "Complete end-to-end test from account selection through quote creation with proper cart clearing and thank you message",
  account: "Omega Systems",
  product: "NH3 Fertilizer (Urea Prilled)",
  quantity: 10,
  quoteName: "Haiku test",
  expectedQuoteNumber: "00000058",
  expectedTotal: 4.34,
  steps: E2E_TEST_CASE,
};

/**
 * Expected Response Structure for Each Step
 */
export const EXPECTED_RESPONSES = {
  step1: {
    type: "account_search",
    message: "I found X matching accounts. Please select one.",
    data: null,
  },
  step2: {
    type: "account_search",
    message: "I found 1 matching account. Please select one.",
    data: [
      {
        Id: "string",
        Name: "Omega Systems",
        BillingCity: "string",
        BillingState: "string",
        Phone: "string",
      },
    ],
  },
  step3: {
    type: "account_confirm",
    message: "You selected Omega Systems. Would you like to search for products to add to the quote?",
    data: {
      account_id: "string",
      account_name: "Omega Systems",
    },
  },
  step4: {
    type: "product_search",
    message: "I found 10 products matching your search. Which would you like to add?",
    data: [
      {
        sku: "string",
        name: "string",
        description: "string",
        price: "number",
      },
    ],
  },
  step5: {
    type: "cart_update",
    message: "Urea Prilled has been added to your cart. Here is your updated cart.",
    data: {
      grandTotal: 4.34,
      itemCount: 1,
      items: [
        {
          sku: "CHEM-051",
          productName: "Urea Prilled",
          quantity: 10,
          unitPrice: 0.43,
          lineTotal: 4.34,
        },
      ],
    },
  },
  step6: {
    type: "quote_created",
    message:
      "Thank you for using me to create the quote! Your cart has now been cleared. Feel free to end the session or start quote creation again by selecting an account.",
    data: {
      quoteNumber: "00000058",
      quoteId: "string",
      accountName: "Omega Systems",
      grandTotal: 4.34,
      itemCount: 1,
      status: "Draft",
      cart: [
        {
          sku: "CHEM-051",
          productName: "Urea Prilled",
          quantity: 10,
          unitPrice: 0.43,
          lineTotal: 4.34,
        },
      ],
    },
  },
  step7: {
    message:
      "How can I assist you with quoting or account selection today? If you want to start a new quote, please provide an account name or details.",
  },
};

/**
 * Validation Helpers
 */
export const validateResponse = (
  response: any,
  step: TestStep
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (step.expectedType && response.type !== step.expectedType) {
    errors.push(
      `Expected type "${step.expectedType}" but got "${response.type}"`
    );
  }

  if (
    step.expectedInMessage &&
    !response.message.includes(step.expectedInMessage)
  ) {
    errors.push(
      `Expected message to contain "${step.expectedInMessage}" but got "${response.message}"`
    );
  }

  if (step.validateData && response.data && !step.validateData(response.data)) {
    errors.push(`Data validation failed for step: ${step.name}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Test Execution Helper
 */
export const executeTestStep = async (
  sessionId: string,
  step: TestStep,
  apiUrl: string = "http://localhost:3001"
): Promise<{ success: boolean; response: any; errors: string[] }> => {
  try {
    const response = await fetch(`${apiUrl}/api/agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: step.message,
      }),
    });

    const data = await response.json();
    const parsedMessage = JSON.parse(data.agentMessage);

    const validation = validateResponse(parsedMessage, step);

    return {
      success: validation.valid,
      response: parsedMessage,
      errors: validation.errors,
    };
  } catch (error) {
    return {
      success: false,
      response: null,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
};
