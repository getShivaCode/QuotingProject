/**
 * E2E Test Runner
 *
 * Execute the Haiku Test (full quote creation flow)
 * Usage: npx ts-node test-cases/run-e2e-test.ts
 */

import {
  HAIKU_TEST_CONFIG,
  executeTestStep,
} from "./e2e-full-flow.test";

async function runE2ETest() {
  const API_URL = process.env.API_URL || "http://localhost:3001";

  console.log("\n🚀 Starting E2E Test: Haiku Test - Full Quote Creation Flow");
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Create session
    const sessionResponse = await fetch(`${API_URL}/api/agent/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.sessionId;

    if (!sessionId) {
      throw new Error("Failed to create session");
    }

    console.log(`✅ Session created: ${sessionId}\n`);

    let totalPassed = 0;
    let totalFailed = 0;

    // Execute each test step
    for (const step of HAIKU_TEST_CONFIG.steps) {
      console.log(`📋 ${step.name}`);
      console.log(`   Message: "${step.message}"`);

      const result = await executeTestStep(step, API_URL);

      if (result.success) {
        console.log(`   ✅ PASS`);
        if (result.response?.type) {
          console.log(`   Type: ${result.response.type}`);
        }
        totalPassed++;
      } else {
        console.log(`   ❌ FAIL`);
        result.errors.forEach((error) => {
          console.log(`   Error: ${error}`);
        });
        totalFailed++;
      }

      console.log("");

      // Small delay between steps
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // End session
    await fetch(`${API_URL}/api/agent/session/${sessionId}`, {
      method: "DELETE",
    });

    // Summary
    console.log("═".repeat(60));
    console.log(`📊 Test Summary`);
    console.log(`   ✅ Passed: ${totalPassed}/${HAIKU_TEST_CONFIG.steps.length}`);
    console.log(`   ❌ Failed: ${totalFailed}/${HAIKU_TEST_CONFIG.steps.length}`);
    console.log(`   Success Rate: ${((totalPassed / HAIKU_TEST_CONFIG.steps.length) * 100).toFixed(1)}%`);
    console.log("═".repeat(60));

    process.exit(totalFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error(
      "❌ Test Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Run the test
runE2ETest();
